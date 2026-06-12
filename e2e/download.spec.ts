import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

test.describe('Download Panel', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('download panel toggle works', async ({ page }) => {
    // Toggle download panel
    const toggleButton = page.getByRole('button', { name: /descargas/i })
    await expect(toggleButton).toBeVisible()
    await toggleButton.click()
    
    // Panel should be visible
    await expect(page.getByTestId('download-panel')).toBeVisible()
  })

  test('download panel shows empty state', async ({ page }) => {
    // Toggle download panel
    await page.getByRole('button', { name: /descargas/i }).click()
    await page.waitForTimeout(500)
    
    // Should show empty state or list
    const panel = page.getByTestId('download-panel')
    await expect(panel).toBeVisible()
  })

  test('download panel can be hidden', async ({ page }) => {
    // Toggle on
    await page.getByRole('button', { name: /descargas/i }).click()
    await page.waitForTimeout(500)
    
    await expect(page.getByTestId('download-panel')).toBeVisible()
    
    // Toggle off
    await page.getByRole('button', { name: /descargas/i }).click()
    await page.waitForTimeout(500)
    
    // Panel should be hidden (removed from DOM)
    await expect(page.getByTestId('download-panel')).not.toBeVisible()
  })
})
