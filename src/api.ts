export async function apiFetch<T>(path: string, token: string | null, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json() as Promise<T>
}
