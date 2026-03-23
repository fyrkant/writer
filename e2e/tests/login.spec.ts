import { test, expect } from '@playwright/test'
import { setupApiRoutes } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Login', () => {
  test('shows login screen when no token in localStorage', async ({ page }) => {
    await setupApiRoutes(page)
    await page.goto('/')
    await expect(page.locator('#login-screen')).toBeVisible()
    await expect(page.locator('.login-box h1')).toContainText('blog')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('successful login shows the editor UI', async ({ page }) => {
    await setupApiRoutes(page)
    await page.goto('/')
    await page.locator('input[type="password"]').fill('test-token')
    await page.locator('button.btn-primary').click()
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('#login-screen')).not.toBeVisible()
  })

  test('successful login stores token in localStorage', async ({ page }) => {
    await setupApiRoutes(page)
    await page.goto('/')
    await page.locator('input[type="password"]').fill('test-token')
    await page.locator('button.btn-primary').click()
    await expect(page.locator('#app')).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('blog_token'))
    expect(stored).toBe('test-token')
  })

  test('wrong password shows error message', async ({ page }) => {
    await setupApiRoutes(page, { authStatus: 401 })
    await page.goto('/')
    await page.locator('input[type="password"]').fill('wrong')
    await page.locator('button.btn-primary').click()
    await expect(page.locator('text=Wrong password.')).toBeVisible()
    await expect(page.locator('#login-screen')).toBeVisible()
  })

  test('Enter key submits the login form', async ({ page }) => {
    await setupApiRoutes(page)
    await page.goto('/')
    await page.locator('input[type="password"]').fill('test-token')
    await page.locator('input[type="password"]').press('Enter')
    await expect(page.locator('#app')).toBeVisible()
  })

  test('login button is disabled while request is in flight', async ({ page }) => {
    // Delay auth response to observe the loading state
    await page.route('/api/auth', async route => {
      await new Promise(resolve => setTimeout(resolve, 200))
      await route.fulfill({ status: 200, json: { ok: true } })
    })
    await setupApiRoutes(page)
    await page.goto('/')
    await page.locator('input[type="password"]').fill('test-token')
    await page.locator('button.btn-primary').click()
    await expect(page.locator('button.btn-primary')).toBeDisabled()
    await expect(page.locator('button.btn-primary')).toHaveText('Checking...')
  })

  test('already authenticated user skips login screen on load', async ({ page }) => {
    await setupApiRoutes(page)
    await loginAs(page)
    await page.goto('/')
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('#login-screen')).not.toBeVisible()
  })
})
