import { invoke } from '@tauri-apps/api/core';

/**
 * Opens a file using the default program or a specified program
 * @param path - Path to the file to open
 * @param program - Optional program to use (e.g., "vlc" on Windows)
 */
export async function openFile(path: string, program?: string): Promise<void> {
  await invoke('open_file', { path, program });
}

/**
 * Opens a URL using the default program
 * @param url - URL to open
 */
export async function openUrl(url: string): Promise<void> {
  await invoke('open_url', { url });
}

// Example usage:
// openFile('/path/to/file'); // Opens with default program
// openFile('C:/path/to/file', 'vlc'); // Opens with VLC on Windows
// openUrl('https://tauri.app'); // Opens URL in default browser
