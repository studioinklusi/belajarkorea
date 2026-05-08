import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: don't remove this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/courses', '/admin']
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Fetch profile ONCE for all checks below (avoids duplicate queries)
  let profile: { role: string; full_name: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    profile = data

    // Cache profile in a lightweight cookie so Navbar can read it
    // without making additional DB queries on every page render
    if (profile) {
      supabaseResponse.cookies.set('x-user-profile', JSON.stringify({
        role: profile.role,
        full_name: profile.full_name,
      }), {
        path: '/',
        httpOnly: false, // Needs to be readable by server components via cookies()
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 30, // 30 minutes — will be refreshed on next middleware call
      })
    }
  } else {
    // Clear profile cookie when user is logged out
    supabaseResponse.cookies.delete('x-user-profile')
  }

  // Admin routes — redirect non-admin users
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/register']
  const isAuthRoute = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthRoute && user) {
    const isAdmin = profile && ['content_admin', 'super_admin'].includes(profile.role)

    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Hide root landing page temporarily
  const isMarketingRoute = request.nextUrl.pathname === '/'

  if (isMarketingRoute) {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

