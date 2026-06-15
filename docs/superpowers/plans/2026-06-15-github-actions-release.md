# GitHub Actions Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a GitHub Actions workflow that builds and publishes Windows releases to GitHub Releases when a version tag is pushed, while shipping Telegram API credentials in a production `.env` file.

**Architecture:** A single `.github/workflows/release.yml` runs on `windows-latest`, creates a production `.env` from repository secrets, runs tests, builds the app, and invokes `electron-builder --publish always` to create the GitHub Release. The packaged app loads `.env` from `process.resourcesPath` via `extraResources`.

**Tech Stack:** GitHub Actions, electron-builder, electron-vite, dotenv, npm

---

### Task 1: Configure electron-builder to ship `.env` and publish to the correct repo

**Files:**
- Modify: `electron-builder.yml`

- [ ] **Step 1: Add `extraResources` for `.env` and update `publish`**

Update `electron-builder.yml` so the `.env` file is copied into the packaged app resources and the publish block points to the real GitHub repo:

```yaml
# IMPORTANT: Replace placeholder values before publishing:
# - appId (com.yourcompany.telestorage)
# - publish.owner and publish.repo
# - build/icon.ico and build/icon.png with production-ready assets
#
# NOTE: npmRebuild is disabled because the current build environment lacks the
# Visual Studio C++ build tools workload and the project has no required native
# Node dependencies. Re-enable this if you add native modules that must be
# rebuilt for Electron.
#
# NOTE: publisherName was omitted because the installed electron-builder version
# rejected it during schema validation. Configure proper code signing and
# publisher metadata before a public release.
appId: com.yourcompany.telestorage
productName: TeleStorage
copyright: Copyright © 2026 Audomaro Glez
directories:
  output: dist
  buildResources: build
files:
  - out/**/*
  - package.json

extraResources:
  - .env

win:
  target:
    - target: nsis
      arch:
        - x64
    - target: portable
      arch:
        - x64
  icon: build/icon.ico
npmRebuild: false
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: TeleStorage
  uninstallDisplayName: TeleStorage
portable:
  artifactName: ${productName} ${version}.exe
publish:
  provider: github
  owner: Audomaro
  repo: telestorage
```

- [ ] **Step 2: Validate YAML syntax**

Run:
```bash
node -e "require('js-yaml').load(require('fs').readFileSync('electron-builder.yml', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml
git commit -m "chore(build): ship .env and set GitHub publish config"
```

---

### Task 2: Load `.env` from the packaged app resources

**Files:**
- Modify: `electron/main/index.ts`

- [ ] **Step 1: Replace `import 'dotenv/config'` with explicit resource-path loading**

Change the top of `electron/main/index.ts` from:

```typescript
import 'dotenv/config'
import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { join } from 'path'
import log from 'electron-log/main'
```

To:

```typescript
import { config } from 'dotenv'
import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'

const prodEnvPath = join(process.resourcesPath, '.env')
const devEnvPath = join(process.cwd(), '.env')
config({ path: existsSync(prodEnvPath) ? prodEnvPath : devEnvPath })
```

Leave the rest of the file unchanged.

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run typecheck:node
```

Expected: The pre-existing errors remain, but no new errors related to dotenv loading appear.

- [ ] **Step 3: Commit**

```bash
git add electron/main/index.ts
git commit -m "feat: load .env from app resources in production"
```

---

### Task 3: Pin Node.js version with `.nvmrc`

**Files:**
- Create: `.nvmrc`

- [ ] **Step 1: Create `.nvmrc`**

```bash
echo "20" > .nvmrc
```

- [ ] **Step 2: Verify the file contents**

Run:
```bash
cat .nvmrc
```

Expected: `20`

- [ ] **Step 3: Commit**

```bash
git add .nvmrc
git commit -m "chore: pin Node.js version to 20"
```

---

### Task 4: Create the GitHub Actions release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: windows-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install dependencies
        run: npm ci

      - name: Create production .env
        run: |
          echo "TELEGRAM_API_ID=${{ secrets.TELEGRAM_API_ID }}" > .env
          echo "TELEGRAM_API_HASH=${{ secrets.TELEGRAM_API_HASH }}" >> .env

      - name: Run tests
        run: npm test

      - name: Build app
        run: npm run build

      - name: Build installer and publish release
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: npm run publish
```

- [ ] **Step 2: Validate workflow YAML syntax**

Run:
```bash
node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/release.yml', 'utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions release workflow"
```

---

### Task 5: Ensure `.env` is ignored by git

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Verify `.env` is in `.gitignore`**

Run:
```bash
grep -E "^\.env" .gitignore || echo "MISSING"
```

Expected: A line matching `.env` (possibly `.env*`).

- [ ] **Step 2: If missing, add it**

Add to `.gitignore`:
```
.env
```

Then commit:
```bash
git add .gitignore
git commit -m "chore: ensure .env is ignored"
```

If already present, no commit is needed for this task.

---

### Task 6: Verify the production build still works locally

**Files:**
- Verify: `dist/`

- [ ] **Step 1: Create a local `.env` if you do not already have one**

```bash
echo "TELEGRAM_API_ID=YOUR_API_ID" > .env
echo "TELEGRAM_API_HASH=YOUR_API_HASH" >> .env
```

- [ ] **Step 2: Build the app**

Run:
```bash
npm run build
```

Expected: Build completes successfully.

- [ ] **Step 3: Run the production packaging step without publishing**

Run:
```bash
npm run dist
```

Expected: `electron-builder` completes and `dist/` contains:
- `TeleStorage Setup 0.1.0.exe`
- `TeleStorage 0.1.0.exe`

- [ ] **Step 4: Run tests**

Run:
```bash
npm test
```

Expected: 130 tests pass, 25 test files pass.

- [ ] **Step 5: Clean up the test `.env` if you created a dummy one**

Restore your real `.env` if needed. Do not commit it.

---

### Task 7: Configure GitHub Secrets

**Files:**
- None (repository settings)

- [ ] **Step 1: Add the following secrets in the GitHub repo settings**

Go to `https://github.com/Audomaro/telestorage/settings/secrets/actions` and add:

| Secret | Value |
|--------|-------|
| `GH_TOKEN` | A personal access token with `repo` scope |
| `TELEGRAM_API_ID` | Your Telegram API ID |
| `TELEGRAM_API_HASH` | Your Telegram API hash |

- [ ] **Step 2: Test the workflow by pushing a tag**

```bash
git tag v0.2.0
git push origin v0.2.0
```

Expected: The Release workflow runs, builds the artifacts, and creates a GitHub Release at `https://github.com/Audomaro/telestorage/releases/tag/v0.2.0`.

---

## Self-Review

**Spec coverage:**
- GitHub Actions trigger on tags → Task 4
- Create `.env` from secrets → Task 4
- Run tests → Task 4
- Build and publish → Tasks 1, 4, 6
- Ship `.env` in package → Task 1
- Load `.env` from resources → Task 2
- Update publish owner/repo → Task 1
- Pin Node version → Task 3

**Placeholder scan:**
- No TBD or TODO items
- All code blocks contain complete, runnable content

**Type consistency:**
- `process.resourcesPath` is used consistently in Task 2
- Secret names match between Task 4 and Task 7
