import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Sign out from Supabase (clears the auth cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.auth.signOut()
  }

  // Clear profile cache cookie
  const cookieStore = await cookies()
  cookieStore.delete('x-user-profile')

  const { origin } = new URL(request.url)
  
  // Clean redirect back to login page (303 is standard for POST redirect)
  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  })
}
