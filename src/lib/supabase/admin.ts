import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ⚠️ SERVER-ONLY — This module uses SUPABASE_SERVICE_ROLE_KEY which
// bypasses Row Level Security. It must NEVER be imported from client components.
// The 'server-only' import above will cause a build error if this happens.

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Add it to Vercel Environment Variables (Settings → Environment Variables). ' +
    'NEVER use NEXT_PUBLIC_ prefix for this key.'
  )
}

// Singleton admin client — bypasses RLS using service role key
// Use ONLY in server-side code: API routes, webhooks, cron jobs, server components
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey
)
