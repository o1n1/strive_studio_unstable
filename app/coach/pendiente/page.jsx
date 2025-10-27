'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, AlertTriangle, LogOut, Mail, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function CoachPendientePage() {
  const router = useRouter()
  const [coach, setCoach] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadoCoach()
    
    // Revisar estado cada 30 segundos
    const interval = setInterval(cargarEstadoCoach, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargarEstadoCoach = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Cargar profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)

      // Cargar datos del coach
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setCoach(coachData)

      // Si coach fue aprobado, redirigir al dashboard
      if (coachData?.estado === 'activo' && coachData?.activo === true) {
        router.push('/coach/dashboard')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0A0A' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#AE3F21' }}></div>
      </div>
    )
  }

  const getEstadoConfig = () => {
    if (coach?.estado === 'rechazado') {
      return {
        icon: XCircle,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        title: 'Solicitud Rechazada',
        mensaje: 'Lamentablemente tu solicitud no fue aprobada.',
        submensaje: 'Si tienes dudas, contacta al administrador.'
      }
    }
    
    if (coach?.estado === 'pendiente') {
      return {
        icon: Clock,
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.1)',
        title: 'Solicitud en Revisión',
        mensaje: 'Tu solicitud está siendo revisada por nuestro equipo.',
        submensaje: 'Te notificaremos por correo cuando tengamos una respuesta.'
      }
    }

    return {
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: 'Cuenta Inactiva',
      mensaje: 'Tu cuenta no está activa en este momento.',
      submensaje: 'Contacta al administrador para más información.'
    }
  }

  const estado = getEstadoConfig()
  const IconoEstado = estado.icon

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0A0A0A' }}
    >
      <div 
        className="max-w-2xl w-full rounded-2xl p-8 md:p-12 border"
        style={{ 
          background: 'rgba(53, 53, 53, 0.3)',
          borderColor: 'rgba(156, 122, 94, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: estado.bg }}
          >
            <IconoEstado size={48} style={{ color: estado.color }} />
          </div>
          
          <h1 
            className="text-3xl font-bold mb-3"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            {estado.title}
          </h1>
          
          <p 
            className="text-lg mb-2"
            style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            {estado.mensaje}
          </p>
          
          <p 
            className="text-sm"
            style={{ color: '#9C7A5E', fontFamily: 'Montserrat, sans-serif' }}
          >
            {estado.submensaje}
          </p>
        </div>

        {/* Info del Coach */}
        {profile && (
          <div 
            className="rounded-xl p-6 mb-6"
            style={{ background: 'rgba(255, 252, 243, 0.05)' }}
          >
            <h3 
              className="font-semibold mb-4"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
            >
              Tu Información
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                >
                  {profile.nombre?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#FFFCF3' }}>
                    {profile.nombre} {profile.apellidos}
                  </p>
                  <p className="text-sm" style={{ color: '#B39A72' }}>
                    Coach de Strive Studio
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                <Mail size={16} />
                {profile.email}
              </div>
              
              {profile.telefono && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                  <Phone size={16} />
                  {profile.telefono}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Línea de tiempo */}
        <div 
          className="rounded-xl p-6 mb-6"
          style={{ background: 'rgba(255, 252, 243, 0.05)' }}
        >
          <h3 
            className="font-semibold mb-4"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            Proceso de Aprobación
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} style={{ color: '#10b981' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium" style={{ color: '#FFFCF3' }}>Registro Completado</p>
                <p className="text-sm" style={{ color: '#B39A72' }}>
                  {coach?.created_at ? new Date(coach.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Completado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center ${coach?.estado === 'pendiente' ? 'animate-pulse' : ''}`}
                style={{ background: estado.bg }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ background: estado.color }}
                />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#FFFCF3' }}>Revisión de Documentos</p>
                <p className="text-sm" style={{ color: '#B39A72' }}>
                  {coach?.estado === 'pendiente' ? 'En proceso...' : 
                   coach?.estado === 'rechazado' ? 'No aprobado' : 'Completado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 opacity-50">
              <Clock size={20} style={{ color: '#9C7A5E' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium" style={{ color: '#FFFCF3' }}>Acceso al Sistema</p>
                <p className="text-sm" style={{ color: '#B39A72' }}>Pendiente de aprobación</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div 
          className="rounded-xl p-4 mb-6 border"
          style={{ 
            background: 'rgba(174, 63, 33, 0.05)',
            borderColor: 'rgba(174, 63, 33, 0.2)'
          }}
        >
          <p className="text-sm text-center" style={{ color: '#B39A72' }}>
            ¿Tienes preguntas? Contacta a{' '}
            <a 
              href="mailto:admin@strivestudio.com"
              className="font-semibold hover:underline"
              style={{ color: '#AE3F21' }}
            >
              admin@strivestudio.com
            </a>
          </p>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
          style={{ 
            background: 'rgba(156, 122, 94, 0.2)',
            color: '#B39A72',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}