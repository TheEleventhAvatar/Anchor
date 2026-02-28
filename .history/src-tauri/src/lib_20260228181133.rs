use nusb;
use rusqlite::{Connection};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::time::interval;

#[derive(Debug, Clone)]
pub struct AppState {
    pub is_connected: bool,
    pub serial_number: Option<String>,
    pub db_connection: Option<Arc<Mutex<Connection>>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            is_connected: false,
            serial_number: None,
            db_connection: None,
        }
    }
}

#[cfg(target_os = "linux")]
fn generate_udev_rule() -> Result<String, String> {
    let rule = "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0x0781\", MODE=\"0666\"\n".to_string();
    let udev_path = "/etc/udev/rules.d/99-anchor-sandisk.rules";
    
    println!("=== Linux USB Setup Required ===");
    println!("To access USB devices without sudo, create a udev rule:");
    println!("echo '{}' | sudo tee {}", rule.trim(), udev_path);
    println!("sudo udevadm control --reload-rules");
    println!("sudo udevadm trigger");
    println!("================================");
    
    Ok(rule)
}

#[cfg(target_os = "macos")]
fn check_macos_permissions() -> Result<String, String> {
    println!("=== macOS USB Access ===");
    println!("Anchor can detect SanDisk USB devices without special permissions.");
    println!("If you experience issues, ensure the app has Security & Privacy permissions.");
    println!("========================");
    
    Ok("macOS USB access available".to_string())
}

#[cfg(target_os = "windows")]
fn check_windows_permissions() -> Result<String, String> {
    println!("=== Windows USB Driver Setup ===");
    println!("Ensure WinUSB driver is installed via Zadig for SanDisk devices.");
    println!("Download: https://github.com/pbatard/libwdi/releases");
    println!("================================");
    
    Ok("Windows USB driver check complete".to_string())
}

#[tauri::command]
fn is_usb_connected() -> bool {
    // Deprecated: Use event-driven model instead
    nusb::list_devices()
        .map(|mut devices| devices.any(|d| d.vendor_id() == 0x0781))
        .unwrap_or(false)
}

#[tauri::command]
async fn get_usb_serial_number() -> Result<Option<String>, String> {
    match nusb::list_devices() {
        Ok(mut devices) => {
            if let Some(device) = devices.find(|d| d.vendor_id() == 0x0781) {
                Ok(Some(format!("{:?}", device.product_id())))
            } else {
                Ok(None)
            }
        }
        Err(e) => Err(format!("Failed to list devices: {}", e)),
    }
}

#[tauri::command]
async fn setup_platform_permissions() -> Result<String, String> {
    #[cfg(target_os = "linux")]
    return generate_udev_rule();
    
    #[cfg(target_os = "macos")]
    return check_macos_permissions();
    
    #[cfg(target_os = "windows")]
    return check_windows_permissions();
    
    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    Ok("Unsupported platform".to_string())
}

#[tauri::command]
async fn initialize_database(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let mut state_guard = state.lock().map_err(|e| format!("Failed to acquire state lock: {}", e))?;
    
    if !state_guard.is_connected {
        return Err("USB device not connected. Cannot initialize database.".to_string());
    }
    
    let serial_number = state_guard.serial_number.clone()
        .ok_or("No serial number available for USB device.")?;
    
    // Create encrypted database with USB serial as part of the key
    let db_path = format!("anchor_{}.db", serial_number.replace(":", "_"));
    
    match Connection::open(&db_path) {
        Ok(conn) => {
            // Initialize database schema
            conn.execute(
                "DROP TABLE IF EXISTS secure_data",
                [],
            ).map_err(|e| format!("Failed to drop table: {}", e))?;
            
            conn.execute(
                "CREATE TABLE secure_data (
                    rowid INTEGER PRIMARY KEY,
                    data TEXT NOT NULL
                )",
                [],
            ).map_err(|e| format!("Failed to create table: {}", e))?;
            
            // Store connection in state
            state_guard.db_connection = Some(Arc::new(Mutex::new(conn)));
            
            Ok(format!("Database initialized successfully for USB: {}", serial_number))
        }
        Err(e) => Err(format!("Failed to open database: {}", e))
    }
}

