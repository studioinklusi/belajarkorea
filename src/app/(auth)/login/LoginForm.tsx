'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../auth/actions'
import { useFormStatus } from 'react-dom'

interface LoginFormProps {
  error?: string
  message?: string
  redirectTo?: string
}

function LoginSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <div className="pt-2">
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-primary text-brand-on-primary py-3.5 rounded-2xl font-semibold text-[16px] shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Masuk...
          </span>
        ) : (
          <>
            Masuk
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  )
}

export default function LoginForm({ error, message, redirectTo }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 lg:p-12 rounded-[32px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-brand-surface-variant/30 relative z-10 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-brand-on-surface mb-2">Masuk ke Akun</h2>
        <p className="text-sm text-brand-on-surface-variant">
          Atau{' '}
          <Link href="/register" className="text-brand-primary font-bold hover:underline decoration-2 underline-offset-4">
            daftar akun baru di sini
          </Link>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-brand-error p-4 rounded-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-brand-error">error</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-brand-error font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{message}</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" action={login}>
        <input type="hidden" name="redirectTo" value={redirectTo || ''} />
        
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email-address" className="block text-sm font-semibold text-brand-on-surface-variant">
            Alamat Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              mail
            </span>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-12 pr-4 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              placeholder="nama@email.com"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-semibold text-brand-on-surface-variant">
              Password
            </label>
            <Link href="/forgot-password" title="Atur ulang kata sandi Anda" className="text-xs font-semibold text-brand-primary hover:underline decoration-2 underline-offset-2">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              lock
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="w-full pl-12 pr-12 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              placeholder="Masukkan kata sandi"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-outline hover:text-brand-primary transition-colors focus:outline-none cursor-pointer"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <LoginSubmitButton />
      </form>
    </div>
  )
}
