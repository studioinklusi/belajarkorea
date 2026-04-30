'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let returnUrl = `/login?error=${encodeURIComponent(error.message)}`
    if (redirectTo) returnUrl += `&redirectTo=${encodeURIComponent(redirectTo)}`
    return redirect(returnUrl)
  }

  revalidatePath('/', 'layout')
  if (redirectTo) {
    redirect(redirectTo)
  }
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const supabase = await createClient()

  // Origin is needed to construct the confirmation link
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // Jika email confirmation diaktifkan di Supabase, user perlu cek email.
  // Jika tidak, mereka akan langsung login.
  return redirect('/login?message=' + encodeURIComponent('Silakan cek email Anda untuk konfirmasi pendaftaran.'))
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
