import type { Page } from '@playwright/test'

export const TEST_TOKEN = 'test-token'

/**
 * Inject the auth token into localStorage before page navigation so the app
 * boots directly into the authenticated state, bypassing the Login screen.
 * Must be called before page.goto().
 */
export async function loginAs(page: Page, token = TEST_TOKEN) {
  await page.addInitScript((t: string) => {
    localStorage.setItem('blog_token', t)
  }, token)
}
