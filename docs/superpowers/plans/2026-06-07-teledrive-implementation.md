# TeleDrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desktop app (Electron + React) that uses Telegram groups as cloud storage with list/gallery views, filters, and full CRUD.

**Architecture:** Electron main process runs gramjs (MTProto) for all Telegram operations. Renderer process runs React UI. Secure IPC via preload/contextBridge. Session encrypted via electron.safeStorage. TDD throughout with Vitest + Testing Library.

**Tech Stack:** Electron, React 18, TypeScript, Vite (electron-vite), gramjs, Vitest, @testing-library/react, electron-builder

---

## File Structure

```
teledrive/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron.vite.config.ts
├── electron/
│   ├── main/
│   │   ├── index.ts              # Electron app entry, window creation
│   │   ├── ipc.ts                # Registers all IPC handlers
│   │   └── telegram/
│   │       ├── client.ts         # GramJs singleton, connection mgmt
│   │       ├── auth.ts           # sendCode, signIn, check2FA
│   │       ├── groups.ts         # getGroups, getArchived, createGroup
│   │       └── files.ts          # upload, download, delete, forward, listFiles
│   └── preload/
│       └── index.ts              # contextBridge exposing telegramAPI
├── src/
│   ├── index.html
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Router + auth guard
│   ├── App.css                   # Global styles
│   ├── types/
│   │   └── index.ts              # Group, File, TelegramUser, etc.
│   ├── utils/
│   │   ├── format.ts             # formatFileSize, formatDate
│   │   └── fileTypes.ts          # fileTypeFilter, isMedia, isDocument
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── GroupListPage.tsx
│   │   └── GroupFilesPage.tsx
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── GroupListItem.tsx
│   │   ├── FileList.tsx
│   │   ├── FileGrid.tsx
│   │   ├── Toolbar.tsx
│   │   ├── PreviewModal.tsx
│   │   └── UploadDialog.tsx
│   └── hooks/
│       ├── useTelegram.ts
│       ├── useGroups.ts
│       └── useFiles.ts
├── tests/
│   ├── setup.ts                  # Vitest setup (jsdom, etc.)
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── integration/
│       └── ipc.test.ts
└── resources/                    # App icons
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `electron.vite.config.ts`
- Create: `src/index.html`
- Create: `src/main.tsx`
- Create: `tests/setup.ts`
- Create: `electron/main/index.ts`
- Create: `electron/preload/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "teledrive",
  "version": "0.1.0",
  "description": "Telegram as cloud storage",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json",
    "postinstall": "electron-builder install-app-deps",
    "audit": "npm audit"
  },
  "dependencies": {
    "gramjs": "^0.8.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^2.0.0",
    "jsdom": "^25.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "outDir": "./out",
    "types": ["node"]
  },
  "include": ["electron/**/*", "electron.vite.config.ts"]
}
```

- [ ] **Step 4: Create tsconfig.web.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "outDir": "./out",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 5: Create electron.vite.config.ts**

```ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 6: Create electron/main/index.ts**

```ts
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

- [ ] **Step 7: Create electron/main/ipc.ts (stub)**

```ts
import { ipcMain } from 'electron'

export function registerIpcHandlers(): void {
  // IPC handlers will be registered in subsequent tasks
}
```

- [ ] **Step 8: Create electron/preload/index.ts (stub)**

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  // Methods will be added in subsequent tasks
})
```

- [ ] **Step 9: Create src/index.html**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TeleDrive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 11: Create tests/setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 12: Create src/types/index.ts (stub)**

```ts
export interface TelegramUser {
  id: number
  phone: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface TelegramGroup {
  id: number
  title: string
  isArchived: boolean
  isOwner: boolean
  fileCount?: number
  totalSize?: number
}

export interface TelegramFile {
  id: number
  messageId: number
  name: string
  size: number
  mimeType: string
  date: Date
  groupId: number
  thumbnail?: string
}

export type ViewMode = 'list' | 'gallery'
export type FileFilter = 'all' | 'media' | 'documents'
export type AuthStep = 'phone' | 'code' | '2fa' | 'done'
```

- [ ] **Step 13: Create src/App.tsx (minimal)**

```tsx
function App() {
  return <div>TeleDrive</div>
}

export default App
```

- [ ] **Step 14: Create src/App.css (minimal)**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
```

- [ ] **Step 15: Verify project builds and tests run**

```bash
npm install && npm run typecheck:node && npm run typecheck:web
```

- [ ] **Step 16: Commit**

```bash
git init && git add -A && git commit -m "feat: initial project scaffolding"
```

---

### Task 2: Types and utility functions

**Files:**
- Modify: `src/types/index.ts`
- Create: `tests/unit/utils/format.test.ts`
- Create: `src/utils/format.ts`
- Create: `tests/unit/utils/fileTypes.test.ts`
- Create: `src/utils/fileTypes.ts`

- [ ] **Step 1: Write format tests**

Create `tests/unit/utils/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatFileSize } from '../../src/utils/format'
import { formatDate } from '../../src/utils/format'

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('should format kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })

  it('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })
})

