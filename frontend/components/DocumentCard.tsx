import Link from 'next/link'
import type { Document } from '@/lib/types'
import StatusBadge from './StatusBadge'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Link href={`/doc/${doc.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col gap-3">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-semibold text-gray-900 truncate"
            title={doc.original_filename}
          >
            {doc.original_filename}
          </p>
          <StatusBadge status={doc.status} />
        </div>

        {/* Category */}
        {doc.category && (
          <p className="text-xs text-indigo-600 font-medium">
            {doc.category}
            {doc.subcategory ? ` › ${doc.subcategory}` : ''}
          </p>
        )}

        {/* Summary */}
        {doc.summary && (
          <p className="text-sm text-gray-600 line-clamp-2 flex-1">{doc.summary}</p>
        )}

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-1 border-t border-gray-100">
          <span>{formatBytes(doc.file_size)}</span>
          <span>{formatDate(doc.uploaded_at)}</span>
        </div>
      </div>
    </Link>
  )
}
