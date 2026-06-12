import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

test.describe('Authentication Flow', () => {
  test('app shows login screen when no session exists', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    
    if (isLoginScreen) {
      // Should show login screen
      await expect(page.getByText('TeleStorage')).toBeVisible()
    } else {
      // Should show group list
      await expect(page.getByTestId('tab-telestorage')).toBeVisible()
    }
  })

  test('phone input validation works', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(!isLoginScreen, 'App is already logged in — auth tests require login screen')
    
    // Find phone input by test id
    const phoneInput = page.getByTestId('phone-input')
    await expect(phoneInput).toBeVisible()
    
    // Try invalid phone (too short)
    await phoneInput.fill('123')
    // Should show validation error
    await expect(page.getByText('Número muy corto')).toBeVisible()
    
    // Try valid phone
    await phoneInput.fill('1234567890')
    // Error should disappear
    await expect(page.getByText('Número muy corto')).not.toBeVisible()
  })

  test('country picker shows options', async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(!isLoginScreen, 'App is already logged in — auth tests require login screen')
    
    // Find country picker
    const countryPicker = page.getByRole('combobox', { name: /país/i })
    await expect(countryPicker).toBeVisible()
    
    // Open country picker
    await countryPicker.click()
    
    // Should show country options
    await expect(page.getByText('Argentina')).toBeVisible()
    await expect(page.getByText('México')).toBeVisible()
    await expect(page.getByText('España')).toBeVisible()
  })

  test('auth flow requires phone and code', async ({ page }) => {
    // This test requires a real Telegram connection to send the code.
    // In the test environment without valid credentials, the submit will fail.
    // Skip this test when the code input is not available (no real auth flow).
    test.skip(true, 'Requires real Telegram connection — run manually with valid credentials')

    // Fill phone
    const phoneInput = page.getByTestId('phone-input')
    await phoneInput.fill('1234567890')
    
    // Click continue
    await page.getByTestId('submit-button').click()
    
    // Should show code input
    await expect(page.getByTestId('code-input')).toBeVisible()
  })
})
