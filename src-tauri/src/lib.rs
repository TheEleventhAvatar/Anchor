use nusb;

#[tauri::command]
fn is_usb_connected() -> bool {
    // Check if any connected device matches SanDisk VID/PID
    nusb::list_devices()
        .map(|mut devices| devices.any(|d| d.vendor_id() == 0x0781 && d.product_id() == 0x5581))
        .unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![is_usb_connected])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
