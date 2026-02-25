use crate::db::{Database, Transcript};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State};

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Database>,
    pub device_status: Arc<Mutex<DeviceStatus>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceStatus {
    pub connected: bool,
    pub battery_level: Option<i32>,
    pub last_seen: String,
}

impl Default for DeviceStatus {
    fn default() -> Self {
        DeviceStatus {
            connected: false,
            battery_level: None,
            last_seen: chrono::Utc::now().to_rfc3339(),
        }
    }
}

#[tauri::command]
pub fn add_transcript(
    title: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.db.add_transcript(&title, &content)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_transcripts(
    state: State<'_, AppState>,
) -> Result<Vec<Transcript>, String> {
    state.db.get_transcripts()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_synced(
    id: i32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.db.mark_synced(id)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn simulate_sync(
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.db.mark_all_synced()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_device_status(
    state: State<'_, AppState>,
) -> Result<DeviceStatus, String> {
    let status = state.device_status.lock().unwrap();
    Ok(status.clone())
}

#[tauri::command]
pub fn get_unsynced_count(
    state: State<'_, AppState>,
) -> Result<i32, String> {
    state.db.get_unsynced_count()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_device_connection(
    state: State<'_, AppState>,
) -> Result<DeviceStatus, String> {
    let mut status = state.device_status.lock().unwrap();
    status.connected = !status.connected;
    if status.connected {
        status.battery_level = Some(rand::random::<i32>() % 100);
        status.last_seen = chrono::Utc::now().to_rfc3339();
    } else {
        status.battery_level = None;
    }
    Ok(status.clone())
}

pub fn start_background_tasks(_app_handle: AppHandle, state: Arc<AppState>) {
    let state_clone = state.clone();
    
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(10));
        
        loop {
            interval.tick().await;
            
            let mut device_status = state_clone.device_status.lock().unwrap();
            if device_status.connected {
                device_status.last_seen = chrono::Utc::now().to_rfc3339();
                
                let mock_titles = vec![
                    "Meeting Notes",
                    "Voice Memo",
                    "Interview Recording",
                    "Lecture Summary",
                    "Brainstorming Session",
                    "Phone Call",
                    "Presentation Notes",
                    "Research Notes",
                ];
                
                let mock_contents = vec![
                    "Discussed project timeline and deliverables for the upcoming sprint.",
                    "Quick reminder about the dentist appointment tomorrow at 3 PM.",
                    "Technical interview covering system design and algorithms.",
                    "Professor explained the fundamentals of machine learning models.",
                    "Ideas for the new product launch campaign and marketing strategy.",
                    "Conversation with client about requirements and expectations.",
                    "Key points from the quarterly business review presentation.",
                    "Research findings on user behavior and engagement metrics.",
                ];
                
                let title_idx = rand::random::<usize>() % mock_titles.len();
                let content_idx = rand::random::<usize>() % mock_contents.len();
                
                if let Err(e) = state_clone.db.add_transcript(
                    mock_titles[title_idx],
                    mock_contents[content_idx],
                ) {
                    eprintln!("Failed to add mock transcript: {}", e);
                }
            }
        }
    });
}
