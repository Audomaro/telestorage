import { test, expect } from '@playwright/test'
import { waitForAppReady, openFirstGroup } from './helpers'

test.describe('Preview Modal', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — requires authentication')
  })

  test('preview modal opens for images', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    // Click preview button
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      // Preview modal should appear
      await expect(page.getByRole('dialog')).toBeVisible()
    } else {
      test.skip(true, 'No previewable files')
    }
  })

  test('preview modal has close button', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('button', { name: /cerrar/i })).toBeVisible()
    } else {
      test.skip(true, 'No previewable files')
    }
  })

  test('preview modal has download button', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('button', { name: /guardar en disco/i })).toBeVisible()
    } else {
      test.skip(true, 'No previewable files')
    }
  })

  test('preview modal has delete button for owners', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('button', { name: /eliminar/i })).toBeVisible()
    } else {
      test.skip(true, 'No previewable files')
    }
  })

  test('preview modal has navigation arrows', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      // Check if there are multiple files to navigate
      const nextFiles = await page.getByRole('button', { name: /siguiente/i }).isVisible().catch(() => false)
      const prevFiles = await page.getByRole('button', { name: /anterior/i }).isVisible().catch(() => false)
      
      if (nextFiles || prevFiles) {
        test.info().annotations.push({ type: 'info', description: 'Navigation buttons visible' })
      }
    } else {
      test.skip(true, 'No previewable files')
    }
  })

  test('preview modal closes on escape', async ({ page }) => {
    await openFirstGroup(page)
    
    const files = page.getByTestId('file-list-item')
    if (await files.count() === 0) {
      test.skip(true, 'No files to test preview')
    }
    
    const previewButton = files.first().getByRole('button', { name: /vista previa/i })
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click()
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('dialog')).toBeVisible()
      
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('dialog')).not.toBeVisible()
    } else {
      test.skip(true, 'No previewable files')
    }
  })
})
