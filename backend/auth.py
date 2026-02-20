from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from config import settings

_bearer = HTTPBearer()

# Single admin client — service key lets us call auth.get_user() to validate tokens.
_admin_client = create_client(settings.supabase_url, settings.supabase_service_key)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """Validate the Supabase JWT by calling Supabase's own auth API.

    Supabase handles all algorithm details (ES256, RS256, HS256). Returns the
    authenticated user's ID. Raises HTTP 401 on invalid/expired tokens.
    """
    token = credentials.credentials
    try:
        response = _admin_client.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}")

    if not response.user or not response.user.id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    return response.user.id
