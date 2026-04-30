import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// ========== CREATE LESSON ==========
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { course_id, title, description, youtube_video_id, duration_seconds, sort_order, is_published, is_preview } = body

    if (!course_id || !title || !youtube_video_id) {
      return NextResponse.json({ error: 'course_id, title, dan youtube_video_id wajib diisi.' }, { status: 400 })
    }

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        course_id,
        title,
        description: description || null,
        youtube_video_id,
        duration_seconds: duration_seconds || null,
        sort_order: sort_order ?? 0,
        is_published: is_published ?? false,
        is_preview: is_preview ?? false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal menambahkan materi: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ========== DELETE LESSON ==========
export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { lesson_id } = await request.json()
    if (!lesson_id) {
      return NextResponse.json({ error: 'lesson_id diperlukan' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', lesson_id)

    if (error) {
      return NextResponse.json({ error: `Gagal menghapus: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Materi berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ========== UPDATE LESSON ==========
export async function PATCH(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { lesson_id, title, description, youtube_video_id, duration_seconds, sort_order, is_published, is_preview } = body

    if (!lesson_id || !title || !youtube_video_id) {
      return NextResponse.json({ error: 'lesson_id, title, dan youtube_video_id wajib diisi.' }, { status: 400 })
    }

    const updates: any = {
      title,
      description: description || null,
      youtube_video_id,
      duration_seconds: duration_seconds || null,
      sort_order: sort_order ?? 0,
      is_published: is_published ?? false,
      is_preview: is_preview ?? false,
      updated_at: new Date().toISOString()
    }

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .update(updates)
      .eq('id', lesson_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal mengupdate materi: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ lesson }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
