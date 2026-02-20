'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { listDocuments } from '@/lib/api'
import type { Document } from '@/lib/types'
import DocumentCard from '@/components/DocumentCard'
import CategoryFilter from '@/components/CategoryFilter'

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [category, setCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce the raw query input by 300 ms before hitting the API
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  const load = useCallback(async (cat: string | null, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const filters: { category?: string; q?: string } = {}
      if (cat) filters.category = cat
      if (q) filters.q = q
      const result = await listDocuments(session.access_token, filters)
      setDocuments(result.documents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(category, debouncedQuery)
  }, [category, debouncedQuery, load])

  // Supabase Realtime — refresh list when any document row is updated
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents' },
        () => load(category, debouncedQuery),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [category, debouncedQuery, load])

  const isEmpty = !loading && !error && documents.length === 0

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Row 1: category pills + upload button */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <CategoryFilter selected={category} onChange={setCategory} />
          <Link
            href="/upload"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Upload
          </Link>
        </div>

        {/* Row 2: search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category, or summary…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-sm text-red-600 text-center py-16">{error}</p>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-24">
          {debouncedQuery ? (
            <p className="text-gray-400">
              No results for <span className="font-medium text-gray-600">&ldquo;{debouncedQuery}&rdquo;</span>
            </p>
          ) : (
            <>
              <p className="text-gray-400 mb-4">No documents yet.</p>
              <Link href="/upload" className="text-indigo-600 text-sm hover:underline">
                Upload your first PDF
              </Link>
            </>
          )}
        </div>
      )}

      {/* Document grid */}
      {!loading && !error && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </main>
  )
}
