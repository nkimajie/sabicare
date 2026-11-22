// Supabase, used only from the server with the secret key.
// The "plans" table has row-level security on and no policies, so the public
// (publishable/anon) key can read nothing. See supabase/schema.sql.
import { createClient } from "@supabase/supabase-js";

export const dbEnabled = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.PLAN_ENCRYPTION_KEY,
);

export function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
