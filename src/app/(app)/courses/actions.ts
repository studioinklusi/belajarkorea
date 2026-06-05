'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(lessonId: string, courseSlug: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Ambil detail lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('youtube_video_id, duration_seconds')
    .eq('id', lessonId)
    .single()

  if (!lesson) {
    return { error: 'Materi tidak ditemukan' }
  }

  // 2. Ambil data progress user saat ini
  const { data: progress } = await supabase
    .from('user_progress')
    .select('watch_duration')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  const watchDuration = progress?.watch_duration || 0
  const duration = lesson.duration_seconds || 0
  const hasWatchedVideo = !lesson.youtube_video_id || duration === 0 || watchDuration >= duration * 0.8

  if (!hasWatchedVideo) {
    return { error: 'Anda harus menonton setidaknya 80% dari video terlebih dahulu.' }
  }

  // 3. Ambil jumlah soal kuis untuk materi ini
  const { count: quizQuestionsCount } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  const hasQuiz = (quizQuestionsCount || 0) > 0

  if (hasQuiz) {
    // Cek apakah ada nilai kuis lulus untuk materi ini
    const { data: bestAttempt } = await supabase
      .from('quiz_attempts')
      .select('passed')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('passed', true)
      .limit(1)
      .single()

    if (!bestAttempt) {
      return { error: 'Anda harus lulus kuis pemahaman terlebih dahulu.' }
    }
  }

  // Upsert progress ke completed
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
