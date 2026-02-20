'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDocument, getDownloadUrl, deleteDocument } from '@/lib/api'
import type { Document } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function getToken(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getToken()
      .then((token) => getDocument(id, token))
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load document.'))
      .finally(() => setLoading(false))
  }, [id])

  // Realtime: update this document in-place when it finishes processing
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`doc-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents', filter: `id=eq.${id}` },
        (payload) => setDoc(payload.new as Document),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function handleDownload() {
    const token = await getToken()
    const url = await getDownloadUrl(id, token)
    window.open(url, '_blank')
  }

  async function handleDelete() {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(true)
    const token = await getToken()
    await deleteDocument(id, token)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-8 bg-gray-200 rounded w-full" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    )
  }

  if (error) {
    return <p className="max-w-2xl mx-auto px-4 py-12 text-sm text-red-600">{error}</p>
  }

  if (!doc) return null

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Back to documents
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 break-all">
            {doc.original_filename}
          </h1>
          {doc.category && (
            <p className="text-sm text-indigo-600 font-medium mt-1">
              {doc.category}
              {doc.subcategory ? ` › ${doc.subcategory}` : ''}
            </p>
          )}
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Summary */}
      {doc.summary && (
        <section className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{doc.summary}</p>
        </section>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-8 border-t border-gray-100 pt-6">
        <dt className="text-gray-500">File size</dt>
        <dd className="text-gray-900">{formatBytes(doc.file_size)}</dd>

        <dt className="text-gray-500">Uploaded</dt>
        <dd className="text-gray-900">{formatDate(doc.uploaded_at)}</dd>

        {doc.processed_at && (
          <>
            <dt className="text-gray-500">Processed</dt>
            <dd className="text-gray-900">{formatDate(doc.processed_at)}</dd>
          </>
        )}

        {doc.error_message && (
          <>
            <dt className="text-gray-500">Error</dt>
            <dd className="text-red-600 text-xs">{doc.error_message}</dd>
          </>
        )}
      </dl>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Download
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="border border-red-200 text-red-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </main>
  )
}
