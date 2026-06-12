import { test, expect } from './electron-setup'

// This test sets up a mock session for subsequent tests
// Run it first to create a persistent session, then run the full suite

test('setup: login with real credentials', async ({ page }) => {
  // Wait for login screen
  const phoneInput = page.getByTestId('phone-input')
  await expect(phoneInput).toBeVisible()
  
  // Fill phone number (with country code)
  await phoneInput.fill('1234567890') // Replace with your test phone
  
  // Click submit
  await page.getByTestId('submit-button').click()
  
  // Wait for code input
  await expect(page.getByTestId('code-input')).toBeVisible()
  
  // Enter the code (you'll need to check your Telegram app for the real code)
  await page.getByTestId('code-input').fill('12345') // Replace with real code
  
  // Click verify
  await page.getByTestId('submit-button').click()
  
  // Wait for group list to appear (means login succeeded)
  await expect(page.getByRole('tab', { name: /telestorage/i })).toBeVisible({ timeout: 10000 })
  
  // Take screenshot of successful login
  await page.screenshot({ path: 'test-results/login-success.png' })
})
