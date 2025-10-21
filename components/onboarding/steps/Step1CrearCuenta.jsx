'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Step1CrearCuenta({ data, updateData, nextStep }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    // Validar contraseña
    if (!data.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (data.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])/.test(data.password)) {
      newErrors.password = 'Debe contener al menos una minúscula'
    } else if (!/(?=.*[A-Z])/.test(data.password)) {
      newErrors.password = 'Debe contener al menos una mayúscula'
    } else if (!/(?=.*\d)/.test(data.password)) {
      newErrors.password = 'Debe contener al menos un número'
    }

    // Validar confirmación
    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Aquí validaremos que el email no exista en la BD
      // Por ahora solo avanzamos al siguiente paso
      await new Promise(resolve => setTimeout(resolve, 500))
      nextStep()
    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: 'Error al validar datos. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (!data.password) return { text: '', color: '', width: '0%' }
    
    let strength = 0
    if (data.password.length >= 8) strength++
    if (/(?=.*[a-z])/.test(data.password)) strength++
    if (/(?=.*[A-Z])/.test(data.password)) strength++
    if (/(?=.*\d)/.test(data.password)) strength++
    if (/(?=.*[@$!%*?&#])/.test(data.password)) strength++

    if (strength <= 2) return { text: 'Débil', color: '#ef4444', width: '33%' }
    if (strength === 3) return { text: 'Media', color: '#f59e0b', width: '66%' }
    return { text: 'Fuerte', color: '#10b981', width: '100%' }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Crear tu Cuenta
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Configura tu contraseña para acceder al sistema
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type="email"
            value={data.email}
            readOnly
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm cursor-not-allowed"
            style={{
              background: 'rgba(156, 122, 94, 0.1)',
              border: '1px solid rgba(156, 122, 94, 0.3)',
              color: '#B39A72',
              fontFamily: 'Montserrat, sans-serif'
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          Este email fue asignado en tu invitación
        </p>
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Contraseña *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            className="w-full pl-12 pr-12 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.password ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            style={{ color: '#B39A72' }}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Indicador de fuerza */}
        {data.password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: passwordStrength.color, fontFamily: 'Montserrat, sans-serif' }}>
                {passwordStrength.text}
              </span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ width: passwordStrength.width, background: passwordStrength.color }}
              />
            </div>
          </div>
        )}

        {errors.password && (
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle size={16} style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              {errors.password}
            </p>
          </div>
        )}

        {/* Requisitos */}
        <div className="mt-3 space-y-1">
          <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
            La contraseña debe contener:
          </p>
          <ul className="text-xs space-y-1 ml-4" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
            <li className={data.password?.length >= 8 ? 'text-green-500' : ''}>
              • Al menos 8 caracteres
            </li>
            <li className={/(?=.*[a-z])/.test(data.password) ? 'text-green-500' : ''}>
              • Una letra minúscula
            </li>
            <li className={/(?=.*[A-Z])/.test(data.password) ? 'text-green-500' : ''}>
              • Una letra mayúscula
            </li>
            <li className={/(?=.*\d)/.test(data.password) ? 'text-green-500' : ''}>
              • Un número
            </li>
          </ul>
        </div>
      </div>

      {/* Confirmar Contraseña */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Confirmar Contraseña *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={data.confirmPassword}
            onChange={(e) => updateData({ confirmPassword: e.target.value })}
            className="w-full pl-12 pr-12 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="Confirma tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            style={{ color: '#B39A72' }}>
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {errors.confirmPassword && (
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle size={16} style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              {errors.confirmPassword}
            </p>
          </div>
        )}

        {data.password && data.confirmPassword && data.password === data.confirmPassword && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#10b981' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xs" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              Las contraseñas coinciden
            </p>
          </div>
        )}
      </div>

      {/* Error de submit */}
      {errors.submit && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            {errors.submit}
          </p>
        </div>
      )}

      {/* Botón */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {loading ? 'Validando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}
