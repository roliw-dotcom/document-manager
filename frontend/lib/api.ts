import type { Document } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export async function uploadDocument(file: File, token: string): Promise<Document> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Upload failed.')
  }

  return res.json()
}

export async function listDocuments(
  token: string,
  filters?: { category?: string; status?: string; q?: string },
): Promise<{ documents: Document[]; total: number }> {
  const url = new URL(`${API_URL}/documents`)
  if (filters?.category) url.searchParams.set('category', filters.category)
  if (filters?.status) url.searchParams.set('status', filters.status)
  if (filters?.q) url.searchParams.set('q', filters.q)

  const res = await fetch(url.toString(), { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load documents.')
  return res.json()
}

export async function getDocument(id: string, token: string): Promise<Document> {
  const res = await fetch(`${API_URL}/documents/${id}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Document not found.')
  return res.json()
}

export async function getDownloadUrl(id: string, token: string): Promise<string> {
  const res = await fetch(`${API_URL}/documents/${id}/download-url`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Could not get download URL.')
  const data = await res.json()
  return data.url
}

export async function deleteDocument(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to delete document.')
}
