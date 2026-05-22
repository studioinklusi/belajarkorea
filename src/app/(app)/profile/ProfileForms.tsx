'use client'

import { useActionState } from 'react'
import { updateProfile, sendPasswordResetEmail } from './actions'
import { SubmitButton } from '@/components/SubmitButton'
import { FaEnvelope, FaShieldHalved } from 'react-icons/fa6'

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

export function ResetPasswordButton({ email }: { email: string }) {
  const [state, formAction] = useActionState(sendPasswordResetEmail, null)

  return (
    <div className="space-y-4">
      {state?.error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-medium border border-emerald-200 flex items-start gap-2">
          <FaEnvelope className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{state.success}</span>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <FaShieldHalved className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-800 mb-1">Kenapa harus lewat email?</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Demi keamanan akun Anda, perubahan password hanya bisa dilakukan melalui link yang dikirim ke email terdaftar (<strong>{email}</strong>). Ini mencegah orang lain mengganti password tanpa sepengetahuan Anda.
          </p>
        </div>
      </div>

      <form action={formAction}>
        <SubmitButton pendingText="Mengirim..." className="w-full !rounded-xl !py-3 !bg-gray-900 !text-white hover:!bg-gray-800">
          <FaEnvelope className="w-4 h-4 shrink-0" />
          <span>Kirim Link Ubah Password ke Email</span>
        </SubmitButton>
      </form>
    </div>
  )
}
