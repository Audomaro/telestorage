# GitHub Actions Release Pipeline Design

## Overview

Automate the Windows production build and release process for TeleStorage using GitHub Actions. When a version tag is pushed, the workflow will run tests, inject production secrets, build the NSIS installer and portable executable, and publish them to a GitHub Release.

## Goals

- Eliminate manual builds and uploads for Windows releases
- Ensure every release is built from a clean, reproducible environment
- Keep Telegram API credentials out of the source repository while still shipping them in the packaged app
- Publish artifacts to GitHub Releases using `electron-builder`

## Trigger

The workflow runs only on annotated version tags:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

## Runner

- `windows-latest`

## Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `GH_TOKEN` | GitHub personal access token with `repo` scope so `electron-builder` can create releases and upload assets |
| `TELEGRAM_API_ID` | Telegram API ID for the production build |
| `TELEGRAM_API_HASH` | Telegram API hash for the production build |

## Workflow Steps

1. **Checkout** the repository at the pushed tag
2. **Setup Node.js** using the version specified in `.nvmrc` (or a pinned version)
3. **Install dependencies** with `npm ci`
4. **Create production `.env`** from secrets:
   ```bash
   echo "TELEGRAM_API_ID=${{ secrets.TELEGRAM_API_ID }}" > .env
   echo "TELEGRAM_API_HASH=${{ secrets.TELEGRAM_API_HASH }}" >> .env
   ```
5. **Run tests** with `npm test`
6. **Build and publish** with `npm run publish`, which:
   - Runs `electron-vite build`
   - Runs `electron-builder build --win --publish always`
   - Creates a GitHub Release named after the tag
   - Uploads `TeleStorage Setup X.Y.Z.exe` and `TeleStorage X.Y.Z.exe`

## App-Side Changes

### 1. Ship `.env` with the packaged app

Add `.env` to `extraResources` in `electron-builder.yml` so it is copied outside the asar and readable at runtime:

```yaml
files:
  - out/**/*
  - package.json

extraResources:
  - .env
```

### 2. Load `.env` from the resources path

In `electron/main/index.ts`, load the `.env` file from `process.resourcesPath` instead of relying on the current working directory:

```typescript
import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.resourcesPath, '.env') })
```

This ensures the app finds its credentials whether it is launched from the Start menu, desktop shortcut, or install directory.

### 3. Update publish configuration

Set the real GitHub owner and repository in `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: Audomaro
  repo: telestorage
```

## Files Created

- `.github/workflows/release.yml` — the release workflow
- `.nvmrc` (optional but recommended) — pins the Node.js version

## Security Notes

- `.env` must remain in `.gitignore` and never be committed
- The Telegram API hash will be present inside the distributed installer/portable executable. This is the standard trade-off for desktop Telegram clients; perfect secrecy is not possible because the app must authenticate to Telegram on the user's behalf.
- `GH_TOKEN` should have the minimum required scope (`repo`) and be rotated periodically.

## Out of Scope

- Windows code signing ( SmartScreen warnings are accepted for now )
- macOS or Linux builds
- Release channels (stable/beta/alpha)
- In-app update progress UI
- Automated changelog generation beyond the git tag message

## Success Criteria

- Pushing `v0.2.0` triggers the workflow
- Workflow passes tests, builds both `.exe` files, and creates a GitHub Release
- The released app can connect to Telegram without manual `.env` setup on the end user's machine
