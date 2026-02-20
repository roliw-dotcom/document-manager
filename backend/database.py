from supabase import Client, create_client

from config import settings


def get_supabase() -> Client:
    """Create a Supabase client with the service role key.

    The service role key bypasses Row Level Security, which lets the backend
    write rows on behalf of users during background processing (where no JWT
    is present). Application code is responsible for always setting user_id
    correctly — RLS will enforce isolation once the frontend queries via the
    anon/user JWT.
    """
    return create_client(settings.supabase_url, settings.supabase_service_key)
