'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ 
  label, 
  icon: Icon, // Aceptamos pero no usamos
  error, 
  required,
  type = 'text',
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm md:text-base font-medium mb-2 md:mb-3 opacity-90" 
          style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {label} 
          {required && <span style={{ color: '#AE3F21' }}> *</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={`
            w-full 
            pl-4 md:pl-5
            ${isPassword ? 'pr-10 md:pr-12' : 'pr-4 md:pr-5'} 
            py-3 md:py-4 
            rounded-xl 
            focus:outline-none 
            transition-all 
            text-sm md:text-base
          `}
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${error ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)'}`,
            color: '#FFFCF3',
            fontFamily: 'Montserrat, sans-serif'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? '#AE3F21' : '#AE3F21'
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)'
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity z-10 p-1"
            style={{ color: '#B39A72' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-xs md:text-sm flex items-center gap-1.5 animate-fadeIn" 
          style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}