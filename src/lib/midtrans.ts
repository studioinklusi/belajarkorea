import midtransClient from 'midtrans-client'

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
})

// Create Core API instance (useful for webhook validation)
export const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
})
