import { test, expect } from '@playwright/test'
import { setupApiRoutes } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Build trigger', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
  })

  test('build button is visible in the topbar', async ({ page }) => {
    await expect(page.locator('.topbar button:has-text("build")')).toBeVisible()
  })

  test('build status initially shows "idle"', async ({ page }) => {
    await expect(page.locator('.topbar .status span').last()).toHaveText('idle')
  })

  test('clicking build sends POST /api/build', async ({ page }) => {
    let buildRequested = false
    await page.route('/api/build', route => {
      buildRequested = true
      return route.fulfill({ status: 200, json: { ok: true } })
    })
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('.topbar .status span').last()).toHaveText('build triggered')
    expect(buildRequested).toBe(true)
  })

  test('build status shows "build triggered" after success', async ({ page }) => {
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('.topbar .status span').last()).toHaveText('build triggered')
  })

  test('build button is disabled while building', async ({ page }) => {
    await page.unroute('/api/build')
    await page.route('/api/build', async route => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return route.fulfill({ status: 200, json: { ok: true } })
    })
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('.topbar button:has-text("build")')).toBeDisabled()
  })

  test('build status shows "building…" while in flight', async ({ page }) => {
    await page.unroute('/api/build')
    await page.route('/api/build', async route => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return route.fulfill({ status: 200, json: { ok: true } })
    })
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('.topbar .status span').last()).toHaveText('building…')
  })

  test('successful build shows "Build triggered" success toast', async ({ page }) => {
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/success/)
    await expect(page.locator('#toast')).toContainText('Build triggered')
  })

  test('failed build resets status to "idle" and shows error toast', async ({ page }) => {
    await setupApiRoutes(page, { posts: [], buildStatus: 'error' })
    await page.goto('/')
    await page.locator('.topbar button:has-text("build")').click()
    await expect(page.locator('.topbar .status span').last()).toHaveText('idle')
    await expect(page.locator('#toast')).toHaveClass(/show/)
    await expect(page.locator('#toast')).toHaveClass(/error/)
    await expect(page.locator('#toast')).toContainText('Build trigger failed')
  })
})
