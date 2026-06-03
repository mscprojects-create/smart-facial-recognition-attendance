"""api/supabase_client.py — Supabase client for the serverless build."""
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
