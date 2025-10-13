'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ 
  label = 'Contraseña',
  error, 
  required, 
  showStrength = false,
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [strength, setStrength] = useState(0)

  const calculateStrength = (pass) => {
    let score = 0
    if (pass.length >= 8) score++
    if (/[a-z]/.test(pass)) score++
    if (/[A-Z]/.test(pass)) score++
    if (/\d/.test(pass)) score++
    if (/[@$!%*?&#]/.test(pass)) score++
    return score
  }

  const handleChange = (e) => {
    const value = e.target.value
    if (showStrength) {
      setStrength(calculateStrength(value))
    }
    props.onChange?.(e)
  }

  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981']
  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']

  return (
    <div className="w-full">
      <label className="flex items-center gap-2 text-sm font-medium mb-2 opacity-90" 
        style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
        {label} 
        {required && <span style={{ color: '#AE3F21' }}>*</span>}
      </label>
      
      <div className="relative">
        <Lock 
          size={20} 
          className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" 
          style={{ color: error ? '#AE3F21' : '#B39A72' }} 
        />
        
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl focus:outline-none transition-all"
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

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: '#B39A72' }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && props.value && (
        <div className="mt-2 animate-fadeIn">
          <div className="flex gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < strength ? strengthColors[strength - 1] : 'rgba(156, 122, 94, 0.2)'
                }}
              />
            ))}
          </div>
          {strength > 0 && (
            <p className="text-xs mt-1" style={{ 
              color: strengthColors[strength - 1],
              fontFamily: 'Montserrat, sans-serif' 
            }}>
              {strengthLabels[strength - 1]}
            </p>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1.5 text-sm flex items-center gap-1 animate-fadeIn" 
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