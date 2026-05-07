import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Singleton admin client — bypasses RLS using service role key
// Use ONLY in server-side code: API routes, webhooks, cron jobs, server components
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
