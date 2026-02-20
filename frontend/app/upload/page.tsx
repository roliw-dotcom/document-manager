import Link from 'next/link'
import UploadDropzone from '@/components/UploadDropzone'

export default function UploadPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Back to documents
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Upload documents</h1>
      <p className="text-sm text-gray-500 mb-8">
        PDFs are automatically read and categorized after upload.
      </p>

      <UploadDropzone />
    </main>
  )
}
