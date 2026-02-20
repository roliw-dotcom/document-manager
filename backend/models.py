from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    summary: Optional[str] = None
    tags: list[str] = []
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class DownloadUrlResponse(BaseModel):
    url: str
    expires_in: int = 3600
