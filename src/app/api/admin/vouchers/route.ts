import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { code, discount_type, discount_value, max_discount, max_uses, valid_from, valid_until, applicable_package_ids, is_active } = body

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Data voucher tidak lengkap.' }, { status: 400 })
    }

    const { data: voucher, error: dbError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        max_discount: max_discount || null,
        max_uses: max_uses || null,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        applicable_package_ids: applicable_package_ids && applicable_package_ids.length > 0 ? applicable_package_ids : null,
        is_active: is_active ?? true
      })
      .select()
      .single()

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'Kode promo ini sudah ada. Gunakan kode yang berbeda.' }, { status: 400 })
      }
      return NextResponse.json({ error: `Gagal membuat voucher: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ voucher })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}

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

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'ID dan status wajib diisi.' }, { status: 400 })
    }

    const { data: voucher, error: dbError } = await supabaseAdmin
      .from('vouchers')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Gagal memperbarui voucher: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ voucher })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi.' }, { status: 400 })
    }

    const { error: dbError } = await supabaseAdmin
      .from('vouchers')
      .delete()
      .eq('id', id)

    if (dbError) {
      if (dbError.code === '23503') {
        return NextResponse.json({ error: 'Tidak dapat menghapus voucher karena sudah pernah digunakan oleh pengguna. Silakan nonaktifkan saja.' }, { status: 400 })
      }
      return NextResponse.json({ error: `Gagal menghapus voucher: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
