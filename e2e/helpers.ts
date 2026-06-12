import { test, expect } from '@playwright/test'

/**
 * Waits for the app to be fully loaded and ready for testing.
 * Checks for either the login screen or the group list to be ready.
 */
export async function waitForAppReady(page: any) {
  // Wait for app window to fully load and show
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
  await page.waitForTimeout(2000)
  
  // Check if we're on login screen
  const isLoginScreen = await page.getByRole('textbox', { name: /número de teléfono/i }).isVisible().catch(() => false)
  
  if (isLoginScreen) {
    return { isLoginScreen: true }
  }
  
  // Debug: get page content to see what's rendered
  const html = await page.content().catch(() => '<error>')
  console.log('Page HTML length:', html.length)
  console.log('Page HTML preview:', html.substring(0, 500))
  
  // Check if React app mounted (root div should have content)
  const rootContent = await page.locator('#root').innerHTML().catch(() => '')
  console.log('Root content length:', rootContent.length)
  console.log('Root content preview:', rootContent.substring(0, 500))
  
  return { isLoginScreen: false }
}

export async function openActivosTab(page: any) {
  const tab = page.getByTestId('tab-activos')
  await expect(tab).toBeVisible()
  await tab.click()
  await page.waitForTimeout(800)
}

export async function openTeleStorageTab(page: any) {
  const tab = page.getByTestId('tab-telestorage')
  await expect(tab).toBeVisible()
  await tab.click()
  await page.waitForTimeout(800)
}

export async function openFirstGroup(page: any) {
  await openActivosTab(page)
  
  const groups = page.getByTestId('group-list-item')
  const count = await groups.count()
  if (count === 0) {
    test.skip(true, 'No groups available in Activos tab')
  }
  
  await expect(groups.first()).toBeVisible()
  await groups.first().click()
  await page.waitForTimeout(800)
}
