# Electron Production Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure TeleStorage for production Windows distribution with NSIS installer, portable executable, and GitHub Releases auto-updater.

**Architecture:** Use `electron-builder` configured via a dedicated `electron-builder.yml`. Add `electron-updater` to the main process to check for updates on startup. Provide npm scripts for build/package/publish workflows.

**Tech Stack:** Electron, electron-builder, electron-updater, electron-vite, npm

---

### Task 1: Install electron-updater

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependency**

```bash
npm install electron-updater
```

- [ ] **Step 2: Verify package.json**

Run: `cat package.json | grep electron-updater`
Expected: `electron-updater` appears in `dependencies`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add electron-updater dependency"
```

---

### Task 2: Create electron-builder configuration

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Write electron-builder.yml**

```yaml
appId: com.yourcompany.telestorage
productName: TeleStorage
copyright: Copyright © 2026 Author
directories:
  output: dist
  buildResources: build
files:
  - out/**/*
  - node_modules/**/*
  - package.json
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
  owner: your-username
  repo: telestorage
```

- [ ] **Step 2: Verify file exists**

Run: `ls electron-builder.yml`
Expected: file listed

- [ ] **Step 3: Commit**

```bash
git add electron-builder.yml
git commit -m "chore: add electron-builder config for Windows"
```

---

### Task 3: Update package.json scripts and version

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update scripts and version**

Replace the existing `scripts` block and `version` with:

```json
{
  "name": "telestorage",
  "version": "0.1.0",
  "description": "Cloud storage client powered by Telegram",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "dist": "electron-builder build --win",
    "dist:win": "npm run build && npm run dist",
    "publish": "electron-builder build --win --publish always",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json",
    "postinstall": "echo \"postinstall done\"",
    "rebuild": "electron-builder install-app-deps",
    "audit": "npm audit"
  }
}
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`
Expected: no output (no error)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add dist scripts and bump version to 0.1.0"
```

---

### Task 4: Add auto-updater to main process

**Files:**
- Modify: `electron/main/index.ts`

- [ ] **Step 1: Import autoUpdater**

Add at the top with other imports:

```typescript
import { autoUpdater } from 'electron-updater'
```

- [ ] **Step 2: Add update check on app ready**

Inside the `app.whenReady().then(async () => { ... })` block, after `createWindow()`:

```typescript
  try {
    autoUpdater.checkForUpdatesAndNotify()
  } catch (err) {
    log.warn('Auto-updater check failed:', err)
  }
```

- [ ] **Step 3: Verify compilation**

Run: `npm run typecheck:node`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add electron/main/index.ts
git commit -m "feat: add GitHub Releases auto-updater check on startup"
```

---

### Task 5: Create build icons

**Files:**
- Create: `build/icon.png`
- Create: `build/icon.ico`

- [ ] **Step 1: Create build directory and placeholder PNG icon**

Use Python with Pillow to generate a 256x256 placeholder icon:

```bash
mkdir -p build
python -c "
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGBA', (256, 256), (0, 136, 204, 255))
draw = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype('arial.ttf', 120)
except:
    font = ImageFont.load_default()
draw.text((80, 80), 'TS', fill=(255, 255, 255, 255), font=font)
img.save('build/icon.png')
print('Created build/icon.png')
"
```

- [ ] **Step 2: Convert PNG to ICO**

```bash
python -c "
from PIL import Image
img = Image.open('build/icon.png')
img.save('build/icon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
print('Created build/icon.ico')
"
```

- [ ] **Step 3: Verify icons exist**

Run: `ls build/`
Expected: `icon.ico` and `icon.png` listed

- [ ] **Step 4: Commit**

```bash
git add build/
git commit -m "chore: add placeholder app icons"
```

---

### Task 6: Build and verify production package

**Files:**
- Verify output in `dist/`

**Note:** The first production build may reveal configuration or environment-specific issues (for example, missing native build tools or schema validation errors). Adjust `electron-builder.yml`, npm scripts, or the build environment as needed and re-run the build until artifacts are produced successfully.

- [ ] **Step 1: Run full production build**

```bash
npm run dist:win
```

Expected: Build completes with `dist/` containing:
- `TeleStorage Setup 0.1.0.exe`
- `TeleStorage 0.1.0.exe` (portable)

- [ ] **Step 2: Verify artifacts**

Run: `ls dist/`
Expected: both `.exe` files listed

- [ ] **Step 3: Commit (no code change, but lockfile may update)**

If `package-lock.json` changed:

```bash
git add package-lock.json
git commit -m "chore: update lockfile after production build"
```

---

### Task 7: Document placeholder values

**Files:**
- Modify: `electron-builder.yml`

- [ ] **Step 1: Add comments indicating placeholders to replace before release**

Update `electron-builder.yml` to include comments at the top:

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
```

- [ ] **Step 2: Commit**

```bash
git add electron-builder.yml
git commit -m "docs: mark electron-builder placeholders for release"
```

---

## Self-Review Checklist

- **Spec coverage:**
  - Windows NSIS installer → Task 2 `target: nsis`
  - Windows portable executable → Task 2 `target: portable`
  - GitHub Releases auto-updater → Task 1 + Task 4
  - npm scripts for build/package/publish → Task 3
  - App metadata and version → Task 2 + Task 3
  - App icons → Task 5
- **Placeholder scan:** No TBD/TODO in steps; placeholders are explicit values in config files with comments directing replacement.
- **Type consistency:** `autoUpdater` imported from `electron-updater` and used consistently.
