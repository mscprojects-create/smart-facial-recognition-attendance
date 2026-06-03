"""
supabase_client.py
Thin singleton wrapper around the Supabase Python SDK so the rest of the
backend imports one ready-to-use client.
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    # Fail loudly so misconfiguration is obvious during a demo.
    raise RuntimeError(
        "SUPABASE_URL / SUPABASE_SERVICE_KEY missing. "
        "Copy backend/.env.example to backend/.env and fill them in."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
