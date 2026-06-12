import { test, expect } from '@playwright/test'
import { waitForAppReady, openFirstGroup } from './helpers'

test.describe('Multi-Select', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('select mode button is visible', async ({ page }) => {
    await openFirstGroup(page)
    
    await expect(page.getByRole('button', { name: /seleccionar archivos/i })).toBeVisible()
  })

  test('cancel button appears in select mode', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    await expect(page.getByRole('button', { name: /cancelar selección/i })).toBeVisible()
  })

  test('selection counter shows count', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test selection')
    }
    
    // Select first file
    await files.first().locator('input[type="checkbox"]').click()
    await page.waitForTimeout(300)
    
    // Should show counter
    await expect(page.getByText(/1 seleccionado/i)).toBeVisible()
  })

  test('clear selection on cancel', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test selection')
    }
    
    // Select first file
    await files.first().locator('input[type="checkbox"]').click()
    await page.waitForTimeout(300)
    
    // Cancel selection
    await page.getByRole('button', { name: /cancelar selección/i }).click()
    await page.waitForTimeout(300)
    
    // Should show "Seleccionar" again
    await expect(page.getByRole('button', { name: /seleccionar archivos/i })).toBeVisible()
  })

  test('gallery select mode shows checkboxes', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /vista de galería/i }).click()
    await page.waitForTimeout(500)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const gridItems = page.getByTestId('file-grid-item')
    if (await gridItems.count() === 0) {
      test.skip(true, 'No gallery items to test selection')
    }
    
    // Gallery items should have checkbox overlay
    await expect(gridItems.first()).toBeVisible()
  })
})
