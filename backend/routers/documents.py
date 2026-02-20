import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from supabase import Client

from auth import get_current_user
from database import get_supabase
from models import DocumentListResponse, DocumentResponse, DownloadUrlResponse
from services import ai_categorizer, pdf_extractor, storage

router = APIRouter(prefix="/documents", tags=["documents"])

_MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=DocumentResponse, status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user),
):
    """Accept a PDF, store it, and enqueue background categorization.

    Returns immediately with status='pending'. Poll GET /{doc_id} or subscribe
    to Supabase Realtime to know when processing finishes.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    if len(file_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50 MB limit.")

    doc_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{doc_id}/{file.filename}"

    row = {
        "id": doc_id,
        "user_id": user_id,
        "filename": f"{doc_id}_{file.filename}",
        "original_filename": file.filename,
        "storage_path": storage_path,
        "file_size": len(file_bytes),
        "mime_type": file.content_type or "application/pdf",
        "status": "pending",
    }

    result = supabase.table("documents").insert(row).execute()
    storage.upload_file(supabase, file_bytes, storage_path)

    background_tasks.add_task(_process_document, doc_id, file_bytes, file.filename)

    return DocumentResponse(**result.data[0])


# ---------------------------------------------------------------------------
# Background processing
# ---------------------------------------------------------------------------

def _process_document(doc_id: str, file_bytes: bytes, filename: str) -> None:
    """Extract text and categorize the document. Runs after the response is sent.

    Uses the service role key, so it can write regardless of RLS.
    Scoping by doc_id is sufficient — the user_id was already set on insert.
    """
    supabase = get_supabase()

    def _patch(fields: dict) -> None:
        supabase.table("documents").update(fields).eq("id", doc_id).execute()

    try:
        _patch({"status": "processing"})

        text = pdf_extractor.extract_text(file_bytes)
        ai_result = ai_categorizer.categorize_document(text, filename)

        _patch({
            "status": "done",
            "extracted_text": text,
            "category": ai_result.get("category"),
            "subcategory": ai_result.get("subcategory"),
            "summary": ai_result.get("summary"),
            "tags": ai_result.get("tags", []),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })

    except Exception as exc:  # noqa: BLE001
        _patch({"status": "error", "error_message": str(exc)})


# ---------------------------------------------------------------------------
# List & fetch
# ---------------------------------------------------------------------------

@router.get("/", response_model=DocumentListResponse)
def list_documents(
    category: str | None = None,
    status: str | None = None,
    q: str | None = None,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user),
):
    """Return documents belonging to the authenticated user.

    Supports optional full-text search across filename, summary, category,
    subcategory, and tags via the `q` query parameter.
    """
    query = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
    )

    if category:
        query = query.eq("category", category)
    if status:
        query = query.eq("status", status)
    if q:
        # Strip LIKE metacharacters from user input so they're treated literally.
        safe_q = q.replace("%", "").replace("_", r"\_").strip()
        if safe_q:
            query = query.or_(
                f"original_filename.ilike.%{safe_q}%,"
                f"summary.ilike.%{safe_q}%,"
                f"category.ilike.%{safe_q}%,"
                f"subcategory.ilike.%{safe_q}%,"
                f"tags_text.ilike.%{safe_q}%"
            )

    result = query.execute()
    docs = [DocumentResponse(**d) for d in result.data]
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user),
):
    result = (
        supabase.table("documents")
        .select("*")
        .eq("id", doc_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentResponse(**result.data)


@router.get("/{doc_id}/download-url", response_model=DownloadUrlResponse)
def get_download_url(
    doc_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user),
):
    result = (
        supabase.table("documents")
        .select("storage_path")
        .eq("id", doc_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    url = storage.get_signed_url(supabase, result.data["storage_path"])
    return DownloadUrlResponse(url=url)


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user),
):
    result = (
        supabase.table("documents")
        .select("storage_path")
        .eq("id", doc_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    storage.delete_file(supabase, result.data["storage_path"])
    supabase.table("documents").delete().eq("id", doc_id).eq("user_id", user_id).execute()
