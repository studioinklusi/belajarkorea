'use client'

import { QRCodeSVG } from 'qrcode.react'

export default function CertificateQR({ url, certId }: { url: string, certId: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
        <QRCodeSVG value={url} size={80} level="M" />
      </div>
      <p className="mt-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">ID: {certId}</p>
    </div>
  )
}
