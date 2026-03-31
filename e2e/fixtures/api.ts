import type { Page } from '@playwright/test'

export interface Post {
  id: string
  title: string
  date: string
  tags: string[]
  layout: string
  body: string
  createdAt: string
  updatedAt: string
}

let seq = 0

export function makePost(overrides: Partial<Post> = {}): Post {
  seq++
  return {
    id: `test-id-${seq}`,
    title: `Test Post ${seq}`,
    date: '2026-01-15',
    tags: [],
    layout: 'post',
    body: `Body of post ${seq}`,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

export interface ApiOptions {
  posts?: Post[]
  authStatus?: 200 | 401
  createPost?: Post | 'error'
  updatePost?: Post | 'error'
  deleteStatus?: 'ok' | 'error'
  buildStatus?: 'ok' | 'error'
}

export async function setupApiRoutes(page: Page, opts: ApiOptions = {}) {
  const posts = opts.posts ?? []

  await page.route('/api/auth', route => {
    if ((opts.authStatus ?? 200) === 401) {
      return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    }
    return route.fulfill({ status: 200, json: { ok: true } })
  })

  await page.route('/api/posts', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, json: posts })
    }
    if (opts.createPost === 'error') {
      return route.fulfill({ status: 500, json: { error: 'Server error' } })
    }
    const created = opts.createPost ?? makePost({ title: 'New Post' })
    return route.fulfill({ status: 201, json: created })
  })

  await page.route(/\/api\/posts\/[^/]+$/, route => {
    const method = route.request().method()
    const id = route.request().url().split('/').pop()
    if (method === 'GET') {
      const post = posts.find(p => p.id === id)
      if (!post) return route.fulfill({ status: 404, json: { error: 'Not found' } })
      return route.fulfill({ status: 200, json: post })
    }
    if (method === 'PUT') {
      if (opts.updatePost === 'error') {
        return route.fulfill({ status: 500, json: { error: 'Server error' } })
      }
      const updated = opts.updatePost ?? posts.find(p => p.id === id) ?? posts[0]
      return route.fulfill({ status: 200, json: updated })
    }
    if (method === 'DELETE') {
      if (opts.deleteStatus === 'error') {
        return route.fulfill({ status: 500, json: { error: 'Server error' } })
      }
      return route.fulfill({ status: 200, json: { ok: true } })
    }
    return route.continue()
  })

  await page.route('/api/build', route => {
    if (opts.buildStatus === 'error') {
      return route.fulfill({ status: 500, json: { error: 'Build failed' } })
    }
    return route.fulfill({ status: 200, json: { ok: true } })
  })
}
