import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) return null
  return user
}

// ========== GET QUIZZES BY LESSON ==========
export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lesson_id')

    if (!lessonId) {
      return NextResponse.json({ error: 'lesson_id diperlukan' }, { status: 400 })
    }

    const { data: questions, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
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

// ========== CREATE QUIZ QUESTION ==========
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { lesson_id, question_text, options, correct_answer, explanation, sort_order } = body

    if (!lesson_id || !question_text || !options || !correct_answer) {
      return NextResponse.json({ error: 'lesson_id, question_text, options, dan correct_answer wajib diisi.' }, { status: 400 })
    }

    // Validasi: correct_answer harus ada di dalam options
    const optionKeys = Object.keys(options)
    if (!optionKeys.includes(correct_answer)) {
      return NextResponse.json({ error: 'correct_answer harus merupakan salah satu key dari options (A, B, C, D).' }, { status: 400 })
    }

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .insert({
        lesson_id,
        question_text,
        options,
        correct_answer,
        explanation: explanation || null,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal menambahkan soal: ${(error as Error).message}` }, { status: 500 })
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== UPDATE QUIZ QUESTION ==========
export async function PATCH(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { question_id, question_text, options, correct_answer, explanation } = body

    if (!question_id) {
      return NextResponse.json({ error: 'question_id diperlukan' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (question_text !== undefined) updateData.question_text = question_text
    if (options !== undefined) updateData.options = options
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer
    if (explanation !== undefined) updateData.explanation = explanation

    // Validasi: correct_answer harus ada di dalam options jika keduanya diberikan
    if (options && correct_answer) {
      const optionKeys = Object.keys(options)
      if (!optionKeys.includes(correct_answer)) {
        return NextResponse.json({ error: 'correct_answer harus merupakan salah satu key dari options (A, B, C, D).' }, { status: 400 })
      }
    }

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(updateData)
      .eq('id', question_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal mengupdate soal: ${(error as Error).message}` }, { status: 500 })
    }

    return NextResponse.json({ question })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ========== DELETE QUIZ QUESTION ==========
export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { question_id } = await request.json()
    if (!question_id) {
      return NextResponse.json({ error: 'question_id diperlukan' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', question_id)

    if (error) {
      return NextResponse.json({ error: `Gagal menghapus: ${(error as Error).message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Soal berhasil dihapus' })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
