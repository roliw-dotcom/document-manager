import type { DocumentStatus } from '@/lib/types'

const STYLES: Record<DocumentStatus, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800 animate-pulse',
  done:       'bg-green-100 text-green-800',
  error:      'bg-red-100 text-red-800',
}

const LABELS: Record<DocumentStatus, string> = {
  pending:    'Pending',
  processing: 'Processing',
  done:       'Done',
  error:      'Error',
}

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