describe('formatDate', () => {
  it('should format date as DD/MM/YYYY', () => {
    const date = new Date(2026, 5, 7)
    expect(formatDate(date)).toBe('07/06/2026')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/utils/format.test.ts`
Expected: FAIL with "Cannot find module" errors

- [ ] **Step 3: Write format utilities**

Create `src/utils/format.ts`:
```ts
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/utils/format.test.ts`
Expected: PASS

- [ ] **Step 5: Write file type tests**

Create `tests/unit/utils/fileTypes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isMedia, isDocument, fileTypeLabel } from '../../src/utils/fileTypes'

describe('isMedia', () => {
  it('should return true for image/jpeg', () => {
    expect(isMedia('image/jpeg')).toBe(true)
  })

  it('should return true for video/mp4', () => {
    expect(isMedia('video/mp4')).toBe(true)
  })

  it('should return false for application/pdf', () => {
    expect(isMedia('application/pdf')).toBe(false)
  })
})

describe('isDocument', () => {
  it('should return true for application/pdf', () => {
    expect(isDocument('application/pdf')).toBe(true)
  })

  it('should return false for image/jpeg', () => {
    expect(isDocument('image/jpeg')).toBe(false)
  })
})

describe('fileTypeLabel', () => {
  it('should return 🖼️ for images', () => {
    expect(fileTypeLabel('image/jpeg')).toBe('🖼️')
  })

  it('should return 🎬 for videos', () => {
    expect(fileTypeLabel('video/mp4')).toBe('🎬')
  })

  it('should return 📄 for documents', () => {
    expect(fileTypeLabel('application/pdf')).toBe('📄')
  })

  it('should return 📦 for unknown', () => {
    expect(fileTypeLabel('application/octet-stream')).toBe('📦')
  })
})
```

- [ ] **Step 6: Run new tests to verify they fail**

Run: `npx vitest run tests/unit/utils/fileTypes.test.ts`
Expected: FAIL

- [ ] **Step 7: Write file type utilities**

Create `src/utils/fileTypes.ts`:
```ts
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mkv', 'video/webm', 'video/quicktime']
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
]

export function isMedia(mimeType: string): boolean {
  return IMAGE_TYPES.includes(mimeType) || VIDEO_TYPES.includes(mimeType)
}

export function isDocument(mimeType: string): boolean {
  return DOCUMENT_TYPES.includes(mimeType)
}

export function fileTypeLabel(mimeType: string): string {
  if (IMAGE_TYPES.includes(mimeType)) return '🖼️'
  if (VIDEO_TYPES.includes(mimeType)) return '🎬'
  if (DOCUMENT_TYPES.includes(mimeType)) return '📄'
  return '📦'
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run tests/unit/utils/`
Expected: All pass

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add types and utility functions"
```

---

### Task 3: Telegram auth IPC (main process)

**Files:**
- Create: `electron/main/telegram/auth.ts`
- Create: `electron/main/telegram/client.ts`
- Create: `electron/main/telegram/storage.ts`
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Write auth tests (integration)**

Create `tests/integration/ipc.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'

describe('IPC auth handlers', () => {
  it('should register sendCode handler', () => {
    const { registerIpcHandlers } = await import('../../electron/main/ipc')
    expect(registerIpcHandlers).toBeDefined()
  })
})
```

Wait — actually, IPC handlers use `ipcMain.handle` which depends on Electron. In tests we can't import Electron directly. Let me structure the IPC code so the handler registration is testable.

Better approach: Make the IPC handlers callable functions that are wrapped by ipcMain.handle. Then test the functions directly.

Let me restructure:

- `electron/main/telegram/handlers.ts` - contains the actual handler functions (testable)
- `electron/main/ipc.ts` - wraps handlers with ipcMain (not tested directly)

- [ ] **Step 1: Write failing test for auth functions**

Create `tests/integration/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('Auth functions', () => {
  it('should define sendPhoneCode', async () => {
    const { sendPhoneCode } = await import('../../electron/main/telegram/auth')
    expect(sendPhoneCode).toBeDefined()
  })

  it('should define verifyCode', async () => {
    const { verifyCode } = await import('../../electron/main/telegram/auth')
    expect(verifyCode).toBeDefined()
  })

  it('should define check2FA', async () => {
    const { check2FA } = await import('../../electron/main/telegram/auth')
    expect(check2FA).toBeDefined()
  })

  it('should define getAuthState', async () => {
    const { getAuthState } = await import('../../electron/main/telegram/auth')
    expect(getAuthState).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/auth.test.ts`
Expected: FAIL - modules don't exist

- [ ] **Step 3: Write auth module**

Create `electron/main/telegram/auth.ts`:
```ts
import { TelegramClient } from 'gramjs'
import { StringSession } from 'gramjs/sessions'

let client: TelegramClient | null = null
let stringSession: StringSession

export interface AuthState {
  isLoggedIn: boolean
  phone?: string
  codeHash?: string
  needs2FA: boolean
}

let authState: AuthState = { isLoggedIn: false, needs2FA: false }

export function getClient(): TelegramClient | null {
  return client
}

export async function initClient(session: string): Promise<void> {
  stringSession = new StringSession(session)
  client = new TelegramClient(stringSession, Number(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH || '', {
    connectionRetries: 5,
  })
}

export async function startClient(): Promise<void> {
  if (!client) throw new Error('Client not initialized')
  await client.start({
    phoneNumber: async () => { throw new Error('Use sendPhoneCode instead') },
    password: async () => { throw new Error('Use check2FA instead') },
    phoneCode: async () => { throw new Error('Use verifyCode instead') },
    onError: (err) => { throw err }
  })
}

export async function sendPhoneCode(phone: string): Promise<{ codeHash: string }> {
  if (!client) throw new Error('Client not initialized')
  const result = await client.sendCode(
    { apiId: Number(process.env.TELEGRAM_API_ID), apiHash: process.env.TELEGRAM_API_HASH || '' },
    phone
  )
  authState.phone = phone
  authState.codeHash = result.phoneCodeHash
  return { codeHash: result.phoneCodeHash }
}

export async function verifyCode(phone: string, code: string, codeHash: string): Promise<{ needs2FA: boolean }> {
  if (!client) throw new Error('Client not initialized')
  try {
    await client.invoke(
      new (await import('gramjs/api')).auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash: codeHash,
        phoneCode: code
      })
    )
    authState.isLoggedIn = true
    authState.needs2FA = false
    return { needs2FA: false }
  } catch (err: any) {
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      authState.needs2FA = true
      return { needs2FA: true }
    }
    throw err
  }
}

export async function check2FA(password: string): Promise<void> {
  if (!client) throw new Error('Client not initialized')
  await client.signInUserWithPassword({ password })
  authState.isLoggedIn = true
  authState.needs2FA = false
}

export function getAuthState(): AuthState {
  return { ...authState }
}

export function getSession(): string {
  return stringSession.save() as string
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Write storage module**

Create `electron/main/telegram/storage.ts`:
```ts
import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const SESSION_FILE = 'teledrive-session.enc'

function getSessionPath(): string {
  return join(app.getPath('userData'), SESSION_FILE)
}

export function saveSession(sessionData: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system')
  }
  const encrypted = safeStorage.encryptString(sessionData)
  writeFileSync(getSessionPath(), encrypted)
}

export function loadSession(): string | null {
  const path = getSessionPath()
  if (!existsSync(path)) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  const encrypted = readFileSync(path)
  return safeStorage.decryptString(encrypted)
}

export function clearSession(): void {
  const path = getSessionPath()
  if (existsSync(path)) {
    writeFileSync(path, '')
  }
}
```

- [ ] **Step 6: Update IPC handlers**

Modify `electron/main/ipc.ts`:
```ts
import { ipcMain } from 'electron'
import { initClient, startClient, sendPhoneCode, verifyCode, check2FA, getAuthState, getSession } from './telegram/auth'
import { saveSession, loadSession, clearSession } from './telegram/storage'

export function registerIpcHandlers(): void {
  ipcMain.handle('auth:init', async () => {
    const session = loadSession()
    if (session) {
      await initClient(session)
      await startClient()
      return { initialized: true }
    }
    await initClient('')
    return { initialized: false }
  })

  ipcMain.handle('auth:sendCode', async (_event, phone: string) => {
    return sendPhoneCode(phone)
  })

  ipcMain.handle('auth:verifyCode', async (_event, phone: string, code: string, codeHash: string) => {
    const result = await verifyCode(phone, code, codeHash)
    if (!result.needs2FA) {
      saveSession(getSession())
    }
    return result
  })

  ipcMain.handle('auth:check2FA', async (_event, password: string) => {
    await check2FA(password)
    saveSession(getSession())
  })

  ipcMain.handle('auth:getState', () => {
    return getAuthState()
  })

  ipcMain.handle('auth:logout', async () => {
    clearSession()
  })
}
```

- [ ] **Step 7: Update preload**

Modify `electron/preload/index.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  init: () => ipcRenderer.invoke('auth:init'),
  sendCode: (phone: string) => ipcRenderer.invoke('auth:sendCode', phone),
  verifyCode: (phone: string, code: string, codeHash: string) =>
    ipcRenderer.invoke('auth:verifyCode', phone, code, codeHash),
  check2FA: (password: string) => ipcRenderer.invoke('auth:check2FA', password),
  getAuthState: () => ipcRenderer.invoke('auth:getState'),
  logout: () => ipcRenderer.invoke('auth:logout')
})
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Telegram auth IPC handlers"
```

---

### Task 4: Login UI

**Files:**
- Create: `tests/unit/components/LoginForm.test.tsx`
- Create: `src/components/LoginForm.tsx`
- Create: `tests/unit/pages/LoginPage.test.tsx`
- Create: `src/pages/LoginPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/types/index.ts` (add telegramAPI type)

- [ ] **Step 1: Write LoginForm tests**

Create `tests/unit/components/LoginForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '../../src/components/LoginForm'

