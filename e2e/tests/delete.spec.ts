import { test, expect } from '@playwright/test'
import { setupApiRoutes, makePost } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

const post = makePost({ id: 'del-1', title: 'Post to Delete' })

test.describe('Delete post', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [post] })
    await page.goto('/')
    await page.locator('.post-item').click()
  })

  test('delete button is visible for an existing post', async ({ page }) => {
    await expect(page.locator('button.btn-danger')).toBeVisible()
    await expect(page.locator('button.btn-danger')).toHaveText('Delete')
  })

  test('delete button is not visible when no post is selected', async ({ page }) => {
    // Navigate away — click new post button to clear selection
    await page.locator('button:has-text("+ New")').click()
    await expect(page.locator('button.btn-danger')).not.toBeVisible()
  })

  test('clicking delete shows a confirmation dialog', async ({ page }) => {
    let dialogMessage = ''
    page.once('dialog', dialog => {
      dialogMessage = dialog.message()
      dialog.dismiss()
    })
    await page.locator('button.btn-danger').click()
    expect(dialogMessage).toContain('Post to Delete')
  })

  test('cancelling the confirmation dialog does not delete', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss())
    await page.locator('button.btn-danger').click()
    // Post still visible in sidebar
    await expect(page.locator('.post-item')).toHaveCount(1)
    await expect(page.locator('.post-item-title')).toHaveText('Post to Delete')
  })

  test('confirming delete removes post from sidebar', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('.post-item')).toHaveCount(0)
    await expect(page.locator('.posts-list')).toContainText('no posts yet')
  })

  test('confirming delete clears the editor', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('.empty-state')).toContainText('select a post or create a new one')
  })

  test('successful delete shows "Deleted" success toast', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/success/)
    await expect(page.locator('#toast')).toContainText('Deleted')
  })

  test('failed delete shows error toast', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], deleteStatus: 'error' })
    await page.goto('/')
    await page.locator('.post-item').click()
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/error/)
  })
})
