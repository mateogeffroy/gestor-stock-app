import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificamos el usuario
  const { data: { user } } = await supabase.auth.getUser()

  // DEFINICIÓN DE RUTAS
  const path = request.nextUrl.pathname
  
  const isLoginPage = path.startsWith('/login')
  
  // 🚨 LA SOLUCIÓN: Agregamos estas rutas a la lista de "permitidos sin loguearse"
  const isRecoveryApi = path.startsWith('/api/send-recovery')
  const isAuthCallback = path.startsWith('/auth/callback')
  const isUpdatePassword = path.startsWith('/update-password') // También pública o semipública para el reset

  // 1. Si NO hay usuario...
  if (!user) {
    // ... Y NO estamos en ninguna de las rutas públicas permitidas...
    if (!isLoginPage && !isRecoveryApi && !isAuthCallback && !isUpdatePassword) {
        // ... Entonces sí, mandalo al login.
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
  }

  // 2. Si HAY usuario y está en login, mandarlo al inicio (o ventas)
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/ventas' 
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}