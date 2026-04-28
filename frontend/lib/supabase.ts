import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Fail loudly in non-test environments. Silent placeholder values mean the
// app initializes without error but every auth call fails silently — the
// developer wastes time debugging before realizing the env var was never set.
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. ' +
        'Add them to frontend/.env.local (dev) or your Vercel project settings (prod).',
    )
  }
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: { persistSession: true, detectSessionInUrl: true },
  },
)
