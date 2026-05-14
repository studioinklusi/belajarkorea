'use client'

import { useActionState } from 'react'
import { updateProfile, updatePassword } from './actions'
import { SubmitButton } from '@/components/SubmitButton'
import PasswordInput from '@/components/PasswordInput'

export function ProfileForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useActionState(updateProfile, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-medium border border-emerald-200">
          {state.success}
        </div>
      )}
      
      <div>
        <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-2">
          Nama Lengkap (Ditampilkan di Sertifikat)
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          defaultValue={initialName}
          required
          minLength={3}
          maxLength={50}
          className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-medium text-gray-900"
        />
      </div>
      
      <SubmitButton pendingText="Menyimpan..." className="w-full !rounded-xl !py-3 !bg-violet-600 hover:!bg-violet-700">
        Simpan Nama
      </SubmitButton>
    </form>
  )
}

export function PasswordForm() {
  const [state, formAction] = useActionState(updatePassword, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-medium border border-emerald-200">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
          Password Baru
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={64}
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
          title="Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial."
          placeholder="Min. 8 karakter, kombinasi lengkap"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
          Konfirmasi Password Baru
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          maxLength={64}
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
          title="Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial."
          placeholder="Ulangi password baru"
        />
      </div>

      <SubmitButton pendingText="Mengubah..." className="w-full !rounded-xl !py-3 !bg-gray-900 hover:!bg-gray-800">
        Ubah Password
      </SubmitButton>
    </form>
  )
}
