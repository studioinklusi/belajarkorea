'use client'

import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'

interface PasswordInputProps {
  id: string
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
}

export function PasswordInput({ id, name, placeholder, required, minLength, autoComplete }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        tabIndex={-1}
      >
        {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
      </button>
    </div>
  )
}
