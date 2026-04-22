/**
 * API client — single source of truth for backend URL and fetch semantics.
 *
 * Fixes P2-02 from the initial review (hardcoded localhost:5000 scattered
 * across every component). Every backend call in the app goes through one
 * of these helpers.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function handleResponse<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    let details = "";
    try {
      const body = await res.json();
      details = body?.error || body?.details || JSON.stringify(body);
    } catch {
      details = await res.text().catch(() => "");
    }
    throw new Error(`${label} ${res.status}: ${details || "request failed"}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  return handleResponse<T>(res, `GET ${path}`);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handleResponse<T>(res, `POST ${path}`);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handleResponse<T>(res, `PUT ${path}`);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  return handleResponse<T>(res, `DELETE ${path}`);
}
