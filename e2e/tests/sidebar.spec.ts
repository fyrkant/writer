import { test, expect } from '@playwright/test'
import { setupApiRoutes, makePost } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('shows "no posts yet" when list is empty', async ({ page }) => {
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
    await expect(page.locator('.posts-list')).toContainText('no posts yet')
  })

  test('shows post count as "0 posts"', async ({ page }) => {
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
    await expect(page.locator('.sidebar-header span').first()).toHaveText('0 posts')
  })

  test('shows singular "1 post" for one post', async ({ page }) => {
    await setupApiRoutes(page, { posts: [makePost()] })
    await page.goto('/')
    await expect(page.locator('.sidebar-header span').first()).toHaveText('1 post')
  })

  test('shows multiple posts count', async ({ page }) => {
    const posts = [makePost(), makePost(), makePost()]
    await setupApiRoutes(page, { posts })
    await page.goto('/')
    await expect(page.locator('.sidebar-header span').first()).toHaveText('3 posts')
  })

  test('renders post titles in the list', async ({ page }) => {
    const posts = [
      makePost({ title: 'First Article' }),
      makePost({ title: 'Second Article' }),
    ]
    await setupApiRoutes(page, { posts })
    await page.goto('/')
    await expect(page.locator('.post-item-title').nth(0)).toHaveText('First Article')
    await expect(page.locator('.post-item-title').nth(1)).toHaveText('Second Article')
  })

  test('renders post date in the list', async ({ page }) => {
    await setupApiRoutes(page, { posts: [makePost({ date: '2026-03-01' })] })
    await page.goto('/')
    await expect(page.locator('.post-item-meta span').first()).toHaveText('2026-03-01')
  })

  test('renders up to 2 tag pills per post', async ({ page }) => {
    await setupApiRoutes(page, {
      posts: [makePost({ tags: ['alpha', 'beta', 'gamma'] })],
    })
    await page.goto('/')
    const pills = page.locator('.tag-pill')
    await expect(pills).toHaveCount(2)
    await expect(pills.nth(0)).toHaveText('alpha')
    await expect(pills.nth(1)).toHaveText('beta')
  })

  test('shows "Untitled" for posts with empty title', async ({ page }) => {
    await setupApiRoutes(page, { posts: [makePost({ title: '' })] })
    await page.goto('/')
    await expect(page.locator('.post-item-title')).toHaveText('Untitled')
  })

  test('clicking a post item selects it and marks it active', async ({ page }) => {
    const posts = [makePost({ title: 'Post A' }), makePost({ title: 'Post B' })]
    await setupApiRoutes(page, { posts })
    await page.goto('/')
    await page.locator('.post-item').nth(1).click()
    await expect(page.locator('.post-item').nth(1)).toHaveClass(/active/)
    await expect(page.locator('.post-item').nth(0)).not.toHaveClass(/active/)
  })

  test('clicking "+ New" opens new post editor', async ({ page }) => {
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
    await page.locator('button:has-text("+ New")').click()
    await expect(page.locator('.editor-pane')).toBeVisible()
    await expect(page.locator('input.title-input')).toBeVisible()
  })

  test('loading spinner is shown while fetching posts', async ({ page }) => {
    await page.route('/api/posts', async route => {
      await new Promise(resolve => setTimeout(resolve, 300))
      await route.fulfill({ status: 200, json: [] })
    })
    await setupApiRoutes(page)
    await page.goto('/')
    await expect(page.locator('.spinner')).toBeVisible()
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 2000 })
  })
})
