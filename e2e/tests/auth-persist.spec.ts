import { test, expect } from '@playwright/test'
import { setupApiRoutes } from '../fixtures/api'
import { loginAs, TEST_TOKEN } from '../fixtures/auth'

test.describe('Auth persistence and logout', () => {
  test('token in localStorage causes app to load authenticated', async ({ page }) => {
    await setupApiRoutes(page)
    await loginAs(page)
    await page.goto('/')
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('#login-screen')).not.toBeVisible()
  })

  test('app remains authenticated after page reload', async ({ page }) => {
    await setupApiRoutes(page)
    await loginAs(page)
    await page.goto('/')
    await expect(page.locator('#app')).toBeVisible()
    await page.reload()
    await expect(page.locator('#app')).toBeVisible()
  })

  test('logout button clears token from localStorage', async ({ page }) => {
    await setupApiRoutes(page)
    await loginAs(page)
    await page.goto('/')
    await expect(page.locator('#app')).toBeVisible()
    await page.locator('button.btn-ghost:has-text("logout")').click()
    const stored = await page.evaluate(() => localStorage.getItem('blog_token'))
    expect(stored).toBeNull()
  })

  test('logout returns to login screen', async ({ page }) => {
    await setupApiRoutes(page)
    await loginAs(page)
    await page.goto('/')
    await page.locator('button.btn-ghost:has-text("logout")').click()
    await expect(page.locator('#login-screen')).toBeVisible()
    await expect(page.locator('#app')).not.toBeVisible()
  })

  test('logout clears posts from state', async ({ page }) => {
    const { makePost } = await import('../fixtures/api')
    await setupApiRoutes(page, { posts: [makePost({ title: 'Secret Post' })] })
    await loginAs(page)
    await page.goto('/')
    await expect(page.locator('.post-item')).toHaveCount(1)
    await page.locator('button.btn-ghost:has-text("logout")').click()
    // After logging back in, the login screen should be clean
    await expect(page.locator('#login-screen')).toBeVisible()
  })

  test('401 response from API clears token and shows login screen', async ({ page }) => {
    // First load with a valid token, then simulate a 401 on posts fetch
    await page.addInitScript((t: string) => {
      localStorage.setItem('blog_token', t)
    }, TEST_TOKEN)
    await page.route('/api/auth', route => route.fulfill({ status: 200, json: { ok: true } }))
    await page.route('/api/posts', route => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }))
    await page.goto('/')
    await expect(page.locator('#login-screen')).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('blog_token'))
    expect(stored).toBeNull()
  })
})
