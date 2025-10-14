'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          className="w-full px-4 pr-12 py-3.5 rounded-xl focus:outline-none transition-all"
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

      {error && (
        <p className="text-xs mt-1.5" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
          {error}
        </p>
      )}

      {showStrength && props.value && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: i < strength ? strengthColors[strength - 1] : 'rgba(156, 122, 94, 0.2)'
                }}
              />
            ))}
          </div>
          {strength > 0 && (
            <p className="text-xs" style={{ color: strengthColors[strength - 1], fontFamily: 'Montserrat, sans-serif' }}>
              {strengthLabels[strength - 1]}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
