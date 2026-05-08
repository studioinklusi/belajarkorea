'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

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
  
  // Ambil role untuk menentukan halaman pendaratan (landing page)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (profile && ['admin', 'super_admin', 'content_admin'].includes(profile.role)) {
      redirect('/admin')
    }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const fullName = formData.get('fullName') as string

  if (password !== confirmPassword) {
    return redirect(`/register?error=${encodeURIComponent('Password dan Ulangi Password tidak cocok.')}`)
  }

  const supabase = await createClient()

  // Origin is needed to construct the confirmation link
  const headersList = await headers()
  const host = headersList.get('host') || 'tsuha.vercel.app'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

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

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  
  const headersList = await headers()
  const host = headersList.get('host') || 'tsuha.vercel.app'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  return redirect(`/forgot-password?message=${encodeURIComponent('Tautan pemulihan kata sandi telah dikirim ke email Anda. Tautan ini hanya berlaku selama 24 jam. Jangan lupa periksa folder spam jika tidak menemukannya.')}`)
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password dan konfirmasi password tidak cocok.')}`)
  }

  if (password.length < 6) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password minimal 6 karakter.')}`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  return redirect(`/login?message=${encodeURIComponent('Password berhasil diubah! Silakan login dengan password baru Anda.')}`)
}
