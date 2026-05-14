'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateCertificateName(formData: FormData) {
  const newName = formData.get('fullName') as string
  const courseSlug = formData.get('courseSlug') as string

  if (!newName || newName.trim().length < 3) {
    return { error: 'Nama terlalu singkat. Minimal 3 karakter.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: newName.trim() })
    .eq('id', user.id)

  if (error) {
    return { error: 'Gagal memperbarui nama. Silakan coba lagi.' }
  }

  revalidatePath(`/certificates/${courseSlug}`)
  redirect(`/certificates/${courseSlug}?confirmed=true`)
}
