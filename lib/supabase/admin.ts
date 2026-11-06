import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_SCHEMA,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/lib/env";

type AdminClient = {
  from: (table: string) => any;
  storage: any;
  auth: any;
};

let cached: AdminClient | null = null;

export function getSupabaseAdmin(): AdminClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server environment variables are not configured.");
  }
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: SUPABASE_SCHEMA },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    } as any) as unknown as AdminClient;
  }
  return cached;
}
