'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(prevState: any, formData: FormData) {
  const fullName = formData.get('fullName') as string

  if (!fullName || fullName.trim().length < 3) {
    return { error: 'Nama terlalu singkat. Minimal 3 karakter.' }
  }
  if (fullName.length > 50) {
    return { error: 'Nama terlalu panjang. Maksimal 50 karakter.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)

  if (error) {
    return { error: 'Gagal memperbarui profil. Silakan coba lagi.' }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  
  return { success: 'Profil berhasil diperbarui!' }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Password dan Konfirmasi Password tidak cocok.' }
  }

  if (password.length < 8 || password.length > 64) {
    return { error: 'Password harus antara 8 dan 64 karakter.' }
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return { error: 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password berhasil diperbarui!' }
}
