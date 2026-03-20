import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => {
  return c.json({ name: "Cloudflare" });
});

export default app;
