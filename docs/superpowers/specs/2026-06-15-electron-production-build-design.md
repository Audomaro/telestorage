# TeleStorage Production Build Design

## Overview
Configure the project for real-world production distribution of the Electron app on Windows.

## Goals
- Build a Windows NSIS installer (.exe)
- Build a Windows portable executable (.exe)
- Integrate GitHub Releases auto-updater
- Provide clean npm scripts for build, package, and publish workflows
- Keep configuration maintainable and ready for CI/CD

## Decisions

### Build Tool
Use **electron-builder** (already a devDependency) configured via a dedicated **`electron-builder.yml`** file for separation of concerns.

### Distribution Targets
- Windows only
- NSIS installer (`TeleStorage Setup X.Y.Z.exe`)
- Portable executable (`TeleStorage X.Y.Z.exe`)
- Output directory: `dist/`

### Auto-Updater
Use **electron-updater** with the GitHub provider. The app checks for updates on startup. When an update is downloaded, it prompts the user to restart and install.

### App Metadata
- App name: `TeleStorage`
- App ID: `com.yourcompany.telestorage`
- Description: `Cloud storage client powered by Telegram`
- Author: `Your Name or Company` (placeholder)
- Copyright: `Copyright © 2026 Author` (placeholder)
- Version: bump from `0.0.0` to `0.1.0`

### GitHub Releases
- Provider: `github`
- Owner: `your-username` (placeholder)
- Repo: `telestorage` (placeholder)

### Required Assets
- `build/icon.ico` — Windows application icon
- `build/icon.png` — fallback / cross-platform icon

## Files to Create/Modify

### New files
- `electron-builder.yml`
- `build/icon.ico`
- `build/icon.png`

### Modified files
- `package.json` — add dist/publish scripts, bump version, add `electron-updater` dependency
- `electron/main/index.ts` — wire up auto-updater on app ready

## npm Scripts
- `dist` — `electron-builder build --win`
- `dist:win` — `npm run build && npm run dist`
- `publish` — `electron-builder build --win --publish always`
- `rebuild` — `electron-builder install-app-deps` (existing)

## Risks & Notes
- Code signing is out of scope for this initial setup; Windows SmartScreen may warn users until a certificate is added.
- A real GitHub repo must be configured before `npm run publish` works.
- App icons must be created/replaced before the first public release.
