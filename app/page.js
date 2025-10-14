'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
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

    try {
      // Llamar al endpoint API de login con rate limiting
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success) {
        // Redirigir según el rol del usuario
        const redirectUrl = getRedirectUrl(result.profile.rol)
        console.log('🔄 Redirigiendo a:', redirectUrl)
        router.push(redirectUrl)
      } else {
        // Mostrar error
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  // Función para determinar la URL según el rol
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
        return '/cliente/reservas' // Por defecto ir a cliente
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
              <p className="text-sm" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                {errors.general}
              </p>
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
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t opacity-20" style={{ borderColor: '#9C7A5E' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span 
                className="px-4 text-sm opacity-60" 
                style={{ backgroundColor: 'rgba(53, 53, 53, 0.8)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
              >
                ¿Primera vez?
              </span>
            </div>
          </div>

          <Link href="/registro">
            <Button variant="secondary" type="button">
              Crear Cuenta Nueva
            </Button>
          </Link>
        </form>
      </Card>
    </AuthLayout>
  )
}