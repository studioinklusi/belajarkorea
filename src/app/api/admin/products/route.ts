import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // 1. Verifikasi user adalah admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseInt(formData.get('price') as string)
    const productType = formData.get('product_type') as string
    const downloadLimit = parseInt(formData.get('download_limit') as string) || 5
    const isActive = formData.get('is_active') === 'true'
    const file = formData.get('file') as File | null
    const externalUrl = formData.get('external_url') as string
    const thumbnail = formData.get('thumbnail') as File | null

    if (!title || !price || (!file && !externalUrl)) {
      return NextResponse.json({ error: 'Title, price, dan file/link wajib diisi.' }, { status: 400 })
    }

    let filePath = externalUrl || ''

    // 3. Upload file ke Supabase Storage jika ada file
    if (file && file.size > 0) {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      filePath = `products/${fileName}`

      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('digital-products')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: `Gagal upload file: ${uploadError.message}` }, { status: 500 })
      }
    }

    // 4. Simpan data produk ke database
    const insertData: Record<string, any> = {
      title,
      description: description || null,
      price,
      file_path: filePath,
      product_type: productType || 'pdf',
      is_active: isActive,
      download_limit: downloadLimit,
    }

    // Upload thumbnail jika ada
    if (thumbnail && thumbnail.size > 0) {
      const thumbName = `products/${Date.now()}_thumb_${thumbnail.name.replace(/\s+/g, '_')}`
      const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer())
      const { error: thumbErr } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbName, thumbBuffer, { contentType: thumbnail.type, upsert: false })
      if (!thumbErr) {
        const { data: urlData } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(thumbName)
        insertData.thumbnail_url = urlData.publicUrl
      }
    }

    const { data: product, error: dbError } = await supabaseAdmin
      .from('digital_products')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      // Rollback: hapus file yang sudah diupload
      await supabaseAdmin.storage.from('digital-products').remove([filePath])
      return NextResponse.json({ error: `Gagal menyimpan produk: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })

  } catch (error: unknown) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}

// ========== UPDATE PRODUCT ==========
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

    if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const productId = formData.get('product_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseInt(formData.get('price') as string)
    const productType = formData.get('product_type') as string
    const downloadLimit = parseInt(formData.get('download_limit') as string) || 5
    const isActive = formData.get('is_active') === 'true'
    const file = formData.get('file') as File | null
    const externalUrl = formData.get('external_url') as string
    const thumbnail = formData.get('thumbnail') as File | null

    if (!productId || !title || !price) {
      return NextResponse.json({ error: 'product_id, title, dan price wajib diisi.' }, { status: 400 })
    }

    // Ambil file lama
    const { data: oldProduct } = await supabaseAdmin
      .from('digital_products')
      .select('file_path')
      .eq('id', productId)
      .single()

    let newFilePath: string | undefined

    if (externalUrl) {
      newFilePath = externalUrl
      // Hapus file lama jika sebelumnya berupa upload (bukan http)
      if (oldProduct?.file_path && !oldProduct.file_path.startsWith('http')) {
        await supabaseAdmin.storage.from('digital-products').remove([oldProduct.file_path])
      }
    } else if (file && file.size > 0) {
      // Upload file baru
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const filePath = `products/${fileName}`
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('digital-products')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: `Gagal upload file: ${uploadError.message}` }, { status: 500 })
      }

      newFilePath = filePath

      // Hapus file lama jika sebelumnya berupa upload
      if (oldProduct?.file_path && !oldProduct.file_path.startsWith('http')) {
        await supabaseAdmin.storage.from('digital-products').remove([oldProduct.file_path])
      }
    }

    // Update database
    const updateData: Record<string, any> = {
      title,
      description: description || null,
      price,
      product_type: productType || 'pdf',
      is_active: isActive,
      download_limit: downloadLimit,
    }
    if (newFilePath) {
      updateData.file_path = newFilePath
    }

    // Upload thumbnail baru jika ada
    if (thumbnail && thumbnail.size > 0) {
      const thumbName = `products/${Date.now()}_thumb_${thumbnail.name.replace(/\s+/g, '_')}`
      const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer())
      const { error: thumbErr } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbName, thumbBuffer, { contentType: thumbnail.type, upsert: false })
      if (!thumbErr) {
        const { data: urlData } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(thumbName)
        updateData.thumbnail_url = urlData.publicUrl
      }
    }

    const { data: product, error: dbError } = await supabaseAdmin
      .from('digital_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: `Gagal memperbarui produk: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ product })

  } catch (error: unknown) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Verifikasi user adalah admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['content_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Ambil product_id dari body
    const { product_id } = await request.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 })
    }

    // 3. Cek apakah ada pembelian yang terkait
    const { count: purchaseCount } = await supabaseAdmin
      .from('product_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product_id)

    if (purchaseCount && purchaseCount > 0) {
      // Soft delete: nonaktifkan produk karena ada riwayat pembelian
      const { error: softDeleteError } = await supabaseAdmin
        .from('digital_products')
        .update({ is_active: false })
        .eq('id', product_id)

      if (softDeleteError) {
        return NextResponse.json({ error: `Gagal menonaktifkan produk: ${(softDeleteError as Error).message}` }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Produk telah dinonaktifkan karena ada riwayat pembelian. Data pembelian tetap aman.',
        soft_deleted: true
      })
    }

    // 4. Hard delete: produk belum pernah dibeli, aman untuk dihapus
    const { data: product } = await supabaseAdmin
      .from('digital_products')
      .select('file_path')
      .eq('id', product_id)
      .single()

    if (product?.file_path && !product.file_path.startsWith('http')) {
      await supabaseAdmin.storage.from('digital-products').remove([product.file_path])
    }

    const { error } = await supabaseAdmin
      .from('digital_products')
      .delete()
      .eq('id', product_id)

    if (error) {
      return NextResponse.json({ error: `Gagal menghapus: ${(error as Error).message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Produk berhasil dihapus' })

  } catch (error: unknown) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
