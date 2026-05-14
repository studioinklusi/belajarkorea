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

export async function sendPasswordResetEmail(prevState: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Tidak dapat menemukan akun Anda. Silakan login kembali.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tsuha.id'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: 'Gagal mengirim email. Silakan coba lagi nanti.' }
  }

  return { success: `Link ubah password telah dikirim ke ${user.email}. Silakan cek inbox atau folder spam Anda.` }
}