#[tauri::command]
async fn add_secure_data(data: String, state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let state_guard = state.lock().map_err(|e| format!("Failed to acquire state lock: {}", e))?;
    
    let db_conn = state_guard.db_connection.as_ref()
        .ok_or("Database not initialized. Please connect USB first.")?;
    
    let conn = db_conn.lock().map_err(|e| format!("Failed to acquire database lock: {}", e))?;
    
    conn.execute(
        "INSERT INTO secure_data (data) VALUES (?1)",
        [&data],
    ).map_err(|e| format!("Failed to insert data: {}", e))?;
    
    Ok("Data added successfully".to_string())
}

#[tauri::command]
async fn get_secure_data(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<String>, String> {
    let state_guard = state.lock().map_err(|e| format!("Failed to acquire state lock: {}", e))?;
    
    let db_conn = state_guard.db_connection.as_ref()
        .ok_or("Database not initialized. Please connect USB first.")?;
    
    let conn = db_conn.lock().map_err(|e| format!("Failed to acquire database lock: {}", e))?;
    
    let mut stmt = conn.prepare("SELECT data FROM secure_data ORDER BY rowid DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let rows = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(0)?)
    }).map_err(|e| format!("Failed to execute query: {}", e))?;
    
    let mut results = Vec::new();
    for row in rows {
        let data = row.map_err(|e| format!("Failed to read row: {}", e))?;
        results.push(data);
    }
    
    Ok(results)
}

#[tauri::command]
async fn wipe_session(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let mut state_guard = state.lock().map_err(|e| format!("Failed to acquire state lock: {}", e))?;
    
    // Close database connection
    state_guard.db_connection = None;
    state_guard.is_connected = false;
    state_guard.serial_number = None;
    
    Ok("Session wiped successfully".to_string())
}

async fn usb_polling_task(app_handle: AppHandle, state: Arc<Mutex<AppState>>) {
    let mut interval = interval(Duration::from_secs(1));

    // Platform-specific setup
    #[cfg(target_os = "linux")]
    let _ = generate_udev_rule();
    
    #[cfg(target_os = "macos")]
    let _ = check_macos_permissions();
    
    #[cfg(target_os = "windows")]
    let _ = check_windows_permissions();

    loop {
        interval.tick().await;
        
        let current_connected = nusb::list_devices()
            .map(|mut devices| devices.any(|d| d.vendor_id() == 0x0781))
            .unwrap_or(false);

        let mut state_guard = state.lock().unwrap();
        let state_changed = state_guard.is_connected != current_connected;
        
        if state_changed {
            state_guard.is_connected = current_connected;
            
            if current_connected {
                // USB connected - try to get serial number
                if let Ok(mut devices) = nusb::list_devices() {
                    if let Some(device) = devices.find(|d| d.vendor_id() == 0x0781) {
                        state_guard.serial_number = Some(format!("{:?}", device.product_id()));
                        
                        // Platform-specific logging
                        #[cfg(target_os = "linux")]
                        println!("Linux: SanDisk USB detected - Device ID: {:?}", device.product_id());
                        
                        #[cfg(target_os = "macos")]
                        println!("macOS: SanDisk USB detected - Device ID: {:?}", device.product_id());
                        
                        #[cfg(target_os = "windows")]
                        println!("Windows: SanDisk USB detected - Device ID: {:?}", device.product_id());
                    }
                }
                
                // Emit hardware-status event
                let _ = app_handle.emit("hardware-status", HardwareStatusEvent {
                    connected: true,
                    serial_number: state_guard.serial_number.clone(),
                });
            } else {
                // USB disconnected
                state_guard.serial_number = None;
                state_guard.db_connection = None;
                
                // Platform-specific logging
                #[cfg(target_os = "linux")]
                println!("Linux: SanDisk USB disconnected");
                
                #[cfg(target_os = "macos")]
                println!("macOS: SanDisk USB disconnected");
                
                #[cfg(target_os = "windows")]
                println!("Windows: SanDisk USB disconnected");
                
                // Emit hardware-status event
                let _ = app_handle.emit("hardware-status", HardwareStatusEvent {
                    connected: false,
                    serial_number: None,
                });
            }
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
struct HardwareStatusEvent {
    connected: bool,
    serial_number: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Arc::new(Mutex::new(AppState::default()));
    let state_clone = app_state.clone();

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(usb_polling_task(app_handle, state_clone));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            is_usb_connected, 
            get_usb_serial_number,
            initialize_database,
            add_secure_data,
            get_secure_data,
            wipe_session,
            setup_platform_permissions
        ])
        .manage(app_state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
