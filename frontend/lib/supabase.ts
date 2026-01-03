import { createBrowserClient } from '@supabase/ssr'

// Creamos el cliente que usa Cookies automáticamente
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)