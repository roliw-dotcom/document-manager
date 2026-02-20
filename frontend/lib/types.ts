export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Document {
  id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  status: DocumentStatus
  category: string | null
  subcategory: string | null
  summary: string | null
  tags: string[]
  error_message: string | null
  uploaded_at: string
  processed_at: string | null
}
