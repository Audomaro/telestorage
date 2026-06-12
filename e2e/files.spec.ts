import { test, expect } from '@playwright/test'
import { waitForAppReady, openFirstGroup } from './helpers'

test.describe('Group Files', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('shows file list by default', async ({ page }) => {
    await openFirstGroup(page)
    
    // Should show file list or empty state
    const files = page.getByTestId('file-list-item')
    const emptyState = page.getByText(/sin archivos/i)
    await expect(files.or(emptyState).first()).toBeVisible()
  })

  test('shows toolbar with search and view mode', async ({ page }) => {
    await openFirstGroup(page)
    
    await expect(page.getByTestId('file-search-input')).toBeVisible()
    await expect(page.getByRole('button', { name: /vista de lista/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /vista de galería/i })).toBeVisible()
  })

  test('shows filter buttons in list mode', async ({ page }) => {
    await openFirstGroup(page)
    
    await expect(page.getByRole('button', { name: /filtrar todos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /filtrar multimedia/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /filtrar documentos/i })).toBeVisible()
  })

  test('switch to gallery view', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /vista de galería/i }).click()
    await page.waitForTimeout(500)
    
    // Should show gallery grid or empty state
    const gridItems = page.getByTestId('file-grid-item')
    const emptyState = page.getByText(/sin archivos multimedia/i)
    await expect(gridItems.or(emptyState).first()).toBeVisible()
  })

  test('file search input works', async ({ page }) => {
    await openFirstGroup(page)
    
    const searchInput = page.getByTestId('file-search-input')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Should show results or empty state
    const files = page.getByTestId('file-list-item')
    const emptyState = page.getByText(/sin archivos/i)
    await expect(files.or(emptyState).first()).toBeVisible()
  })

  test('upload button visible for owners', async ({ page }) => {
    await openFirstGroup(page)
    
    // Upload button should be visible
    await expect(page.getByRole('button', { name: /subir archivos/i })).toBeVisible()
  })

  test('select mode button is visible', async ({ page }) => {
    await openFirstGroup(page)
    
    await expect(page.getByRole('button', { name: /seleccionar archivos/i })).toBeVisible()
  })

  test('shows empty state when no files', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    const emptyState = page.getByText(/sin archivos/i)
    if (await files.count() === 0) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('back button navigates to group list', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /volver/i }).click()
    await page.waitForTimeout(500)
    
    // Should be back on group list
    await expect(page.getByTestId('tab-telestorage')).toBeVisible()
  })
})
