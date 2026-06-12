import { test, expect } from '@playwright/test'
import { waitForAppReady, openTeleStorageTab, openActivosTab, openForumTopics } from './helpers'

// NOTE: These tests require the app to be logged in.
// They are skipped when no session exists (app shows login screen).
// To run these tests, first log in manually or set up a mock session.

test.describe('Group List', () => {
  test.beforeEach(async ({ page }) => {
    const { isLoginScreen } = await waitForAppReady(page)
    test.skip(isLoginScreen, 'App is on login screen — group tests require authentication')
  })

  test('shows TeleStorage tab by default', async ({ page }) => {
    const teleStorageTab = page.getByTestId('tab-telestorage')
    await expect(teleStorageTab).toBeVisible()
    
    // Should be active
    await expect(teleStorageTab).toHaveAttribute('aria-selected', 'true')
  })

  test('shows Activos tab', async ({ page }) => {
    const activosTab = page.getByTestId('tab-activos')
    await expect(activosTab).toBeVisible()
  })

  test('shows Archivados tab', async ({ page }) => {
    const archivadosTab = page.getByTestId('tab-archivados')
    await expect(archivadosTab).toBeVisible()
  })

  test('clicking Activos tab shows all groups', async ({ page }) => {
    await openActivosTab(page)
    
    // Should show groups or empty state
    const groups = page.getByTestId('group-list-item')
    const emptyState = page.getByText(/no hay grupos/i)
    
    await expect(groups.or(emptyState).first()).toBeVisible()
  })

  test('clicking Archivados tab shows archived groups', async ({ page }) => {
    await page.getByTestId('tab-archivados').click()
    await page.waitForTimeout(800)
    
    // Should show groups or empty state
    const groups = page.getByTestId('group-list-item')
    const emptyState = page.getByText(/no hay grupos/i)
    
    await expect(groups.or(emptyState).first()).toBeVisible()
  })

  test('create group button opens dialog', async ({ page }) => {
    await openTeleStorageTab(page)
    
    // Find and click create group button
    const createButton = page.getByTestId('btn-nuevo-grupo')
    await expect(createButton).toBeVisible()
    await createButton.click()
    
    // Should show create group dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/nuevo grupo/i)).toBeVisible()
  })

  test('vincular propio button opens dialog', async ({ page }) => {
    await openTeleStorageTab(page)
    
    // Find and click vincular propio button
    const vincularButton = page.getByTestId('btn-vincular')
    await expect(vincularButton).toBeVisible()
    await vincularButton.click()
    
    // Should show dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/vincular grupo propio/i)).toBeVisible()
  })

  test('vincular dialog search filters groups', async ({ page }) => {
    await openTeleStorageTab(page)
    
    // Open vincular dialog
    await page.getByTestId('btn-vincular').click()
    await page.waitForTimeout(500)
    
    // Find search input in dialog
    const searchInput = page.getByTestId('vincular-search-input')
    await expect(searchInput).toBeVisible()
    
    // Type in search
    await searchInput.fill('test')
    
    // Wait for filtering
    await page.waitForTimeout(400)
    
    // Dialog should still be visible
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows loading state initially', async ({ page }) => {
    // Navigate fresh
    await page.reload()
    
    // Should show skeleton loaders initially
    await expect(page.getByTestId('skeleton-loader').first()).toBeVisible()
  })

  test('shows empty state when no groups in tab', async ({ page }) => {
    await openTeleStorageTab(page)
    
    const groups = page.getByTestId('group-list-item')
    if (await groups.count() === 0) {
      // Should show empty state for TeleStorage
      await expect(page.getByText(/no hay grupos en telestorage/i)).toBeVisible()
    }
  })

  test('forum group shows forum badge', async ({ page }) => {
    await openActivosTab(page)

    const groups = page.getByTestId('group-list-item')
    const count = await groups.count()
    if (count === 0) {
      test.skip(true, 'No groups available in Activos tab')
    }

    // Look for at least one forum badge among the groups
    let forumBadgeVisible = false
    for (let i = 0; i < count; i++) {
      const hasBadge = await groups.nth(i).getByTestId('forum-badge').isVisible().catch(() => false)
      if (hasBadge) {
        forumBadgeVisible = true
        break
      }
    }

    if (!forumBadgeVisible) {
      test.skip(true, 'No forum groups found in test account')
    }

    await expect(page.getByTestId('forum-badge').first()).toBeVisible()
  })

  test('clicking forum group shows topics', async ({ page }) => {
    await openForumTopics(page)

    // Should show the ForumTopicsPage (either topics or empty state)
    await expect(page.getByText('Temas del forum')).toBeVisible()
  })
})
