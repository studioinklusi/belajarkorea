import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ========== GET QUIZZES FOR STUDENT ==========
export async function GET(request: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')

    if (!lessonId) {
      return NextResponse.json({ error: 'lesson_id diperlukan' }, { status: 400 })
    }

    // Check if user has access to the lesson (subscription check)
    // For now, assume if they can hit this API, they have access or we can rely on RLS.
    // Let's rely on RLS for quiz_questions if we set it up, but for now we fetch it.
    
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options, explanation, sort_order')
      .eq('lesson_id', lessonId)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== SUBMIT QUIZ ATTEMPT ==========
export async function POST(request: Request) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { lesson_id, answers } = body // answers: { [questionId]: 'A' }

    if (!lesson_id || !answers) {
      return NextResponse.json({ error: 'lesson_id dan answers diperlukan' }, { status: 400 })
    }

    // Cek cooldown (1 jam)
    const { data: lastAttempt } = await supabase
      .from('quiz_attempts')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson_id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (lastAttempt && lastAttempt.completed_at) {
      const lastTime = new Date(lastAttempt.completed_at).getTime()
      const now = new Date().getTime()
      const hoursDiff = (now - lastTime) / (1000 * 60 * 60)
      
      if (hoursDiff < 1) {
        const remainingMinutes = Math.ceil(60 - (hoursDiff * 60))
        return NextResponse.json(
          { 
            error: `Kamu hebat sudah mau mencoba lagi! 💪 Tapi yuk istirahat dulu ${remainingMinutes} menit ya, sambil review materinya lagi biar makin paham. Tsuha.id percaya kamu pasti bisa! 🌟`,
            cooldown: true,
            remaining_minutes: remainingMinutes
          },
          { status: 429 }
        )
      }
    }

    // Fetch correct answers to calculate score
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('lesson_id', lesson_id)

    if (qError || !questions) {
      return NextResponse.json({ error: 'Gagal mengambil data soal' }, { status: 500 })
    }

    let correctCount = 0
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= 80 // Passing grade 80

    // Save attempt
    const { data: attempt, error: aError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        lesson_id,
        answers,
        score,
        passed,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (aError) {
      return NextResponse.json({ error: `Gagal menyimpan skor: ${aError.message}` }, { status: 500 })
    }

    // Jika kuis lulus, cek apakah video juga sudah selesai ditonton agar status materi bisa complete
    if (passed) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('youtube_video_id, duration_seconds')
        .eq('id', lesson_id)
        .single()

      if (lesson) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('id, watch_duration, status')
          .eq('user_id', user.id)
          .eq('lesson_id', lesson_id)
          .single()

        const watchDuration = progress?.watch_duration || 0
        const duration = lesson.duration_seconds || 0
        const hasWatchedVideo = !lesson.youtube_video_id || duration === 0 || watchDuration >= duration * 0.8

        if (hasWatchedVideo) {
          const updateData = {
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          if (progress) {
            await supabase
              .from('user_progress')
              .update(updateData)
              .eq('id', progress.id)
          } else {
            await supabase
              .from('user_progress')
              .insert({
                user_id: user.id,
                lesson_id,
                status: 'completed',
                watch_duration: 0,
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
          }
        }
      }
    }

    return NextResponse.json({ 
      attempt, 
      total: questions.length, 
      correct: correctCount,
      score,
      passed
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
