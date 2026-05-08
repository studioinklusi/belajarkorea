import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Package management requires super_admin
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Hanya Super Admin yang dapat mengelola paket.' }, { status: 403 })
    }

    const body = await request.json()
    const { package_id, price, is_active, description, features } = body

    if (!package_id) {
      return NextResponse.json({ error: 'package_id wajib diisi.' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (price !== undefined) updateData.price = price
    if (is_active !== undefined) updateData.is_active = is_active
    if (description !== undefined) updateData.description = description
    if (features !== undefined) updateData.features = features

    const { data: pkg, error: dbError } = await supabaseAdmin
      .from('packages')
      .update(updateData)
      .eq('id', package_id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Gagal memperbarui paket: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ package: pkg })
  } catch (error: unknown) {
    console.error('Update package error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Package management requires super_admin
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Hanya Super Admin yang dapat mengelola paket.' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, price, duration_days, description, features, sort_order } = body

    if (!name || !slug || price === undefined || !duration_days) {
      return NextResponse.json({ error: 'Data paket tidak lengkap.' }, { status: 400 })
    }

    const { data: pkg, error: dbError } = await supabaseAdmin
      .from('packages')
      .insert({
        name,
        slug,
        price,
        duration_days,
        description,
        features,
        is_active: true,
        sort_order: sort_order || 10
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Gagal membuat paket: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ package: pkg })
  } catch (error: unknown) {
    console.error('Create package error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
