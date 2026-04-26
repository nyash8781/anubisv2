import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('[server/supabase] NEXT_PUBLIC_SUPABASE_URL is not set')
if (!supabaseAnonKey) throw new Error('[server/supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
if (!supabaseServiceRoleKey) throw new Error('[server/supabase] SUPABASE_SERVICE_ROLE_KEY is not set')

// Admin client — uses service role key to bypass RLS for server-side operations
export function createServerClient() {
  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: { persistSession: false },
  })
}

// User-scoped client — applies RLS via the user's Bearer token
export function supabaseForUser(token: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
}
