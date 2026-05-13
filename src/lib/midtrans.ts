import 'server-only'

import midtransClient from 'midtrans-client'

// ⚠️ SERVER-ONLY — This module uses MIDTRANS_SERVER_KEY which is secret.
// It must NEVER be imported from client components.
// The 'server-only' import above will cause a build error if this happens.

const serverKey = process.env.MIDTRANS_SERVER_KEY
if (!serverKey) {
  throw new Error(
    'MIDTRANS_SERVER_KEY is not set. ' +
    'Add it to Vercel Environment Variables (Settings → Environment Variables). ' +
    'NEVER use NEXT_PUBLIC_ prefix for this key.'
  )
}

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
  serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
})

// Create Core API instance (useful for webhook validation)
export const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
  serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
})

