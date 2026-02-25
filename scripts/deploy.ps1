# Pocket Desktop Deployment Script (PowerShell)
Write-Host "🚀 Pocket Desktop Deployment Script" -ForegroundColor Green

# Check if we're on a tag
if ($env:GITHUB_REF -like "refs/tags/*") {
    $VERSION = $env:GITHUB_REF -replace "refs/tags/", ""
    Write-Host "📦 Deploying version: $VERSION" -ForegroundColor Blue
} else {
    $VERSION = "dev"
    Write-Host "🔧 Development build" -ForegroundColor Yellow
}

# Build for current platform
Write-Host "🔨 Building for current platform..." -ForegroundColor Cyan
npm run tauri build

# Create deployment directories
New-Item -ItemType Directory -Force -Path deploy/windows | Out-Null
New-Item -ItemType Directory -Force -Path deploy/macos | Out-Null  
New-Item -ItemType Directory -Force -Path deploy/linux | Out-Null

# Move packages to deployment directories
if ($IsWindows) {
    Write-Host "📋 Moving Windows packages..." -ForegroundColor Blue
    Copy-Item src-tauri\target\release\bundle\msix\*.msix deploy\windows\ -Force
    Copy-Item src-tauri\target\release\bundle\msi\*.msi deploy\windows\ -Force
    Copy-Item src-tauri\target\release\bundle\nsis\*.exe deploy\windows\ -Force
} elseif ($IsMacOS) {
    Write-Host "📋 Moving macOS packages..." -ForegroundColor Blue
    Copy-Item src-tauri/target/release/bundle/dmg/*.dmg deploy/macos/ -Force
    Copy-Item src-tauri/target/release/bundle/macos/*.app deploy/macos/ -Force
} else {
    Write-Host "📋 Moving Linux packages..." -ForegroundColor Blue
    Copy-Item src-tauri/target/release/bundle/deb/*.deb deploy/linux/ -Force
    Copy-Item src-tauri/target/release/bundle/appimage/*.AppImage deploy/linux/ -Force
    Copy-Item src-tauri/target/release/bundle/snap/*.snap deploy/linux/ -Force
}

Write-Host "✅ Build complete! Packages ready in deploy/ directory" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployment options:" -ForegroundColor Cyan
Write-Host "  • GitHub Releases: Upload packages to GitHub"
Write-Host "  • Microsoft Store: Submit MSIX to Partner Center"
Write-Host "  • Mac App Store: Submit DMG to App Store Connect"
Write-Host "  • Snap Store: Upload .snap with snapcraft"
Write-Host "  • Direct distribution: Share installers directly"
