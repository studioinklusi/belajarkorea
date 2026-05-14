'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(lessonId: string, courseSlug: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Upsert progress
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, lesson_id'
    })

  if (error) {
    console.error('Error marking lesson complete:', error)
    return { error: error.message }
  }

  // Revalidate the entire course layout so sidebar updates in all lesson pages
  revalidatePath(`/courses/${courseSlug}`, 'layout')
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}
