import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente de Supabase con la sesión del usuario que hace el request: las políticas RLS aplican.
export async function supabaseDelUsuario() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // En route handlers de solo lectura no se pueden escribir cookies; el middleware las refresca.
        }
      },
    },
  })
}
