import { supabase } from './supabase'

// NEXT_PUBLIC_API_URL is REQUIRED. Without it, API calls silently hit
// /api/* (the Next.js routes folder), causing 404s that look like
// backend outages. Fail loudly at module load instead.
if (!process.env.NEXT_PUBLIC_API_URL) {
  // In dev this will surface immediately on first render.
  // In production, Vercel build will still complete, but any page that
  // imports this module will throw — which is the desired behavior.
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Configure it in your Vercel project ' +
    'environment (e.g. https://anubis-api.onrender.com).',
  )
}

export const API_BASE: string = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const base: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    base['Authorization'] = `Bearer ${session.access_token}`
  }
  return base
}

async function handleResponse<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    let details = ''
    try {
      const body = await res.json()
      const msg = body?.error || ''
      const det = body?.details || ''
      details = det ? `${msg}: ${det}` : msg || JSON.stringify(body)
    } catch {
      details = await res.text().catch(() => '')
    }
    throw new Error(`${label} ${res.status}: ${details || 'request failed'}`)
  }
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() })
  return handleResponse<T>(res, `GET ${path}`)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  })
  return handleResponse<T>(res, `POST ${path}`)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  })
  return handleResponse<T>(res, `PUT ${path}`)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  return handleResponse<T>(res, `DELETE ${path}`)
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse<T>(res, `POST ${path}`)
}
