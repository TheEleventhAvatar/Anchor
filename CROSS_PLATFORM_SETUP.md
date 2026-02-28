# Anchor - Cross-Platform USB Heartbeat Setup

Anchor uses hardware-based authentication with SanDisk USB devices. The application automatically detects USB connection/disconnection events and provides secure database access only when the authorized USB device is connected.

## Platform Setup

### Windows
1. Download [Zadig](https://github.com/pbatard/libwdi/releases) (zadig-2.9.exe)
2. Run Zadig as Administrator
3. Click Options → List All Devices
4. Select your SanDisk USB device (Vendor ID: 0x0781)
5. Replace the driver with WinUSB
6. Restart the Anchor application

### Linux
Run the included setup script:
```bash
./scripts/setup_linux.sh
```

Or manually create the udev rule:
```bash
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="0x0781", MODE="0666"' | sudo tee /etc/udev/rules.d/99-anchor-sandisk.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### macOS
No special setup required. Anchor can detect SanDisk USB devices automatically using IOKit. If you experience issues, ensure the app has necessary Security & Privacy permissions.

## How It Works

1. **USB Detection**: The app polls the USB bus every second for SanDisk devices (VID: 0x0781)
2. **Event-Driven**: Hardware status changes are emitted as events to the React frontend
3. **Secure Database**: SQLite database is only accessible when the USB device is connected
4. **Session Wipe**: Removing the USB immediately locks the application and closes the database

## Technical Details

### Backend (Rust)
- **Windows**: Uses WinUSB driver via nusb crate
- **Linux**: Uses usbfs with udev rules for non-root access
- **macOS**: Uses IOKit framework (device listing only, no claiming required)

### Frontend (React)
- Platform-agnostic UI that responds to hardware-status events
- Two view states: Locked (no access) and Unlocked (full access)
- Real-time USB connection status indicator

### Security Features
- Thread-safe state management with Arc<Mutex<AppState>>
- Encrypted SQLite database with USB-serial-based naming
- Immediate session termination on USB removal
- No persistent credentials stored on disk

## Troubleshooting

### Windows
- Ensure Zadig driver installation completed successfully
- Check Device Manager for WinUSB driver under SanDisk device
- Restart application after driver installation

### Linux
- Verify udev rule: `cat /etc/udev/rules.d/99-anchor-sandisk.rules`
- Check USB permissions: `ls -la /dev/bus/usb/*/*`
- Verify device detection: `lsusb | grep 0781`
- Unplug and reconnect USB device if issues persist

### macOS
- Check System Preferences → Security & Privacy for app permissions
- Ensure USB device is properly recognized by the system
- Check console logs for USB-related errors

## Development

### Building for Different Platforms
```bash
# Development
npm run tauri dev

# Build for current platform
npm run tauri build

# Cross-platform builds require additional setup
# See Tauri documentation for platform-specific build requirements
```

### Dependencies
- **Rust**: nusb, rusqlite, tokio, tauri
- **React**: @tauri-apps/api, React hooks
- **Platform-specific**: Conditional compilation with #[cfg(target_os = "...")]

## Security Notes

- The application never stores passwords or persistent credentials
- Database encryption is tied to the physical USB device
- Session is immediately terminated when USB is removed
- All USB operations are read-only (device listing only)

## License

This project is proprietary software. See LICENSE file for details.
