from supabase import Client

BUCKET = "documents"


def upload_file(
    client: Client,
    file_bytes: bytes,
    storage_path: str,
    content_type: str = "application/pdf",
) -> None:
    """Upload raw bytes to the documents bucket at the given path."""
    client.storage.from_(BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "false"},
    )


def get_signed_url(client: Client, storage_path: str, expires_in: int = 3600) -> str:
    """Return a time-limited signed download URL for the given storage path."""
    response = client.storage.from_(BUCKET).create_signed_url(storage_path, expires_in)
    return response["signedURL"]


def delete_file(client: Client, storage_path: str) -> None:
    """Remove a file from the documents bucket."""
    client.storage.from_(BUCKET).remove([storage_path])