describe('LoginForm', () => {
  it('should show phone input initially', () => {
    render(<LoginForm onCodeSent={() => {}} onLoggedIn={() => {}} />)
    expect(screen.getByPlaceholderText(/teléfono/i)).toBeDefined()
  })

  it('should call onCodeSent when submitting phone', () => {
    const onCodeSent = vi.fn()
    render(<LoginForm onCodeSent={onCodeSent} onLoggedIn={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/teléfono/i), { target: { value: '+525551234567' } })
    fireEvent.click(screen.getByText(/enviar código/i))
    expect(onCodeSent).toHaveBeenCalledWith('+525551234567')
  })

  it('should show code input after phone', () => {
    render(<LoginForm onCodeSent={() => {}} onLoggedIn={() => {}} codeHash="abc123" />)
    expect(screen.getByPlaceholderText(/código/i)).toBeDefined()
  })

  it('should show 2FA input when needed', () => {
    render(<LoginForm onCodeSent={() => {}} onLoggedIn={() => {}} needs2FA={true} />)
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/LoginForm.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write LoginForm**

Create `src/components/LoginForm.tsx`:
```tsx
import { useState, FormEvent } from 'react'

interface LoginFormProps {
  onSendCode: (phone: string) => void
  onVerifyCode: (phone: string, code: string) => void
  onCheck2FA: (password: string) => void
  codeHash?: string
  needs2FA?: boolean
  error?: string
  loading?: boolean
}

export default function LoginForm({ onSendCode, onVerifyCode, onCheck2FA, codeHash, needs2FA, error, loading }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (needs2FA) {
      onCheck2FA(password)
    } else if (codeHash) {
      onVerifyCode(phone, code)
    } else {
      onSendCode(phone)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24, textAlign: 'center' }}>TeleDrive</h1>

      {!codeHash && !needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Número de teléfono</label>
          <input
            type="tel"
            placeholder="+52 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </div>
      )}

      {codeHash && !needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Código de verificación</label>
          <input
            type="text"
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </div>
      )}

      {needs2FA && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Contraseña 2FA</label>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </div>
      )}

      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: 12, fontSize: 16, borderRadius: 6,
          background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer'
        }}
      >
        {loading ? 'Procesando...' : needs2FA ? 'Iniciar sesión' : codeHash ? 'Verificar código' : 'Enviar código'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/LoginForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Write LoginPage tests**

Create `tests/unit/pages/LoginPage.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../../src/pages/LoginPage'

describe('LoginPage', () => {
  it('should render LoginForm', () => {
    render(<LoginPage onLogin={() => {}} />)
    expect(screen.getByText('TeleDrive')).toBeDefined()
  })
})
```

- [ ] **Step 6: Write LoginPage**

Create `src/pages/LoginPage.tsx`:
```tsx
import { useState } from 'react'
import LoginForm from '../components/LoginForm'

declare global {
  interface Window {
    telegramAPI: {
      init: () => Promise<{ initialized: boolean }>
      sendCode: (phone: string) => Promise<{ codeHash: string }>
      verifyCode: (phone: string, code: string, codeHash: string) => Promise<{ needs2FA: boolean }>
      check2FA: (password: string) => Promise<void>
      getAuthState: () => Promise<any>
      logout: () => Promise<void>
      getGroups: () => Promise<any[]>
      getArchivedGroups: () => Promise<any[]>
      createGroup: (title: string) => Promise<any>
      listFiles: (groupId: number, filter: string) => Promise<any[]>
      uploadFile: (groupId: number, filePath: string) => Promise<any>
      downloadFile: (groupId: number, messageId: number, filePath: string) => Promise<void>
      deleteFile: (groupId: number, messageId: number) => Promise<void>
      forwardFile: (fromGroupId: number, toGroupId: number, messageId: number) => Promise<void>
    }
  }
}

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [codeHash, setCodeHash] = useState<string | undefined>()
  const [needs2FA, setNeeds2FA] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (p: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.telegramAPI.sendCode(p)
      setCodeHash(result.codeHash)
      setPhone(p)
    } catch (err: any) {
      setError(err.message || 'Error al enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (p: string, code: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.telegramAPI.verifyCode(p, code, codeHash!)
      if (result.needs2FA) {
        setNeeds2FA(true)
      } else {
        onLogin()
      }
    } catch (err: any) {
      setError(err.message || 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck2FA = async (password: string) => {
    setLoading(true)
    setError('')
    try {
      await window.telegramAPI.check2FA(password)
      onLogin()
    } catch (err: any) {
      setError(err.message || 'Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginForm
      onSendCode={handleSendCode}
      onVerifyCode={handleVerifyCode}
      onCheck2FA={handleCheck2FA}
      codeHash={codeHash}
      needs2FA={needs2FA}
      error={error}
      loading={loading}
    />
  )
}
```

- [ ] **Step 7: Update App.tsx with auth guard**

Modify `src/App.tsx`:
```tsx
import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    window.telegramAPI.init().then((result) => {
      setIsLoggedIn(result.initialized)
      setChecking(false)
    })
  }, [])

  if (checking) return <div style={{ padding: 20, textAlign: 'center' }}>Conectando...</div>

  return isLoggedIn ? <GroupListPage /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />
}
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add login UI with auth flow"
```

---

### Task 5: Group operations IPC (main process)

**Files:**
- Create: `electron/main/telegram/groups.ts`
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Write group functions tests**

Create `tests/integration/groups.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('Group functions', () => {
  it('should define getGroups', async () => {
    const { getGroups } = await import('../../electron/main/telegram/groups')
    expect(getGroups).toBeDefined()
  })

  it('should define getArchivedGroups', async () => {
    const { getArchivedGroups } = await import('../../electron/main/telegram/groups')
    expect(getArchivedGroups).toBeDefined()
  })

  it('should define createGroup', async () => {
    const { createGroup } = await import('../../electron/main/telegram/groups')
    expect(createGroup).toBeDefined()
  })
})
```

- [ ] **Step 2: Write groups module**

Create `electron/main/telegram/groups.ts`:
```ts
import { getClient } from './auth'

export async function getGroups(): Promise<any[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: false })
  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => ({
      id: d.id,
      title: d.title,
      isArchived: false,
      isOwner: d.isCreator || false,
      fileCount: d.message?.peerId ? 0 : 0,
      totalSize: 0
    }))
}

export async function getArchivedGroups(): Promise<any[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const dialogs = await client.getDialogs({ archived: true })
  return dialogs
    .filter(d => d.isGroup || d.isChannel)
    .map(d => ({
      id: d.id,
      title: d.title,
      isArchived: true,
      isOwner: d.isCreator || false,
      fileCount: 0,
      totalSize: 0
    }))
}

export async function createGroup(title: string): Promise<any> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.createGroup(title, [])
  return { id: result.id, title, isArchived: false, isOwner: true }
}
```

- [ ] **Step 3: Update IPC handlers**

Modify `electron/main/ipc.ts` — add handlers to `registerIpcHandlers`:
```ts
import { getGroups, getArchivedGroups, createGroup } from './telegram/groups'

// Inside registerIpcHandlers():
  ipcMain.handle('groups:list', async () => {
    return getGroups()
  })

  ipcMain.handle('groups:listArchived', async () => {
    return getArchivedGroups()
  })

  ipcMain.handle('groups:create', async (_event, title: string) => {
    return createGroup(title)
  })
```

- [ ] **Step 4: Update preload**

Modify `electron/preload/index.ts` — add inside the expose object:
```ts
  getGroups: () => ipcRenderer.invoke('groups:list'),
  getArchivedGroups: () => ipcRenderer.invoke('groups:listArchived'),
  createGroup: (title: string) => ipcRenderer.invoke('groups:create', title),
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add group operations IPC"
```

---

### Task 6: Group list UI

**Files:**
- Create: `tests/unit/components/GroupListItem.test.tsx`
- Create: `src/components/GroupListItem.tsx`
- Create: `tests/unit/pages/GroupListPage.test.tsx`
- Create: `src/pages/GroupListPage.tsx`

- [ ] **Step 1: Write GroupListItem tests**

Create `tests/unit/components/GroupListItem.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroupListItem from '../../src/components/GroupListItem'

const mockGroup = {
  id: 123,
  title: 'MiDrive-Fotos',
  isArchived: false,
  isOwner: true,
  fileCount: 245,
  totalSize: 1048576
}

describe('GroupListItem', () => {
  it('should render group title', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText('MiDrive-Fotos')).toBeDefined()
  })

  it('should show "Propio" badge when isOwner is true', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText('Propio')).toBeDefined()
  })

  it('should show "Tercero" badge when isOwner is false', () => {
    const thirdParty = { ...mockGroup, isOwner: false }
    render(<GroupListItem group={thirdParty} onClick={() => {}} />)
    expect(screen.getByText('Tercero')).toBeDefined()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GroupListItem group={mockGroup} onClick={onClick} />)
    fireEvent.click(screen.getByText('MiDrive-Fotos'))
    expect(onClick).toHaveBeenCalledWith(mockGroup)
  })

  it('should show file count', () => {
    render(<GroupListItem group={mockGroup} onClick={() => {}} />)
    expect(screen.getByText(/245/)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/GroupListItem.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write GroupListItem**

Create `src/components/GroupListItem.tsx`:
```tsx
import { TelegramGroup } from '../types'
import { formatFileSize } from '../utils/format'

interface GroupListItemProps {
  group: TelegramGroup
  onClick: (group: TelegramGroup) => void
}

export default function GroupListItem({ group, onClick }: GroupListItemProps) {
  const initials = group.title.charAt(0).toUpperCase()
  const bgColor = group.isOwner ? '#4CAF50' : '#FF9800'

  return (
    <div
      onClick={() => onClick(group)}
      style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        cursor: 'pointer', opacity: group.isArchived ? 0.6 : 1,
        borderBottom: '1px solid #eee'
      }}
    >
      <div style={{
        background: bgColor, color: 'white', borderRadius: '50%',
        width: 40, height: 40, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginRight: 12, fontWeight: 'bold'
      }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>
          {group.title}
          <span style={{
            background: bgColor, color: 'white', fontSize: 10,
            padding: '1px 6px', borderRadius: 4, marginLeft: 8
          }}>
            {group.isOwner ? 'Propio' : 'Tercero'}
          </span>
          {group.isArchived && (
            <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>Archivado</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {group.fileCount != null ? `${group.fileCount} archivos` : ''}
          {group.fileCount != null && group.totalSize ? ` · ${formatFileSize(group.totalSize)}` : ''}
          {!group.isOwner && ' · Solo lectura'}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/GroupListItem.test.tsx`
Expected: PASS

- [ ] **Step 5: Write GroupListPage tests**

Create `tests/unit/pages/GroupListPage.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GroupListPage from '../../src/pages/GroupListPage'

describe('GroupListPage', () => {
  it('should render without crashing', () => {
    render(<GroupListPage />)
    expect(screen.getByText(/grupos/i)).toBeDefined()
  })
})
```

- [ ] **Step 6: Write GroupListPage**

Create `src/pages/GroupListPage.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { TelegramGroup } from '../types'
import GroupListItem from '../components/GroupListItem'

interface GroupListPageProps {
  onSelectGroup?: (group: TelegramGroup) => void
}

export default function GroupListPage({ onSelectGroup }: GroupListPageProps) {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [archived, setArchived] = useState<TelegramGroup[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const [g, a] = await Promise.all([
        window.telegramAPI.getGroups(),
        window.telegramAPI.getArchivedGroups()
      ])
      setGroups(g)
      setArchived(a)
    } catch (err) {
      console.error('Error loading groups', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    const title = prompt('Nombre del nuevo grupo:')
    if (!title) return
    try {
      await window.telegramAPI.createGroup(title)
      loadGroups()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando grupos...</div>

  const displayGroups = showArchived ? archived : groups

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Grupos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowArchived(!showArchived)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: 12 }}>
            {showArchived ? 'Activos' : 'Archivados'}
          </button>
          <button onClick={handleCreateGroup}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#4CAF50', color: 'white', cursor: 'pointer', fontSize: 12 }}>
            + Nuevo grupo
          </button>
        </div>
      </div>
      {displayGroups.map(g => (
        <GroupListItem
          key={g.id}
          group={g}
          onClick={(group) => onSelectGroup?.(group)}
        />
      ))}
      {displayGroups.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          {showArchived ? 'No hay grupos archivados' : 'No hay grupos. Crea uno nuevo.'}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Update App.tsx with navigation**

Modify `src/App.tsx`:
```tsx
import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import GroupListPage from './pages/GroupListPage'
import GroupFilesPage from './pages/GroupFilesPage'
import { TelegramGroup } from './types'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null)

  useEffect(() => {
    window.telegramAPI.init().then((result) => {
      setIsLoggedIn(result.initialized)
      setChecking(false)
    })
  }, [])

  if (checking) return <div style={{ padding: 20, textAlign: 'center' }}>Conectando...</div>
  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  if (selectedGroup) {
    return (
      <GroupFilesPage
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    )
  }
  return <GroupListPage onSelectGroup={setSelectedGroup} />
}
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add group list UI"
```

---

### Task 7: File operations IPC (main process)

**Files:**
- Create: `electron/main/telegram/files.ts`
- Modify: `electron/main/ipc.ts`
- Modify: `electron/preload/index.ts`

- [ ] **Step 1: Write file functions tests**

Create `tests/integration/files.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('File functions', () => {
  it('should define listFiles', async () => {
    const { listFiles } = await import('../../electron/main/telegram/files')
    expect(listFiles).toBeDefined()
  })

  it('should define uploadFile', async () => {
    const { uploadFile } = await import('../../electron/main/telegram/files')
    expect(uploadFile).toBeDefined()
  })

  it('should define downloadFile', async () => {
    const { downloadFile } = await import('../../electron/main/telegram/files')
    expect(downloadFile).toBeDefined()
  })

  it('should define deleteFile', async () => {
    const { deleteFile } = await import('../../electron/main/telegram/files')
    expect(deleteFile).toBeDefined()
  })

  it('should define forwardFile', async () => {
    const { forwardFile } = await import('../../electron/main/telegram/files')
    expect(forwardFile).toBeDefined()
  })
})
```

- [ ] **Step 2: Write files module**

Create `electron/main/telegram/files.ts`:
```ts
import { getClient } from './auth'
import * as path from 'path'

export async function listFiles(groupId: number, filter: string = 'all'): Promise<any[]> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { limit: 100 })
  const files = messages.filter(m => m.media)

  return files.map(m => {
    let name = 'unknown'
    let size = 0
    let mimeType = 'application/octet-stream'

    if (m.media) {
      const media = m.media as any
      if (media.document) {
        name = media.document.attributes?.find((a: any) => a.fileName)?.fileName || 'file'
        size = Number(media.document.size) || 0
        mimeType = media.document.mimeType || 'application/octet-stream'
      } else if (media.photo) {
        name = `photo_${m.id}.jpg`
        mimeType = 'image/jpeg'
      }
    }

    return { id: m.id, messageId: m.id, name, size, mimeType, date: m.date, groupId }
  })
}

