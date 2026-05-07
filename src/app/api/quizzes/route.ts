import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ========== GET QUIZZES FOR STUDENT ==========
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ========== SUBMIT QUIZ ATTEMPT ==========
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
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
          { error: `Harap tunggu ${remainingMinutes} menit lagi sebelum mengulang kuis.` },
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
    questions.forEach((q) => {
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

    return NextResponse.json({ 
      attempt, 
      total: questions.length, 
      correct: correctCount,
      score,
      passed
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
