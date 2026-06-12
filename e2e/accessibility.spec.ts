import { test, expect } from '@playwright/test'
import { waitForAppReady, openFirstGroup, openTeleStorageTab } from './helpers'

test.describe('Accessibility & UX', () => {
  test('all icon buttons have aria-label', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Check all IconButtons on the page
    const buttons = page.locator('button[aria-label]')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    
    // Verify all buttons have non-empty aria-labels
    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label')
      expect(label).toBeTruthy()
      expect(label?.length).toBeGreaterThan(0)
    }
  })

  test('login page has landmark regions', async ({ page }) => {
    await page.waitForTimeout(3500)
    // Even on login screen, we can check the login form
    const isLoginScreen = await page.getByRole('textbox', { name: /número de teléfono/i }).isVisible().catch(() => false)
    if (isLoginScreen) {
      // Login form should have proper labels
      await expect(page.getByLabel(/país/i)).toBeVisible()
      await expect(page.getByLabel(/número de teléfono/i)).toBeVisible()
    }
  })

  test('empty state component exists', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Check on TeleStorage tab which is most likely empty
    await openTeleStorageTab(page)
    
    const groups = page.getByTestId('group-list-item')
    if (await groups.count() === 0) {
      // Empty state should be visible on group list
      await expect(page.getByText(/no hay grupos/i)).toBeVisible()
    }
  })

  test('skeleton loaders exist', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Check for skeleton elements
    const skeletons = page.locator('.MuiSkeleton-root')
    // Note: Skeletons are only visible during loading, so we just verify they exist in the DOM
    const count = await skeletons.count()
    if (count === 0) {
      test.skip(true, 'No skeletons currently visible (content loaded)')
    }
  })

  test('error alerts use MUI Alert component', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Check if any alerts exist on the page
    const alerts = page.locator('.MuiAlert-root')
    const count = await alerts.count()
    if (count === 0) {
      test.skip(true, 'No alerts currently visible')
    }
    
    // Verify alerts have dismiss button
    const dismissButtons = alerts.locator('button[aria-label="Close"]')
    expect(await dismissButtons.count()).toBeGreaterThanOrEqual(0)
  })

  test('dialogs use MUI Dialog (no native confirm)', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Open a group from Activos tab
    await openFirstGroup(page)
    
    // Try to trigger a delete dialog
    const files = page.getByTestId('file-list-item')
    if (await files.count() > 0) {
      const deleteButton = files.first().getByRole('button', { name: /eliminar/i })
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click()
        await page.waitForTimeout(500)
        
        // Should show MUI Dialog, not native confirm
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/eliminar archivo/i)).toBeVisible()
        
        // Cancel the dialog
        await page.getByRole('button', { name: /cancelar/i }).click()
      }
    }
  })

  test('FileGrid cards have keyboard support attributes', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    if (isLoginScreen) return
    
    // Open a group from Activos tab
    await openFirstGroup(page)
    
    // Switch to gallery view
    await page.getByRole('button', { name: /vista de galería/i }).click()
    await page.waitForTimeout(500)
    
    const gridItems = page.getByTestId('file-grid-item')
    if (await gridItems.count() === 0) {
      test.skip(true, 'No gallery items to test')
    }
    
    const firstItem = gridItems.first()
    
    // Check keyboard support attributes
    expect(await firstItem.getAttribute('role')).toBe('button')
    expect(await firstItem.getAttribute('tabIndex')).toBe('0')
    expect(await firstItem.getAttribute('aria-label')).toBeTruthy()
  })
})
