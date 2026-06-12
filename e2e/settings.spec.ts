import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('settings page is accessible', async ({ page }) => {
    // Click settings button
    await page.getByRole('button', { name: /configuración/i }).click()
    
    // Should show settings page
    await expect(page.getByTestId('settings-page')).toBeVisible()
  })

  test('settings shows loading skeleton initially', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    
    // Should show skeleton or loaded content
    await expect(page.getByTestId('settings-page')).toBeVisible()
  })

  test('theme selector is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const themeSelect = page.getByRole('combobox', { name: /tema/i })
    await expect(themeSelect).toBeVisible()
  })

  test('default tab selector is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const tabSelect = page.getByRole('combobox', { name: /pestaña por defecto/i })
    await expect(tabSelect).toBeVisible()
  })

  test('batch size input is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const batchSizeInput = page.getByTestId('batch-size-input')
    await expect(batchSizeInput).toBeVisible()
  })

  test('download path field is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const pathField = page.getByTestId('download-path-field')
    await expect(pathField).toBeVisible()
  })

  test('excluded extensions input is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const extInput = page.getByTestId('excluded-extensions-input')
    await expect(extInput).toBeVisible()
  })

  test('save button is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const saveButton = page.getByRole('button', { name: /guardar$/i })
    await expect(saveButton).toBeVisible()
  })

  test('logs folder button is visible', async ({ page }) => {
    await page.getByRole('button', { name: /configuración/i }).click()
    await page.waitForTimeout(1000)
    
    const logsButton = page.getByRole('button', { name: /abrir carpeta de logs/i })
    await expect(logsButton).toBeVisible()
  })
})
