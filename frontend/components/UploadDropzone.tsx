'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadDocument } from '@/lib/api'

type ItemStatus = 'waiting' | 'uploading' | 'done' | 'error'

interface QueueItem {
  id: string
  name: string
  status: ItemStatus
  error?: string
}

export default function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const router = useRouter()

  function patchItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function processFiles(files: File[]) {
    const pdfs = files.filter((f) => f.type === 'application/pdf')
    if (pdfs.length === 0) return

    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    // Add all files to queue immediately so the user sees them
    const newItems: QueueItem[] = pdfs.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      status: 'waiting',
    }))
    setQueue((prev) => [...prev, ...newItems])

    for (let i = 0; i < pdfs.length; i++) {
      const { id } = newItems[i]
      patchItem(id, { status: 'uploading' })
      try {
        await uploadDocument(pdfs[i], session.access_token)
        patchItem(id, { status: 'done' })
      } catch (err) {
        patchItem(id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed.',
        })
      }
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  const allDone =
    queue.length > 0 && queue.every((q) => q.status === 'done' || q.status === 'error')

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-14 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          multiple
          id="file-input"
          className="hidden"
          onChange={(e) => processFiles(Array.from(e.target.files ?? []))}
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16V8m0 0-3 3m3-3 3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
            />
          </svg>
          <p className="text-base font-medium text-gray-700">Drop PDF files here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse · PDF only · max 50 MB</p>
        </label>
      </div>

      {/* Per-file status list */}
      {queue.length > 0 && (
        <ul className="space-y-2">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2"
            >
              <span className="truncate text-gray-700 max-w-xs">{item.name}</span>
              <span
                className={
                  item.status === 'uploading' ? 'text-blue-600 animate-pulse' :
                  item.status === 'done'      ? 'text-green-600' :
                  item.status === 'error'     ? 'text-red-600' :
                  'text-gray-400'
                }
              >
                {item.status === 'waiting'   && 'Waiting…'}
                {item.status === 'uploading' && 'Uploading…'}
                {item.status === 'done'      && 'Uploaded'}
                {item.status === 'error'     && (item.error ?? 'Error')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {allDone && (
        <button
          onClick={() => router.push('/')}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to my documents
        </button>
      )}
    </div>
  )
}
