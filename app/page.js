'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { profile, loading: userLoading } = useUser()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // ✅ NUEVO: Obtener parámetros de URL
  const redirectUrl = searchParams?.get('redirect')
  const emailFromUrl = searchParams?.get('email')

  useEffect(() => {
    // ✅ NUEVO: Pre-llenar email si viene en la URL
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailFromUrl) }))
    }
  }, [emailFromUrl])

  useEffect(() => {
    if (!userLoading) {
      if (profile) {
        // Ya hay sesión activa
        // ✅ NUEVO: Si hay redirect, ir ahí, sino a su dashboard
        const targetUrl = redirectUrl || getRedirectUrl(profile.rol)
        router.push(targetUrl)
      } else {
        setCheckingSession(false)
      }
    }
  }, [profile, userLoading, redirectUrl])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validaciones
    if (!formData.email.trim()) {
      setErrors({ email: 'El email es requerido' })
      setLoading(false)
      return
    }

    if (!formData.password) {
      setErrors({ password: 'La contraseña es requerida' })
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      })

      if (authError) {
        setErrors({ general: 'Credenciales incorrectas' })
        return
      }

      if (!authData.user) {
        setErrors({ general: 'No se pudo iniciar sesión' })
        return
      }

      // Obtener perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setErrors({ general: 'Error al obtener perfil de usuario' })
        return
      }

      // Setear caché ANTES de redirigir para carga instantánea
      queryClient.setQueryData(['user'], {
        user: authData.user,
        profile
      })

      // ✅ MEJORA: Si hay redirectUrl, ir ahí, sino al dashboard según rol
      const targetUrl = redirectUrl || getRedirectUrl(profile.rol)
      
      console.log('✅ Login exitoso, redirigiendo a:', targetUrl)
      router.push(targetUrl)

    } catch (error) {
      let errorMessage = 'Error al iniciar sesión. Intenta de nuevo.'
      
      if (error.isTimeout) {
        errorMessage = 'La solicitud tardó demasiado. Verifica tu conexión a internet.'
      } else if (error.isNetworkError) {
        errorMessage = 'Error de conexión. Verifica tu internet.'
      }
      
      setErrors({ general: errorMessage })
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

  // ✅ NUEVO: Skeleton simple sin componente externo
  if (checkingSession) {
    return (
      <AuthLayout>
        <Card>
          <div className="space-y-6 animate-pulse">
            <div className="h-8 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
          </div>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ NUEVO: Mostrar mensaje si viene de correcciones */}
          {redirectUrl === '/coach/editar-perfil' && (
            <div className="p-4 rounded-xl flex items-start gap-3" 
              style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <AlertCircle size={20} style={{ color: '#eab308' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#eab308', fontFamily: 'Montserrat, sans-serif' }}>
                  Correcciones Necesarias
                </p>
                <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Inicia sesión para editar tu perfil y completar las correcciones solicitadas.
                </p>
              </div>
            </div>
          )}
          
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
            disabled={loading}
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
            disabled={loading}
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
                disabled={loading}
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

          <Button type="submit" loading={loading}>
            Iniciar Sesión
          </Button>

          <p className="text-sm text-center opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            ¿Aún no tienes cuenta?{' '}
            <Link 
              href="/registro" 
              className="font-semibold transition-all hover:opacity-80 hover:underline" 
              style={{ color: '#AE3F21' }}
            >
              Regístrate aquí
            </Link>
          </p>
        </form>
      </Card>
    </AuthLayout>
  )
}
