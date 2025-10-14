'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [errors, setErrors] = useState({})

  // Verificar sesión existente al cargar
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('rol')
            .eq('id', session.user.id)
            .single()
          
          if (profile && !error) {
            // Setear caché antes de redirigir para carga instantánea
            queryClient.setQueryData(['user'], {
              user: session.user,
              profile
            })
            
            const redirectUrl = getRedirectUrl(profile.rol)
            router.push(redirectUrl)
            return
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
      } finally {
        setCheckingSession(false)
      }
    }
    
    checkExistingSession()
  }, [router, queryClient])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Login con Supabase
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

      // 🚀 MEJORA: Setear caché ANTES de redirigir para carga instantánea
      queryClient.setQueryData(['user'], {
        user: authData.user,
        profile
      })

      const redirectUrl = getRedirectUrl(profile.rol)
      router.push(redirectUrl)

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

  if (checkingSession) {
    return (
      <AuthLayout>
        <Card>
          <div className="text-center py-8">
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Verificando sesión...
            </p>
          </div>
        </Card>
      </AuthLayout>
    )
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
            <Button variant="secondary" type="button" disabled={loading}>
              Crear Cuenta Nueva
            </Button>
          </Link>
        </form>
      </Card>
    </AuthLayout>
  )
}