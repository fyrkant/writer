import { test, expect } from '@playwright/test'
import { setupApiRoutes, makePost } from '../fixtures/api'
import { loginAs } from '../fixtures/auth'

test.describe('Editor — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
  })

  test('shows placeholder when no post is selected', async ({ page }) => {
    await expect(page.locator('.editor-pane .empty-state')).toContainText('select a post or create a new one')
  })
})

test.describe('Editor — new post', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [] })
    await page.goto('/')
    await page.locator('button:has-text("+ New")').click()
  })

  test('title input is visible and auto-focused', async ({ page }) => {
    const titleInput = page.locator('input.title-input')
    await expect(titleInput).toBeVisible()
    await expect(titleInput).toBeFocused()
  })

  test('date defaults to today for new posts', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0]
    await expect(page.locator('input[type="date"]')).toHaveValue(today)
  })

  test('layout dropdown defaults to "post"', async ({ page }) => {
    await expect(page.locator('select')).toHaveValue('post')
  })

  test('layout dropdown has all three options', async ({ page }) => {
    const select = page.locator('select')
    await expect(select.locator('option[value="post"]')).toHaveCount(1)
    await expect(select.locator('option[value="page"]')).toHaveCount(1)
    await expect(select.locator('option[value="note"]')).toHaveCount(1)
  })

  test('save status shows "unsaved changes" initially for new post', async ({ page }) => {
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('unsaved changes')
  })

  test('delete button is not shown for unsaved new post', async ({ page }) => {
    await expect(page.locator('button.btn-danger')).not.toBeVisible()
  })

  test('typing in any field triggers dirty status', async ({ page }) => {
    await page.locator('input.title-input').fill('My Title')
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('unsaved changes')
  })

  test('saving new post sends POST and updates sidebar', async ({ page }) => {
    const created = makePost({ title: 'Brand New Post' })
    await page.unroute('/api/posts')
    await page.route('/api/posts', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: created })
      }
      return route.fulfill({ status: 200, json: [] })
    })
    await page.locator('input.title-input').fill('Brand New Post')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saved')
    await expect(page.locator('.post-item-title')).toHaveText('Brand New Post')
  })

  test('save error sets error status', async ({ page }) => {
    await page.unroute('/api/posts')
    await page.route('/api/posts', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, json: { error: 'fail' } })
      }
      return route.fulfill({ status: 200, json: [] })
    })
    await page.locator('input.title-input').fill('Failing Post')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('error saving')
  })
})

test.describe('Editor — existing post', () => {
  const post = makePost({
    id: 'existing-1',
    title: 'Existing Post',
    date: '2026-02-10',
    layout: 'page',
    tags: ['foo', 'bar'],
    body: 'Hello world',
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await setupApiRoutes(page, { posts: [post] })
    await page.goto('/')
    await page.locator('.post-item').click()
  })

  test('populates title field', async ({ page }) => {
    await expect(page.locator('input.title-input')).toHaveValue('Existing Post')
  })

  test('populates date field', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toHaveValue('2026-02-10')
  })

  test('populates layout dropdown', async ({ page }) => {
    await expect(page.locator('select')).toHaveValue('page')
  })

  test('populates tags as comma-separated string', async ({ page }) => {
    await expect(page.locator('input[placeholder*="comma separated"]')).toHaveValue('foo, bar')
  })

  test('populates body textarea', async ({ page }) => {
    await expect(page.locator('textarea.markdown-editor')).toHaveValue('Hello world')
  })

  test('save status shows "saved" for existing post', async ({ page }) => {
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saved')
  })

  test('delete button is visible for existing post', async ({ page }) => {
    await expect(page.locator('button.btn-danger')).toBeVisible()
  })

  test('editing a field changes status to "unsaved changes"', async ({ page }) => {
    await page.locator('textarea.markdown-editor').fill('Updated body')
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('unsaved changes')
  })

  test('Ctrl+S saves the post', async ({ page }) => {
    const updated = { ...post, title: 'Updated via shortcut' }
    await page.unroute(/\/api\/posts\/[^/]+$/)
    await page.route(/\/api\/posts\/[^/]+$/, route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 200, json: updated })
      }
      return route.continue()
    })
    await page.locator('textarea.markdown-editor').fill('Updated content')
    await page.keyboard.press('Control+s')
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saved')
  })

  test('save button transitions through saving → saved', async ({ page }) => {
    await page.unroute(/\/api\/posts\/[^/]+$/)
    await page.route(/\/api\/posts\/[^/]+$/, async route => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 100))
        return route.fulfill({ status: 200, json: post })
      }
      return route.continue()
    })
    await page.locator('textarea.markdown-editor').fill('Updated')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saving…')
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('saved')
  })

  test('save button is disabled while saving', async ({ page }) => {
    await page.unroute(/\/api\/posts\/[^/]+$/)
    await page.route(/\/api\/posts\/[^/]+$/, async route => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 200))
        return route.fulfill({ status: 200, json: post })
      }
      return route.continue()
    })
    await page.locator('textarea.markdown-editor').fill('Updated')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('button:has-text("Save")')).toBeDisabled()
  })

  test('update error sets error saving status', async ({ page }) => {
    await setupApiRoutes(page, { posts: [post], updatePost: 'error' })
    await page.goto('/')
    await page.locator('.post-item').click()
    await page.locator('textarea.markdown-editor').fill('Cause error')
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator('.editor-footer .status span').last()).toHaveText('error saving')
  })
})
