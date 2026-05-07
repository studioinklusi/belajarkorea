import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { snap } from '@/lib/midtrans'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verifikasi Session User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Request Body
    const { productId } = await request.json()
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 3. Ambil Detail Produk
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Ambil Profil User
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Cek apakah sudah pernah beli
    const { data: existingPurchase } = await supabase
      .from('product_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: 'Anda sudah membeli produk ini' }, { status: 400 })
    }

    // 4. Generate Order ID
    const orderId = `DGT-${Date.now()}-${user.id.substring(0, 6).toUpperCase()}`

    // 5. Insert Transaksi ke Supabase (Status Pending)
    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        product_id: product.id,
        order_id: orderId,
        amount: product.price,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting transaction:', insertError)
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
    }

    // 6. Buat Payload untuk Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: product.price
      },
      customer_details: {
        first_name: profile?.full_name || 'Pelanggan',
        email: user.email,
      },
      item_details: [{
        id: product.id.substring(0,10),
        price: product.price,
        quantity: 1,
        name: product.title.substring(0, 50)
      }]
    }

    // 7. Request Snap Token ke Midtrans
    const transactionSnap = await snap.createTransaction(parameter)
    const snapToken = transactionSnap.token

    // 8. Update Transaksi dengan Snap Token
    await supabase
      .from('transactions')
      .update({ snap_token: snapToken })
      .eq('id', transaction.id)

    return NextResponse.json({ token: snapToken, orderId })
    
  } catch (error: unknown) {
    console.error('Create purchase error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