export async function uploadFile(groupId: number, filePath: string): Promise<any> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const result = await client.sendFile(groupId, { file: filePath })
  return { messageId: result.id }
}

export async function downloadFile(groupId: number, messageId: number, destPath: string): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  const messages = await client.getMessages(groupId, { ids: messageId })
  if (messages.length === 0) throw new Error('Message not found')

  const media = messages[0].media
  if (!media) throw new Error('No media in message')

  await client.downloadMedia(media, { outputFile: destPath })
}

export async function deleteFile(groupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.deleteMessages(groupId, [messageId], { revoke: true })
}

export async function forwardFile(fromGroupId: number, toGroupId: number, messageId: number): Promise<void> {
  const client = getClient()
  if (!client) throw new Error('Not authenticated')

  await client.forwardMessages(toGroupId, { messages: [messageId], fromPeer: fromGroupId })
}
```

- [ ] **Step 3: Update IPC handlers**

Modify `electron/main/ipc.ts` — add handlers:
```ts
import { listFiles, uploadFile, downloadFile, deleteFile, forwardFile } from './telegram/files'

// Inside registerIpcHandlers():
  ipcMain.handle('files:list', async (_event, groupId: number, filter: string) => {
    return listFiles(groupId, filter)
  })

  ipcMain.handle('files:upload', async (_event, groupId: number, filePath: string) => {
    return uploadFile(groupId, filePath)
  })

  ipcMain.handle('files:download', async (_event, groupId: number, messageId: number, filePath: string) => {
    return downloadFile(groupId, messageId, filePath)
  })

  ipcMain.handle('files:delete', async (_event, groupId: number, messageId: number) => {
    return deleteFile(groupId, messageId)
  })

  ipcMain.handle('files:forward', async (_event, fromGroupId: number, toGroupId: number, messageId: number) => {
    return forwardFile(fromGroupId, toGroupId, messageId)
  })
