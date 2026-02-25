#!/bin/bash

# Pocket Desktop Deployment Script
echo "🚀 Pocket Desktop Deployment Script"

# Check if we're on a tag
if [[ $GITHUB_REF == refs/tags/* ]]; then
    VERSION=${GITHUB_REF#refs/tags/}
    echo "📦 Deploying version: $VERSION"
else
    VERSION="dev"
    echo "🔧 Development build"
fi

# Build for current platform
echo "🔨 Building for current platform..."
npm run tauri build

# Create deployment directories
mkdir -p deploy/windows deploy/macos deploy/linux

# Move packages to deployment directories
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "📋 Moving Windows packages..."
    cp src-tauri/target/release/bundle/msix/*.msix deploy/windows/
    cp src-tauri/target/release/bundle/msi/*.msi deploy/windows/
    cp src-tauri/target/release/bundle/nsis/*.exe deploy/windows/
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📋 Moving macOS packages..."
    cp src-tauri/target/release/bundle/dmg/*.dmg deploy/macos/
    cp src-tauri/target/release/bundle/macos/*.app deploy/macos/
else
    echo "📋 Moving Linux packages..."
    cp src-tauri/target/release/bundle/deb/*.deb deploy/linux/
    cp src-tauri/target/release/bundle/appimage/*.AppImage deploy/linux/
    cp src-tauri/target/release/bundle/snap/*.snap deploy/linux/
fi

echo "✅ Build complete! Packages ready in deploy/ directory"
echo ""
echo "📦 Deployment options:"
echo "  • GitHub Releases: Upload packages to GitHub"
echo "  • Microsoft Store: Submit MSIX to Partner Center"
echo "  • Mac App Store: Submit DMG to App Store Connect"
echo "  • Snap Store: Upload .snap with snapcraft"
echo "  • Direct distribution: Share installers directly"
