'use client'

import dynamic from 'next/dynamic'

const InstallPrompt = dynamic(() => import('./InstallPrompt'), { ssr: false })
const SWUpdateNotifier = dynamic(() => import('./SWUpdateNotifier'), { ssr: false })

export default function PWAPrompts() {
  return (
    <>
      <InstallPrompt />
      <SWUpdateNotifier />
    </>
  )
}