```

- [ ] **Step 4: Update preload**

Modify `electron/preload/index.ts`:
```ts
  getGroups: () => ipcRenderer.invoke('groups:list'),
  getArchivedGroups: () => ipcRenderer.invoke('groups:listArchived'),
  createGroup: (title: string) => ipcRenderer.invoke('groups:create', title),
  listFiles: (groupId: number, filter: string) => ipcRenderer.invoke('files:list', groupId, filter),
  uploadFile: (groupId: number, filePath: string) => ipcRenderer.invoke('files:upload', groupId, filePath),
  downloadFile: (groupId: number, messageId: number, filePath: string) =>
    ipcRenderer.invoke('files:download', groupId, messageId, filePath),
  deleteFile: (groupId: number, messageId: number) => ipcRenderer.invoke('files:delete', groupId, messageId),
  forwardFile: (fromGroupId: number, toGroupId: number, messageId: number) =>
    ipcRenderer.invoke('files:forward', fromGroupId, toGroupId, messageId),
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add file operations IPC"
```

---

### Task 8: File list view UI

**Files:**
- Create: `tests/unit/components/FileList.test.tsx`
- Create: `src/components/FileList.tsx`
- Create: `tests/unit/components/FileListItem.test.tsx`

- [ ] **Step 1: Write FileListItem tests**

Create `tests/unit/components/FileListItem.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileListItem from '../../src/components/FileListItem'
import { TelegramFile } from '../../src/types'

const mockFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date(), groupId: 123
}

describe('FileListItem', () => {
  it('should render file name', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should show file type icon', () => {
    render(<FileListItem file={mockFile} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('🖼️')).toBeDefined()
  })
})
```

- [ ] **Step 2: Write FileList tests**

Create `tests/unit/components/FileList.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FileList from '../../src/components/FileList'
import { TelegramFile } from '../../src/types'

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date(), groupId: 123 },
  { id: 2, messageId: 2, name: 'doc.pdf', size: 1048576, mimeType: 'application/pdf', date: new Date(), groupId: 123 }
]

describe('FileList', () => {
  it('should render all files', () => {
    render(<FileList files={mockFiles} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
    expect(screen.getByText('doc.pdf')).toBeDefined()
  })

  it('should show empty state', () => {
    render(<FileList files={[]} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/sin archivos/i)).toBeDefined()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/FileList.test.tsx tests/unit/components/FileListItem.test.tsx`
Expected: FAIL

- [ ] **Step 4: Write FileListItem**

Create `src/components/FileListItem.tsx`:
```tsx
import { TelegramFile } from '../types'
import { formatFileSize } from '../utils/format'
import { fileTypeLabel } from '../utils/fileTypes'

interface FileListItemProps {
  file: TelegramFile
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function FileListItem({ file, onDownload, onDelete, readonly }: FileListItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #eee' }}>
      <span style={{ marginRight: 12, fontSize: 18 }}>{fileTypeLabel(file.mimeType)}</span>
      <span style={{ flex: 1, fontSize: 14 }}>{file.name}</span>
      <span style={{ color: '#888', fontSize: 12, marginRight: 16 }}>{formatFileSize(file.size)}</span>
      <span style={{ color: '#888', fontSize: 12, marginRight: 16 }}>
        {new Date(file.date).toLocaleDateString()}
      </span>
      <span style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onDownload(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="Descargar">⬇️</button>
        {!readonly && (
          <button onClick={() => onDelete(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="Eliminar">🗑️</button>
        )}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Write FileList**

Create `src/components/FileList.tsx`:
```tsx
import { TelegramFile } from '../types'
import FileListItem from './FileListItem'

interface FileListProps {
  files: TelegramFile[]
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function FileList({ files, onDownload, onDelete, readonly }: FileListProps) {
  if (files.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Sin archivos</div>
  }

  return (
    <div>
      {files.map(f => (
        <FileListItem
          key={f.id}
          file={f}
          onDownload={onDownload}
          onDelete={onDelete}
          readonly={readonly}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/FileList.test.tsx tests/unit/components/FileListItem.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add file list UI components"
```

---

### Task 9: Gallery grid view

**Files:**
- Create: `tests/unit/components/FileGrid.test.tsx`
- Create: `src/components/FileGrid.tsx`

- [ ] **Step 1: Write FileGrid tests**

Create `tests/unit/components/FileGrid.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileGrid from '../../src/components/FileGrid'
import { TelegramFile } from '../../src/types'

const mockFiles: TelegramFile[] = [
  { id: 1, messageId: 1, name: 'foto.jpg', size: 2048, mimeType: 'image/jpeg', date: new Date(), groupId: 123 },
  { id: 2, messageId: 2, name: 'video.mp4', size: 1048576, mimeType: 'video/mp4', date: new Date(), groupId: 123 },
  { id: 3, messageId: 3, name: 'foto2.png', size: 4096, mimeType: 'image/png', date: new Date(), groupId: 123 },
  { id: 4, messageId: 4, name: 'doc.pdf', size: 204800, mimeType: 'application/pdf', date: new Date(), groupId: 123 },
]

describe('FileGrid', () => {
  it('should render images and videos in grid', () => {
    render(<FileGrid files={mockFiles} onPreview={() => {}} />)
    // Should show 3 media files in grid
    expect(screen.getByText('foto.jpg')).toBeDefined()
    expect(screen.getByText('video.mp4')).toBeDefined()
    expect(screen.getByText('foto2.png')).toBeDefined()
  })

  it('should not show non-media files', () => {
    render(<FileGrid files={mockFiles} onPreview={() => {}} />)
    expect(screen.queryByText('doc.pdf')).toBeNull()
  })

  it('should call onPreview when clicking an item', () => {
    const onPreview = vi.fn()
    render(<FileGrid files={mockFiles} onPreview={onPreview} />)
    fireEvent.click(screen.getByText('foto.jpg'))
    expect(onPreview).toHaveBeenCalledWith(mockFiles[0])
  })

  it('should show empty state', () => {
    render(<FileGrid files={[]} onPreview={() => {}} />)
    expect(screen.getByText(/sin archivos/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/FileGrid.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write FileGrid**

Create `src/components/FileGrid.tsx`:
```tsx
import { TelegramFile } from '../types'
import { isMedia } from '../utils/fileTypes'

interface FileGridProps {
  files: TelegramFile[]
  onPreview: (file: TelegramFile) => void
}

export default function FileGrid({ files, onPreview }: FileGridProps) {
  const mediaFiles = files.filter(f => isMedia(f.mimeType))

  if (mediaFiles.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Sin archivos multimedia</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, padding: 12 }}>
      {mediaFiles.map(f => (
        <div
          key={f.id}
          onClick={() => onPreview(f)}
          style={{
            aspectRatio: '1', borderRadius: 8, cursor: 'pointer',
            background: `linear-gradient(135deg, ${getColor(f.mimeType, 0)}, ${getColor(f.mimeType, 1)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, textAlign: 'center', padding: 8,
            position: 'relative', overflow: 'hidden'
          }}
        >
          {f.mimeType.startsWith('video/') && (
            <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>
              ▶️
            </div>
          )}
          <div style={{ fontSize: 11, wordBreak: 'break-all' }}>{f.name}</div>
        </div>
      ))}
    </div>
  )
}

const COLORS: Record<string, [string, string]> = {
  'image/jpeg': ['#667eea', '#764ba2'],
  'image/png': ['#f093fb', '#f5576c'],
  'image/gif': ['#4facfe', '#00f2fe'],
  'image/webp': ['#43e97b', '#38f9d7'],
  'video/mp4': ['#a18cd1', '#fbc2eb'],
  'video/avi': ['#fa709a', '#fee140'],
  'video/mkv': ['#30cfd0', '#330867'],
  'video/webm': ['#a8edea', '#fed6e3'],
}

function getColor(mimeType: string, index: number): string {
  return COLORS[mimeType]?.[index] || (index === 0 ? '#667eea' : '#764ba2')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/FileGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add gallery grid view"
```

---

### Task 10: Toolbar with view toggle and filters

**Files:**
- Create: `tests/unit/components/Toolbar.test.tsx`
- Create: `src/components/Toolbar.tsx`
- Create: `src/pages/GroupFilesPage.tsx`

- [ ] **Step 1: Write Toolbar tests**

Create `tests/unit/components/Toolbar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../../src/components/Toolbar'

describe('Toolbar', () => {
  it('should show view mode buttons', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText('Lista')).toBeDefined()
    expect(screen.getByText('Galería')).toBeDefined()
  })

  it('should highlight active view mode', () => {
    render(<Toolbar viewMode="gallery" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    const galleryBtn = screen.getByText('Galería')
    expect(galleryBtn.style.background).toBe('#4CAF50')
  })

  it('should call onViewModeChange when clicking view button', () => {
    const onChange = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={onChange} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    fireEvent.click(screen.getByText('Galería'))
    expect(onChange).toHaveBeenCalledWith('gallery')
  })

  it('should show filter buttons', () => {
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={() => {}} onUpload={() => {}} />)
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Multimedia')).toBeDefined()
    expect(screen.getByText('Documentos')).toBeDefined()
  })

  it('should call onFilterChange when clicking filter', () => {
    const onFilter = vi.fn()
    render(<Toolbar viewMode="list" onViewModeChange={() => {}} filter="all" onFilterChange={onFilter} onUpload={() => {}} />)
    fireEvent.click(screen.getByText('Multimedia'))
    expect(onFilter).toHaveBeenCalledWith('media')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/Toolbar.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write Toolbar**

Create `src/components/Toolbar.tsx`:
```tsx
import { ViewMode, FileFilter } from '../types'

interface ToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  filter: FileFilter
  onFilterChange: (filter: FileFilter) => void
  onUpload: () => void
  readonly?: boolean
}

export default function Toolbar({ viewMode, onViewModeChange, filter, onFilterChange, onUpload, readonly }: ToolbarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #ddd', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onViewModeChange('list')}
          style={{
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            background: viewMode === 'list' ? '#4CAF50' : 'transparent',
            color: viewMode === 'list' ? 'white' : '#333',
            border: viewMode === 'list' ? '1px solid #4CAF50' : '1px solid #ddd'
          }}
        >
          📋 Lista
        </button>
        <button
          onClick={() => onViewModeChange('gallery')}
          style={{
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            background: viewMode === 'gallery' ? '#4CAF50' : 'transparent',
            color: viewMode === 'gallery' ? 'white' : '#333',
            border: viewMode === 'gallery' ? '1px solid #4CAF50' : '1px solid #ddd'
          }}
        >
          🖼️ Galería
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <FilterChip label="Todos" active={filter === 'all'} onClick={() => onFilterChange('all')} />
        <FilterChip label="Multimedia" active={filter === 'media'} onClick={() => onFilterChange('media')} />
        <FilterChip label="Documentos" active={filter === 'documents'} onClick={() => onFilterChange('documents')} />
      </div>

      {!readonly && (
        <button onClick={onUpload} style={{
          padding: '6px 16px', background: '#4CAF50', color: 'white', border: 'none',
          borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
        }}>
          + Subir
        </button>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 12,
        background: active ? '#E8F5E9' : 'transparent',
        color: active ? '#2E7D32' : '#666',
        border: '1px solid', borderColor: active ? '#4CAF50' : '#ddd',
        fontWeight: active ? 600 : 400
      }}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/Toolbar.test.tsx`
Expected: PASS

- [ ] **Step 5: Write GroupFilesPage**

Create `src/pages/GroupFilesPage.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { TelegramGroup, TelegramFile, ViewMode, FileFilter } from '../types'
import Toolbar from '../components/Toolbar'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import PreviewModal from '../components/PreviewModal'
import UploadDialog from '../components/UploadDialog'
import { isMedia, isDocument } from '../utils/fileTypes'

interface GroupFilesPageProps {
  group: TelegramGroup
  onBack: () => void
}

export default function GroupFilesPage({ group, onBack }: GroupFilesPageProps) {
  const [files, setFiles] = useState<TelegramFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<TelegramFile | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const loadFiles = async () => {
    try {
      const result = await window.telegramAPI.listFiles(group.id, filter)
      setFiles(result)
    } catch (err) {
      console.error('Error loading files', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [group.id])

  const filteredFiles = files.filter(f => {
    if (filter === 'media') return isMedia(f.mimeType)
    if (filter === 'documents') return isDocument(f.mimeType)
    return true
  })

  const handleUpload = async (filePath: string) => {
    try {
      await window.telegramAPI.uploadFile(group.id, filePath)
      setShowUpload(false)
      loadFiles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDownload = async (file: TelegramFile) => {
    try {
      await window.telegramAPI.downloadFile(group.id, file.messageId, file.name)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (file: TelegramFile) => {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return
    try {
      await window.telegramAPI.deleteFile(group.id, file.messageId)
      loadFiles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>⬅️</button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{group.title}</span>
        {!group.isOwner && <span style={{ fontSize: 11, color: '#FF9800' }}>(Solo lectura)</span>}
      </div>

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onUpload={() => setShowUpload(true)}
        readonly={!group.isOwner}
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando archivos...</div>
        ) : viewMode === 'list' ? (
          <FileList files={filteredFiles} onDownload={handleDownload} onDelete={handleDelete} readonly={!group.isOwner} />
        ) : (
          <FileGrid files={filteredFiles} onPreview={setPreviewFile} />
        )}
      </div>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
          readonly={!group.isOwner}
        />
      )}

      {showUpload && (
        <UploadDialog
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add toolbar with view toggle and filters"
```

---

### Task 11: Preview modal with navigation

**Files:**
- Create: `tests/unit/components/PreviewModal.test.tsx`
- Create: `src/components/PreviewModal.tsx`

- [ ] **Step 1: Write PreviewModal tests**

Create `tests/unit/components/PreviewModal.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PreviewModal from '../../src/components/PreviewModal'
import { TelegramFile } from '../../src/types'

const mockFile: TelegramFile = {
  id: 1, messageId: 1, name: 'foto.jpg', size: 2048,
  mimeType: 'image/jpeg', date: new Date(), groupId: 123
}

describe('PreviewModal', () => {
  it('should render file name', () => {
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('foto.jpg')).toBeDefined()
  })

  it('should show file size', () => {
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/2.0 KB/)).toBeDefined()
  })

  it('should call onClose when clicking close', () => {
    const onClose = vi.fn()
    render(<PreviewModal file={mockFile} onClose={onClose} onDownload={() => {}} onDelete={() => {}} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onDownload when clicking download', () => {
    const onDownload = vi.fn()
    render(<PreviewModal file={mockFile} onClose={() => {}} onDownload={onDownload} onDelete={() => {}} />)
    fireEvent.click(screen.getByTitle('Descargar'))
    expect(onDownload).toHaveBeenCalledWith(mockFile)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/PreviewModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write PreviewModal**

Create `src/components/PreviewModal.tsx`:
```tsx
import { TelegramFile } from '../types'
import { formatFileSize, formatDate } from '../utils/format'

interface PreviewModalProps {
  file: TelegramFile
  onClose: () => void
  onDownload: (file: TelegramFile) => void
  onDelete: (file: TelegramFile) => void
  readonly?: boolean
}

export default function PreviewModal({ file, onClose, onDownload, onDelete, readonly }: PreviewModalProps) {
  const isVideo = file.mimeType.startsWith('video/')

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        {!readonly && (
          <button onClick={() => onDelete(file)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}>
            🗑️
          </button>
        )}
        <button onClick={() => onDownload(file)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}>
          ⬇️
        </button>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>
          ✕
        </button>
      </div>

      <div style={{
        background: '#1a1a2e', borderRadius: 12, padding: 24,
        maxWidth: '80vw', maxHeight: '70vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {isVideo ? '🎬' : '🖼️'}
        </div>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{file.name}</div>
        <div style={{ color: '#aaa', fontSize: 13 }}>
          {formatFileSize(file.size)} · {file.mimeType} · {formatDate(new Date(file.date))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, color: '#aaa', fontSize: 13 }}>
        <span>‹ Anterior</span>
        <span>|</span>
        <span>Siguiente ›</span>
        <span>|</span>
        <span>🔍 Zoom</span>
        <span>|</span>
        <span>↕ Ajustar</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/PreviewModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add preview modal with navigation"
```

---

### Task 12: Upload dialog

**Files:**
- Create: `tests/unit/components/UploadDialog.test.tsx`
- Create: `src/components/UploadDialog.tsx`

- [ ] **Step 1: Write UploadDialog tests**

Create `tests/unit/components/UploadDialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadDialog from '../../src/components/UploadDialog'

describe('UploadDialog', () => {
  it('should render upload button', () => {
    render(<UploadDialog onUpload={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/seleccionar archivo/i)).toBeDefined()
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<UploadDialog onUpload={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByText(/cancelar/i))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/UploadDialog.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write UploadDialog**

Create `src/components/UploadDialog.tsx`:
```tsx
import { useState } from 'react'

interface UploadDialogProps {
  onUpload: (filePath: string) => void
  onClose: () => void
}

export default function UploadDialog({ onUpload, onClose }: UploadDialogProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file.path)
  }

  const handleClick = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      if (input.files?.[0]) onUpload(input.files[0].path)
    }
    input.click()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%'
      }}>
        <h3 style={{ marginBottom: 16 }}>Subir archivo</h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{
            border: `2px dashed ${dragging ? '#4CAF50' : '#ccc'}`,
            borderRadius: 8, padding: 40, textAlign: 'center',
            background: dragging ? '#E8F5E9' : 'transparent',
            cursor: 'pointer', marginBottom: 16,
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, color: '#888' }}>
            Arrastra un archivo aquí o haz clic para seleccionar
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc',
            background: 'white', cursor: 'pointer', fontSize: 13
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/UploadDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add upload dialog with drag & drop"
```

---

### Task 13: npm audit and security hardening

**Files:**
- Modify: `package.json` (add audit scripts)

- [ ] **Step 1: Add audit script to package.json**

```json
"audit": "npm audit",
"audit:fix": "npm audit fix"
```

- [ ] **Step 2: Run initial audit**

```bash
npm run audit
```

Expected: Report of any vulnerabilities

- [ ] **Step 3: Create .gitignore**

```
node_modules/
out/
dist/
.superpowers/
*.enc
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: add security audit and gitignore"
```

---

### Task 14: Verify complete app builds and all tests pass

- [ ] **Step 1: Run full type check**

```bash
npm run typecheck:node && npm run typecheck:web
```
Expected: No errors

- [ ] **Step 2: Run all tests**

```bash
npm test
```
Expected: All tests pass

- [ ] **Step 3: Build app**

```bash
npm run build
```
Expected: Build succeeds, output in `out/`

- [ ] **Step 4: Run security audit**

```bash
npm run audit
```
Expected: No high/critical vulnerabilities (or documented exceptions)
