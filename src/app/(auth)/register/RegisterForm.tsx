'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '../auth/actions'
import { useFormStatus } from 'react-dom'

interface RegisterFormProps {
  error?: string
}

function RegisterSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <div className="pt-4">
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-primary text-brand-on-primary py-4 rounded-2xl font-semibold text-[16px] shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Mendaftar...
          </span>
        ) : (
          <>
            Daftar Sekarang
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  )
}

export default function RegisterForm({ error }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')

  const passwordRules = [
    { label: 'Min. 8 karakter', valid: password.length >= 8 },
    { label: 'Huruf besar (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Huruf kecil (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Angka (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Simbol (@!#$...)', valid: /[^A-Za-z0-9]/.test(password) },
  ]

  return (
    <div className="w-full max-w-[520px] bg-white rounded-[32px] p-6 lg:p-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-brand-surface-variant/30 animate-fade-in-up">
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-2xl font-bold text-brand-on-surface mb-2">Daftar Akun Baru</h2>
        <p className="text-sm text-brand-on-surface-variant">Mulai perjalanan belajar bahasa Korea Anda hari ini.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-brand-error p-4 rounded-xl mb-6">
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

      <form className="space-y-4" action={signup}>
        {/* Full Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-brand-on-surface-variant" htmlFor="fullName">
            Nama Lengkap
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              person
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z\s'. -]+$"
              title="Nama Lengkap minimal 3 karakter dan hanya boleh mengandung huruf, spasi, dan tanda baca dasar ('.-)."
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-brand-on-surface-variant" htmlFor="email-address">
            Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              mail
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              placeholder="nama@email.com"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-brand-on-surface-variant" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              lock
            </span>
            <input
              className="w-full pl-12 pr-12 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={64}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
              title="Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial."
              placeholder="Masukkan password baru"
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
          
          {/* Dynamic Password Validation Rules */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 pl-1">
            {passwordRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs">
                <span className={`material-symbols-outlined text-[14px] select-none ${rule.valid ? 'text-emerald-500 font-bold' : 'text-brand-outline'}`}>
                  {rule.valid ? 'check_circle' : 'circle'}
                </span>
                <span className={rule.valid ? 'text-emerald-600 font-semibold transition-all' : 'text-brand-outline'}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-brand-on-surface-variant" htmlFor="confirm-password">
            Konfirmasi Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-outline">
              lock_reset
            </span>
            <input
              className="w-full pl-12 pr-12 py-3 bg-brand-surface rounded-2xl border border-brand-outline-variant focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-base text-brand-on-surface"
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={64}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
              title="Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial."
              placeholder="Konfirmasi password baru"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-outline hover:text-brand-primary transition-colors focus:outline-none cursor-pointer"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <span className="material-symbols-outlined">
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <RegisterSubmitButton />
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-brand-on-surface-variant">
          Sudah punya akun? 
          <Link href="/login" className="text-brand-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
