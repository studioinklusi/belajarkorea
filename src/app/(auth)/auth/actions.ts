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

  if (fullName.length < 3) {
    return redirect(`/register?error=${encodeURIComponent('Nama Lengkap terlalu singkat (minimal 3 karakter).')}`)
  }
  if (fullName.length > 50) {
    return redirect(`/register?error=${encodeURIComponent('Nama Lengkap terlalu panjang (maksimal 50 karakter).')}`)
  }
  if (!/^[a-zA-Z\s'. -]+$/.test(fullName)) {
    return redirect(`/register?error=${encodeURIComponent('Pastikan Nama Lengkap hanya menggunakan huruf, spasi, atau tanda baca dasar.')}`)
  }

  if (password !== confirmPassword) {
    return redirect(`/register?error=${encodeURIComponent('Password dan Ulangi Password tidak cocok. Silakan periksa kembali.')}`)
  }

  if (password.length < 8) {
    return redirect(`/register?error=${encodeURIComponent('Password terlalu pendek. Gunakan minimal 8 karakter.')}`)
  }
  if (password.length > 64) {
    return redirect(`/register?error=${encodeURIComponent('Password terlalu panjang. Gunakan maksimal 64 karakter.')}`)
  }
  if (!/[A-Z]/.test(password)) {
    return redirect(`/register?error=${encodeURIComponent('Password harus memiliki setidaknya satu huruf besar (A-Z).')}`)
  }
  if (!/[a-z]/.test(password)) {
    return redirect(`/register?error=${encodeURIComponent('Password harus memiliki setidaknya satu huruf kecil (a-z).')}`)
  }
  if (!/[0-9]/.test(password)) {
    return redirect(`/register?error=${encodeURIComponent('Password harus memiliki setidaknya satu angka (0-9).')}`)
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return redirect(`/register?error=${encodeURIComponent('Password harus memiliki setidaknya satu simbol khusus (seperti @, #, !, dll).')}`)
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
    return redirect(`/reset-password?error=${encodeURIComponent('Password dan Konfirmasi Password tidak cocok. Silakan periksa kembali.')}`)
  }

  if (password.length < 8) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password terlalu pendek. Gunakan minimal 8 karakter.')}`)
  }
  if (password.length > 64) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password terlalu panjang. Gunakan maksimal 64 karakter.')}`)
  }
  if (!/[A-Z]/.test(password)) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password harus memiliki setidaknya satu huruf besar (A-Z).')}`)
  }
  if (!/[a-z]/.test(password)) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password harus memiliki setidaknya satu huruf kecil (a-z).')}`)
  }
  if (!/[0-9]/.test(password)) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password harus memiliki setidaknya satu angka (0-9).')}`)
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return redirect(`/reset-password?error=${encodeURIComponent('Password harus memiliki setidaknya satu simbol khusus (seperti @, #, !, dll).')}`)
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
