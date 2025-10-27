'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'

// ✅ Componente interno que usa useSearchParams
function LoginForm() {
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

  // Obtener parámetros de URL
  const redirectUrl = searchParams?.get('redirect')
  const emailFromUrl = searchParams?.get('email')

  useEffect(() => {
    // Pre-llenar email si viene en la URL
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailFromUrl) }))
    }
  }, [emailFromUrl])

  useEffect(() => {
    if (!userLoading) {
      if (profile) {
        // Ya hay sesión activa - verificar estado si es coach
        handleRedirect(profile)
      } else {
        setCheckingSession(false)
      }
    }
  }, [profile, userLoading, redirectUrl, router])

  // ✅ NUEVA FUNCIÓN: Maneja redirección verificando estado del coach
  const handleRedirect = async (profileData) => {
    try {
      // Si hay redirectUrl específico, usarlo
      if (redirectUrl) {
        router.push(redirectUrl)
        return
      }

      // Si es coach, verificar estado ANTES de redirigir
      if (profileData.rol === 'coach') {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        const { data: coachData } = await supabase
          .from('coaches')
          .select('estado, activo')
          .eq('id', profileData.id)
          .single()

        console.log('🔍 Verificando estado del coach:', coachData)

        // Si está pendiente, rechazado o inactivo → /coach/pendiente
        if (
          coachData && 
          (coachData.estado === 'pendiente' || 
           coachData.estado === 'rechazado' || 
           !coachData.activo)
        ) {
          console.log('⚠️ Coach no aprobado, redirigiendo a /coach/pendiente')
          router.push('/coach/pendiente')
          return
        }

        // Si está activo, ir a su dashboard
        console.log('✅ Coach aprobado, redirigiendo a /coach/clases')
        router.push('/coach/clases')
        return
      }

      // Para otros roles, redirección normal
      const targetUrl = getRedirectUrl(profileData.rol)
      console.log('✅ Redirigiendo a:', targetUrl)
      router.push(targetUrl)

    } catch (error) {
      console.error('Error en redirección:', error)
      // Fallback a redirección por rol
      const targetUrl = getRedirectUrl(profileData.rol)
      router.push(targetUrl)
    }
  }

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

      console.log('✅ Login exitoso, perfil:', profile.rol)

      // Setear caché ANTES de redirigir para carga instantánea
      queryClient.setQueryData(['user'], {
        user: authData.user,
        profile
      })

      // ✅ NUEVA LÓGICA: Verificar estado del coach antes de redirigir
      await handleRedirect(profile)

    } catch (error) {
      console.error('Error en login:', error)
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

  // Skeleton simple mientras verifica sesión
  if (checkingSession) {
    return (
      <Card>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
          <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
          <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
          <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Mostrar mensaje si viene de correcciones */}
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

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Iniciar Sesión
          </h2>
          <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {errors.general && (
          <div className="p-4 rounded-xl flex items-start gap-3" 
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
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
            setErrors({ ...errors, email: '', general: '' })
          }}
          placeholder="tu@email.com"
          error={errors.email}
        />

        <div>
          <Input
            label="Contraseña"
            icon={Lock}
            type="password"
            required
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value })
              setErrors({ ...errors, password: '', general: '' })
            }}
            placeholder="••••••••"
            error={errors.password}
          />
          <Link 
            href="/recuperar" 
            className="text-xs transition-all hover:opacity-80 inline-block mt-2" 
            style={{ color: '#B39A72' }}
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
  )
}

// ✅ Componente principal con Suspense boundary
export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <Card>
          <div className="space-y-6 animate-pulse">
            <div className="h-8 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
            <div className="h-12 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)' }}></div>
          </div>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
