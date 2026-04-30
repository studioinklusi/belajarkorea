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

// ========== CREATE COURSE ==========
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const level = formData.get('level') as string
    const is_published = formData.get('is_published') === 'true'
    const sort_order = parseInt(formData.get('sort_order') as string) || 0
    const thumbnail = formData.get('thumbnail') as File | null

    if (!title || !level) {
      return NextResponse.json({ error: 'Title dan level wajib diisi.' }, { status: 400 })
    }

    // Auto-generate slug dari title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now().toString(36)

    // Upload thumbnail jika ada
    let thumbnailUrl: string | null = null
    if (thumbnail && thumbnail.size > 0) {
      const fileName = `courses/${Date.now()}_${thumbnail.name.replace(/\s+/g, '_')}`
      const fileBuffer = Buffer.from(await thumbnail.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(fileName, fileBuffer, {
          contentType: thumbnail.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(fileName)
        thumbnailUrl = urlData.publicUrl
      }
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert({
        title,
        slug,
        description: description || null,
        level,
        is_published,
        sort_order,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal membuat kursus: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ course }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ========== DELETE COURSE ==========
export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { course_id } = await request.json()
    if (!course_id) {
      return NextResponse.json({ error: 'course_id diperlukan' }, { status: 400 })
    }

    // Hapus course (lessons akan cascade delete)
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', course_id)

    if (error) {
      return NextResponse.json({ error: `Gagal menghapus: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Kursus berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ========== UPDATE COURSE ==========
export async function PATCH(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const level = formData.get('level') as string
    const is_published = formData.get('is_published') === 'true'
    const sort_order = parseInt(formData.get('sort_order') as string) || 0
    const thumbnail = formData.get('thumbnail') as File | null

    if (!id || !title || !level) {
      return NextResponse.json({ error: 'ID, Title, dan level wajib diisi.' }, { status: 400 })
    }

    const updates: any = {
      title,
      description: description || null,
      level,
      is_published,
      sort_order,
      updated_at: new Date().toISOString()
    }

    // Upload thumbnail jika ada
    if (thumbnail && thumbnail.size > 0) {
      const fileName = `courses/${Date.now()}_${thumbnail.name.replace(/\s+/g, '_')}`
      const fileBuffer = Buffer.from(await thumbnail.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(fileName, fileBuffer, {
          contentType: thumbnail.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(fileName)
        updates.thumbnail_url = urlData.publicUrl
      }
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Gagal mengupdate kursus: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ course }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
