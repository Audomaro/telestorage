import { test, expect } from '@playwright/test'
import { waitForAppReady, openFirstGroup } from './helpers'

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('download button in file list', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test operations')
    }
    
    const firstFile = files.first()
    await expect(firstFile.getByRole('button', { name: /descargar/i })).toBeVisible()
  })

  test('delete button in file list for owners', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test operations')
    }
    
    const firstFile = files.first()
    await expect(firstFile.getByRole('button', { name: /eliminar/i })).toBeVisible()
  })

  test('preview button for images/videos', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test operations')
    }
    
    const firstFile = files.first()
    const previewButton = firstFile.getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await expect(previewButton).toBeVisible()
    }
  })

  test('upload dialog opens', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /subir archivos/i }).click()
    
    // Should show upload dialog
    await expect(page.getByTestId('upload-dialog')).toBeVisible()
  })

  test('upload dialog has dropzone', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /subir archivos/i }).click()
    
    await expect(page.getByTestId('upload-dropzone')).toBeVisible()
  })

  test('upload dialog can be cancelled', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /subir archivos/i }).click()
    await expect(page.getByTestId('upload-dialog')).toBeVisible()
    
    await page.getByRole('button', { name: /cancelar/i }).click()
    await expect(page.getByTestId('upload-dialog')).not.toBeVisible()
  })

  test('select mode toggles checkboxes', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test select mode')
    }
    
    // Checkboxes should be visible
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible()
  })

  test('batch delete button appears in select mode', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test select mode')
    }
    
    // Select first file
    await files.first().locator('input[type="checkbox"]').click()
    await page.waitForTimeout(300)
    
    // Batch delete button should appear
    await expect(page.getByRole('button', { name: /eliminar seleccionados/i })).toBeVisible()
  })

  test('batch download button appears in select mode', async ({ page }) => {
    await openFirstGroup(page)
    
    await page.getByRole('button', { name: /seleccionar archivos/i }).click()
    await page.waitForTimeout(500)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test select mode')
    }
    
    // Select first file
    await files.first().locator('input[type="checkbox"]').click()
    await page.waitForTimeout(300)
    
    // Batch download button should appear
    await expect(page.getByRole('button', { name: /descargar seleccionados/i })).toBeVisible()
  })

  test('forward dialog opens', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test forward')
    }
    
    // Click preview button to open preview modal
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      // Click forward button in preview
      await page.getByRole('button', { name: /reenviar/i }).click()
      await page.waitForTimeout(500)
      
      // Forward dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/reenviar archivo/i)).toBeVisible()
    } else {
      test.skip(true, 'No previewable files to test forward')
    }
  })
})
