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
    console.log('🔵 [DEBUG] Iniciando handleSubmit')
    
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
      console.log('❌ [DEBUG] Errores de validación:', newErrors)
      setErrors(newErrors)
      return
    }

    console.log('✅ [DEBUG] Validaciones pasaron, haciendo fetch...')
    setLoading(true)

    try {
      console.log('📡 [DEBUG] Enviando request a /api/login')
      
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

      console.log('📊 [DEBUG] Response status:', response.status)
      
      const result = await response.json()
      console.log('📦 [DEBUG] Result completo:', result)

      if (result.success) {
        console.log('✅ [DEBUG] Login exitoso!')
        console.log('👤 [DEBUG] Usuario:', result.user?.id)
        console.log('🎭 [DEBUG] Perfil:', result.profile)
        console.log('🎯 [DEBUG] Rol:', result.profile?.rol)
        
        const redirectUrl = getRedirectUrl(result.profile.rol)
        console.log('🔄 [DEBUG] Redirigiendo a:', redirectUrl)
        
        router.push(redirectUrl)
        console.log('✅ [DEBUG] router.push ejecutado')
      } else {
        console.log('❌ [DEBUG] Login falló:', result.error)
        setErrors({ general: result.error })
      }
    } catch (error) {
      console.error('💥 [DEBUG] Error en catch:', error)
      console.error('💥 [DEBUG] Error completo:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      setErrors({ general: 'Error inesperado. Intenta de nuevo.' })
    } finally {
      console.log('🏁 [DEBUG] Finally ejecutado, setLoading(false)')
      setLoading(false)
    }
  }

  const getRedirectUrl = (rol) => {
    console.log('🎯 [DEBUG] getRedirectUrl llamado con rol:', rol)
    
    let url
    switch (rol) {
      case 'admin':
        url = '/admin/dashboard'
        break
      case 'coach':
        url = '/coach/clases'
        break
      case 'cliente':
        url = '/cliente/reservas'
        break
      case 'staff':
        url = '/staff/checkin'
        break
      default:
        url = '/cliente/reservas'
    }
    
    console.log('🎯 [DEBUG] URL calculada:', url)
    return url
  }

  return (
    <AuthLayout>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          
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