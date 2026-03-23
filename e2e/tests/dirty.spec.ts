import { test, expect } from '@playwright/test'
import { setupApiRoutes, makePost } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Unsaved changes guard', () => {
  const postA = makePost({ id: 'dirty-a', title: 'Post A' })
  const postB = makePost({ id: 'dirty-b', title: 'Post B' })

  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [postA, postB] })
    await page.goto('/')
    // Select Post A
    await page.locator('.post-item').nth(0).click()
    // Make it dirty by editing the body
    await page.locator('textarea.markdown-editor').fill('Unsaved edit')
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('unsaved changes')
  })

  test('switching posts with unsaved changes shows a confirm dialog', async ({ page }) => {
    let dialogShown = false
    page.once('dialog', dialog => {
      dialogShown = true
      dialog.dismiss()
    })
    await page.locator('.post-item').nth(1).click()
    expect(dialogShown).toBe(true)
  })

  test('confirm dialog message mentions discarding changes', async ({ page }) => {
    let dialogMessage = ''
    page.once('dialog', dialog => {
      dialogMessage = dialog.message()
      dialog.dismiss()
    })
    await page.locator('.post-item').nth(1).click()
    expect(dialogMessage).toContain('Discard')
  })

  test('cancelling the dialog keeps the current post selected', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss())
    await page.locator('.post-item').nth(1).click()
    // Post A should still be active
    await expect(page.locator('.post-item').nth(0)).toHaveClass(/active/)
    await expect(page.locator('.post-item').nth(1)).not.toHaveClass(/active/)
  })

  test('cancelling the dialog preserves the dirty edits', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss())
    await page.locator('.post-item').nth(1).click()
    await expect(page.locator('textarea.markdown-editor')).toHaveValue('Unsaved edit')
  })

  test('confirming discard switches to the new post', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('.post-item').nth(1).click()
    await expect(page.locator('.post-item').nth(1)).toHaveClass(/active/)
    await expect(page.locator('input.title-input')).toHaveValue('Post B')
  })

  test('clicking "+ New" with unsaved changes shows confirm dialog', async ({ page }) => {
    let dialogShown = false
    page.once('dialog', dialog => {
      dialogShown = true
      dialog.dismiss()
    })
    await page.locator('button:has-text("+ New")').click()
    expect(dialogShown).toBe(true)
  })

  test('confirming from "+ New" opens a fresh new post editor', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept())
    await page.locator('button:has-text("+ New")').click()
    await expect(page.locator('input.title-input')).toHaveValue('')
  })

  test('no confirm dialog when switching posts without unsaved changes', async ({ page }) => {
    // Save first to clear dirty state
    await page.unroute(/\/api\/posts\/[^/]+$/)
    await page.route(/\/api\/posts\/[^/]+$/, route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, json: postA })
      }
      return route.continue()
    })
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saved')

    let dialogShown = false
    page.on('dialog', dialog => {
      dialogShown = true
      dialog.dismiss()
    })
    await page.locator('.post-item').nth(1).click()
    expect(dialogShown).toBe(false)
  })
})
