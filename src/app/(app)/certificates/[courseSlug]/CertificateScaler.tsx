'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const CERT_WIDTH = 1056
const CERT_HEIGHT = 747

export default function CertificateScaler({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const updateScale = () => {
      const container = wrapper.firstElementChild as HTMLElement
      if (!container) return

      // Available width = wrapper parent width (minus padding handled by parent)
      const availableWidth = wrapper.parentElement?.clientWidth || window.innerWidth - 32
      const scale = Math.min(1, availableWidth / CERT_WIDTH)

      container.style.transform = `scale(${scale})`
      container.style.transformOrigin = 'top left'
      
      // Set wrapper size to match the scaled certificate so it doesn't overflow
      wrapper.style.width = `${CERT_WIDTH * scale}px`
      wrapper.style.height = `${CERT_HEIGHT * scale}px`
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      {children}
    </div>
  )
}
