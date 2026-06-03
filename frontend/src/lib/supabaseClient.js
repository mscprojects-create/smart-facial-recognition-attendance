// Optional direct-to-Supabase client (e.g. for realtime). Most data flows
// through the Flask API, but this is provided for completeness.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anon ? createClient(url, anon) : null; // null when not configured
