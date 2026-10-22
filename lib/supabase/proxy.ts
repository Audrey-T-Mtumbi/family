import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ✅ Keep this in sync with the list in app/auth/login/page.tsx
const ALLOWED_EMAILS: string[] = [
  'audreymtu83@gmail.com', // 👈 Replace with your actual email
  // 'familymember@email.com',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ✅ Redirect unauthenticated users away from dashboard
  if (
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // ✅ Kick out authenticated users whose email is NOT on the allowed list
  // This is the server-side enforcement — cannot be bypassed
  if (
    request.nextUrl.pathname.startsWith('/dashboard') &&
    user &&
    !ALLOWED_EMAILS.includes(user.email?.toLowerCase() ?? '')
  ) {
    // Sign them out server-side by clearing cookies
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('error', 'access_denied')
    const redirectResponse = NextResponse.redirect(url)
    // Clear the auth cookies so they are fully signed out
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      if (cookie.name.includes('auth') || cookie.name.includes('supabase')) {
        redirectResponse.cookies.delete(cookie.name)
      }
    })
    return redirectResponse
  }

  return supabaseResponse
}