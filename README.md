# Anchor Desktop

A production-grade desktop companion app for Anchor - a tiny AI device that lives on your phone and turns everything you say and hear into clear notes, action items, and search. We combine custom hardware, AI, and software to build the best note-taking experience for people who talk and move fast.

Built with Tauri 2.x, Rust, and React + TypeScript.

## Features

- **Offline-first design**: Local SQLite database with phone app sync capabilities
- **Real-time simulation**: Mock transcript generation every 10 seconds when Anchor is connected
- **System tray integration**: Show/hide window, quit application
- **Native notifications**: Desktop alerts for new transcripts from Anchor
- **Anchor status monitoring**: Connection status, battery level, last seen
- **Sync management**: Manual sync, offline/online modes
- **Clean architecture**: Modular Rust backend with separate concerns

## Product Vision

Anchor is a tiny AI device that:
- Lives on your phone
- Captures everything you say and hear
- Transforms speech into clear notes and action items
- Provides powerful search capabilities
- Built for people who talk and move fast

The desktop companion provides:
- Larger screen for reviewing and organizing notes
- Advanced editing capabilities
- Backup and sync management
- Desktop notifications for new captures

## Architecture

### Backend (Rust)
- `db.rs`: SQLite database operations
- `commands.rs`: Tauri commands and business logic
- `main.rs`: Application setup and system tray

### Frontend (React + TypeScript)
- `types.ts`: TypeScript interfaces
- `hooks/useTauriCommands.ts`: Tauri API wrapper
- `components/`: React components
  - `Sidebar.tsx`: Phone status and sync controls
  - `TranscriptList.tsx`: Transcript listing
  - `TranscriptDetail.tsx`: Transcript viewer
  - `AddTranscriptForm.tsx`: Manual transcript creation

## Database Schema

```sql
CREATE TABLE transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0
);
```

## Getting Started

### Prerequisites
- Rust 1.70+
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

1. Start the development server:
   ```bash
   npm run tauri dev
   ```

2. The application will:
   - Open the main window
   - Start backend services
   - Begin generating mock transcripts when Anchor is connected

### Building

1. Build for production:
   ```bash
   npm run build
   ```

2. Create distributable:
   ```bash
   npm run tauri build
   ```

## Usage

### Anchor Simulation
1. Click "Connect Phone" in the sidebar to simulate Anchor device connection
2. Mock transcripts will be generated every 10 seconds
3. View Anchor status including battery level

### Sync Management
1. Toggle between online/offline modes
2. Click "Sync Now" to mark all transcripts as synced
3. View unsynced count in real-time

### Transcript Management
1. Click any transcript to view details
2. Add manual transcripts with the form
3. Mark individual transcripts as synced

## Technical Details

### Background Tasks
- Runs every 10 seconds when Anchor is connected
- Generates mock transcripts with realistic content
- Updates Anchor status timestamps

### State Management
- React hooks for local state
- Tauri commands for backend operations
- Real-time polling every 5 seconds

### Styling
- Pure CSS, no frameworks
- Modern, clean design
- Responsive layout with sidebar

## Deployment

### CI/CD Pipeline

**Automated builds** trigger on:
- Push to `main` branch
- New tags (`v1.0.0`, `v1.0.1`, etc.)
- Pull requests

**Pipeline stages:**
1. **Test** - Run tests and code checks
2. **Build** - Cross-platform packages
3. **Deploy** - Store submissions

### GitHub Releases (Recommended)

1. **Tag a new release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Automatic builds** create installers:
   - Windows (.msix, .msi, .exe)
   - macOS (.dmg, .app)
   - Linux (.deb, .AppImage, .snap)

3. **Download installers** from GitHub Releases

### App Store Deployment

#### Microsoft Store
```bash
# Build MSIX package
npm run tauri build -- --target msix

# Submit to Microsoft Partner Center
# Store submission required
```

#### Mac App Store
```bash
# Build DMG with code signing
npm run tauri build -- --target dmg

# Submit to App Store Connect
# Apple Developer account required
```

#### Snap Store (Linux)
```bash
# Build snap package
npm run tauri build -- --target snap

# Upload to Snap Store
snapcraft upload --release=stable *.snap
```

### Local Deployment

```bash
# Windows
.\scripts\deploy.ps1

# macOS/Linux
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Auto-Updates

The app includes Tauri Updater for automatic updates when new releases are published.

### Environment Variables

For store deployments, set these secrets:
- `SNAPCRAFT_LOGIN` - Snap Store credentials
- `GITHUB_TOKEN` - GitHub API token

## License

MIT License - see LICENSE file for details
