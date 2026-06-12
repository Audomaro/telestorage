import { test as base, _electron } from '@playwright/test'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export const test = base.extend({
  electronApp: async ({}, use) => {
    const userDataDir = join(process.env.APPDATA || process.env.HOME || '', 'TeleStorage')
    const app = await _electron.launch({
      args: [
        '--user-data-dir=' + userDataDir,
        join(__dirname, '../out/main/index.js')
      ],
      cwd: join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })
    
    // Capture console output for debugging
    app.on('console', (msg: any) => {
      console.log(`[Electron console] ${msg.text()}`)
    })
    
    await use(app)
    await app.close()
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    
    // Capture page console output
    page.on('console', (msg: any) => {
      console.log(`[Page console] ${msg.text()}`)
    })
    
    page.on('pageerror', (err: any) => {
      console.log(`[Page error] ${err.message}`)
    })
    
    await use(page)
  },
})

export { expect } from '@playwright/test'
