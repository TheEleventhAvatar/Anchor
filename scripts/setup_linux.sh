#!/bin/bash

# Anchor Linux USB Setup Script
# This script sets up udev rules for SanDisk USB device access

set -e

echo "=== Anchor Linux USB Setup ==="
echo "This script will configure udev rules for SanDisk USB devices"
echo "Vendor ID: 0x0781 (SanDisk)"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "This script should not be run as root. Please run as a regular user."
   echo "It will use sudo only where necessary."
   exit 1
fi

# Create udev rule
UDEV_RULE='SUBSYSTEM=="usb", ATTR{idVendor}=="0x0781", MODE="0666"'
UDEV_FILE="/etc/udev/rules.d/99-anchor-sandisk.rules"

echo "Creating udev rule for SanDisk USB devices..."
echo "$UDEV_RULE" | sudo tee "$UDEV_FILE" > /dev/null

if [[ $? -eq 0 ]]; then
    echo "✓ Udev rule created successfully: $UDEV_FILE"
else
    echo "✗ Failed to create udev rule"
    exit 1
fi

# Reload udev rules
echo "Reloading udev rules..."
sudo udevadm control --reload-rules

if [[ $? -eq 0 ]]; then
    echo "✓ Udev rules reloaded successfully"
else
    echo "✗ Failed to reload udev rules"
    exit 1
fi

# Trigger udev to apply new rules
echo "Applying new udev rules..."
sudo udevadm trigger

if [[ $? -eq 0 ]]; then
    echo "✓ Udev rules applied successfully"
else
    echo "✗ Failed to apply udev rules"
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "SanDisk USB devices should now be accessible without sudo"
echo ""
echo "To verify the setup:"
echo "1. Plug in your SanDisk USB device"
echo "2. Run: lsusb | grep 0781"
echo "3. Start the Anchor application"
echo ""
echo "If you still experience issues:"
echo "- Unplug and reconnect the USB device"
echo "- Restart the Anchor application"
echo "- Check dmesg for USB-related errors"
echo ""
echo "=== Troubleshooting ==="
echo "If the device is still not accessible:"
echo "1. Check if the udev rule was created: cat $UDEV_FILE"
echo "2. Check USB device permissions: ls -la /dev/bus/usb/*/*"
echo "3. Verify device detection: lsusb | grep 0781"
echo ""
echo "For manual setup, the udev rule content is:"
echo "$UDEV_RULE"
