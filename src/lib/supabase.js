// Supabase client. The anon (publishable) key is safe in the browser bundle —
// RLS on user_state restricts each row to its owner via auth.uid() = user_id.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars. ' +
    'Sign-in and sync will not work until these are set in Vercel and locally.'
  )
}

export const supabase = createClient(url || 'https://invalid.supabase.co', anonKey || 'invalid', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export const HAS_SUPABASE_CONFIG = !!(url && anonKey)
