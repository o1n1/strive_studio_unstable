'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { loginUser, resendVerificationEmail } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    
    const result = await resendVerificationEmail(formData.email)
    
    if (result.success) {
      setResendSuccess(true)
    } else {
      setErrors({ general: 'Error al reenviar email. Intenta de nuevo.' })
    }
    
    setResendLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setNeedsVerification(false)

    try {
      const result = await loginUser(formData.email, formData.password)

      if (result.success) {
        const redirectUrl = getRedirectUrl(result.profile.rol)
        router.push(redirectUrl)
      } else {
        // Si necesita verificación, mostrar opción
        if (result.needsVerification) {
          setNeedsVerification(true)
        }
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const getRedirectUrl = (rol) => {
    switch (rol) {
      case 'admin':
        return '/admin/dashboard'
      case 'coach':
        return '/coach/clases'
      case 'cliente':
        return '/cliente/reservas'
      case 'staff':
        return '/staff/checkin'
      default:
        return '/cliente/reservas'
    }
  }

  return (
    <AuthLayout>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mensaje de error general */}
          {errors.general && (
            <div className="p-4 rounded-xl" 
              style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#AE3F21' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {errors.general}
                  </p>
                  
                  {/* Botón para reenviar email de verificación */}
                  {needsVerification && !resendSuccess && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                      className="mt-3 text-sm font-medium underline hover:no-underline transition-all"
                      style={{ color: '#AE3F21' }}
                    >
                      {resendLoading ? 'Reenviando...' : 'Reenviar email de verificación'}
                    </button>
                  )}

                  {/* Mensaje de éxito */}
                  {resendSuccess && (
                    <p className="mt-3 text-sm" style={{ color: '#2D5016' }}>
                      ✓ Email reenviado. Revisa tu bandeja de entrada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Input
            label="Email"
            icon={Mail}
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
              setErrors({ ...errors, email: '' })
            }}
            placeholder="tu@email.com"
            error={errors.email}
          />

          <Input
            label="Contraseña"
            icon={Lock}
            type="password"
            required
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value })
              setErrors({ ...errors, password: '' })
            }}
            placeholder="••••••••"
            error={errors.password}
          />

          <div className="flex items-center justify-between text-sm pt-1">
            <label 
              className="flex items-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity" 
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
            >
              <input 
                type="checkbox" 
                className="mr-2 rounded" 
                style={{ accentColor: '#AE3F21' }} 
              />
              Recordarme
            </label>
            <Link 
              href="/recuperar" 
              className="transition-colors hover:underline opacity-80 hover:opacity-100" 
              style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="pt-3">
            <Button type="submit" loading={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm opacity-80" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="font-semibold transition-colors hover:underline" style={{ color: '#AE3F21' }}>
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </AuthLayout>
  )
}