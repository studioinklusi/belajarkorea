import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has purchased the product
    const { data: purchase } = await supabase
      .from('product_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    // Also allow admins to download
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile && ['content_admin', 'super_admin'].includes(profile.role)

    if (!purchase && !isAdmin) {
      return NextResponse.json({ error: 'You have not purchased this product' }, { status: 403 })
    }

    // Get the product file_path
    const { data: product } = await supabaseAdmin
      .from('digital_products')
      .select('file_path')
      .eq('id', productId)
      .single()

    if (!product || !product.file_path) {
      return NextResponse.json({ error: 'Product file not found' }, { status: 404 })
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('digital-products')
      .createSignedUrl(product.file_path, 60) // valid for 60 seconds

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
