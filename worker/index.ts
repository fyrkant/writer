import { Hono, type Context } from "hono";

interface Post {
  id: string;
  title: string;
  date: string;
  tags: string[];
  layout: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

const app = new Hono<{ Bindings: Env }>();

// Auth middleware for write operations
const requireAuth = async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  if (token !== c.env.AUTH_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

// Trigger Netlify build hook
async function triggerBuild(env: Env) {
  if (env.NETLIFY_BUILD_HOOK) {
    try {
      await fetch(env.NETLIFY_BUILD_HOOK, { method: 'POST' });
    } catch {
      // Ignore build hook errors
    }
  }
}

// Generate unique ID
function generateId(): string {
  return crypto.randomUUID();
}

// Get all posts
app.get("/api/posts", async (c) => {
  const list = await c.env.POSTS.list();
  const posts: Post[] = [];

  for (const key of list.keys) {
    const data = await c.env.POSTS.get(key.name);
    if (data) {
      posts.push(JSON.parse(data));
    }
  }

  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));

  return c.json(posts);
});

// Get single post
app.get("/api/posts/:id", async (c) => {
  const id = c.req.param('id');
  const data = await c.env.POSTS.get(`post:${id}`);

  if (!data) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(JSON.parse(data));
});

// Create post (auth required)
app.post("/api/posts", requireAuth, async (c) => {
  const input = await c.req.json<PostInput>();
  const now = new Date().toISOString();
  const id = generateId();

  const post: Post = {
    id,
    title: input.title,
    date: input.date,
    tags: input.tags,
    layout: input.layout,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };

  await c.env.POSTS.put(`post:${id}`, JSON.stringify(post));

  return c.json(post, 201);
});

// Update post (auth required)
app.put("/api/posts/:id", requireAuth, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.POSTS.get(`post:${id}`);

  if (!existing) {
    return c.json({ error: 'Not found' }, 404);
  }

  const old = JSON.parse(existing) as Post;
  const input = await c.req.json<PostInput>();

  const post: Post = {
    id: id || '',
    title: input.title,
    date: input.date,
    tags: input.tags,
    layout: input.layout,
    body: input.body,
    createdAt: old.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await c.env.POSTS.put(`post:${id}`, JSON.stringify(post));

  return c.json(post);
});

// Delete post (auth required)
app.delete("/api/posts/:id", requireAuth, async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.POSTS.get(`post:${id}`);

  if (!existing) {
    return c.json({ error: 'Not found' }, 404);
  }

  await c.env.POSTS.delete(`post:${id}`);

  return c.json({ ok: true });
});

// Trigger build manually (auth required)
app.post("/api/build", requireAuth, async (c) => {
  await triggerBuild(c.env);
  return c.json({ ok: true });
});

export default app;
