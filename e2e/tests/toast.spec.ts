import { test, expect } from '@playwright/test'
import { setupApiRoutes, makePost } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Toast notifications', () => {
  const post = makePost({ id: 'toast-1', title: 'Toast Post' })

  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('shows success toast with "Saved" after creating a post', async ({ page }) => {
    const created = makePost({ title: 'New Post' })
    await setupApiRoutes(page, { posts: [], createPost: created })
    await page.goto('/')
    await page.locator('button:has-text("+ New")').click()
    await page.locator('input.title-input').fill('New Post')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/success/)
    await expect(page.locator('#toast')).toContainText('Saved')
  })

  test('shows success toast with "Saved" after updating a post', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], updatePost: post })
    await page.goto('/')
    await page.locator('.post-item').click()
    await page.locator('textarea.markdown-editor').fill('Updated')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/success/)
    await expect(page.locator('#toast')).toContainText('Saved')
  })

  test('shows error toast when save fails', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], updatePost: 'error' })
    await page.goto('/')
    await page.locator('.post-item').click()
    await page.locator('textarea.markdown-editor').fill('Cause error')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/error/)
    await expect(page.locator('#toast')).toContainText('Save failed')
  })

  test('shows success toast with "Deleted" after deleting a post', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post] })
    await page.goto('/')
    await page.locator('.post-item').click()
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/success/)
    await expect(page.locator('#toast')).toContainText('Deleted')
  })

  test('shows error toast when delete fails', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], deleteStatus: 'error' })
    await page.goto('/')
    await page.locator('.post-item').click()
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button.btn-danger').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/error/)
    await expect(page.locator('#toast')).toContainText('Delete failed')
  })

  test('toast auto-hides after ~3 seconds', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], updatePost: post })
    await page.goto('/')
    await page.locator('.post-item').click()
    await page.locator('textarea.markdown-editor').fill('Updated')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).not.toHaveClass(/show/, { timeout: 5000 })
  })

  test('shows error toast when build fails', async ({ page }) => {
    await setupApiRoutes(page, { posts: [], buildStatus: 'error' })
    await page.goto('/')
    await page.locator('button:has-text("build")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/error/)
    await expect(page.locator('#toast')).toContainText('Build trigger failed')
  })
})
