'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, FileText, User, Award, CreditCard, FileCheck } from 'lucide-react'
import CoachOnboardingForm from '@/components/onboarding/CoachOnboardingForm'

export default function EditarPerfilCoachPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [coach, setCoach] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    cargarDatosCoach()
  }, [])

  const cargarDatosCoach = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('No hay sesión activa. Por favor inicia sesión.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Obtener datos del coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (coachError) {
        console.error('Error cargando coach:', coachError)
        setError('Error al cargar tus datos. Por favor contacta al administrador.')
        return
      }

      if (!coachData) {
        setError('No se encontró tu perfil. Por favor contacta al administrador.')
        return
      }

      // Verificar que sea un coach pendiente
      if (coachData.estado !== 'pendiente') {
        setError('Tu perfil ya fue procesado. No puedes editarlo.')
        return
      }

      console.log('✅ Coach cargado:', coachData)
      setCoach(coachData)

    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar tus datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleActualizarPerfil = async (formData) => {
    setGuardando(true)
    setMensaje(null)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // Llamar al API para actualizar el perfil
      const response = await fetch('/api/coaches/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          coachId: session.user.id,
          formData: formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar perfil')
      }

      setMensaje({
        tipo: 'success',
        texto: '✅ Perfil actualizado exitosamente. El equipo revisará tus cambios.'
      })

      // Recargar datos
      setTimeout(() => {
        cargarDatosCoach()
      }, 2000)

    } catch (error) {
      console.error('Error actualizando perfil:', error)
      setMensaje({
        tipo: 'error',
        texto: '❌ Error al actualizar: ' + error.message
      })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#AE3F21' }} />
          <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Cargando tu perfil...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
        <div className="max-w-md w-full text-center p-8 rounded-2xl"
          style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
          <AlertCircle size={64} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Error
          </h1>
          <p className="mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Editar Mi Perfil
          </h1>
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Realiza las correcciones solicitadas por el equipo
          </p>
        </div>

        {/* Mensaje de éxito/error */}
        {mensaje && (
          <div 
            className="p-4 rounded-lg mb-6 flex items-center gap-3"
            style={{ 
              background: mensaje.tipo === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${mensaje.tipo === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {mensaje.tipo === 'success' ? (
              <CheckCircle size={24} style={{ color: '#10b981' }} />
            ) : (
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
            )}
            <p style={{ 
              color: mensaje.tipo === 'success' ? '#10b981' : '#ef4444',
              fontFamily: 'Montserrat, sans-serif',
              margin: 0
            }}>
              {mensaje.texto}
            </p>
          </div>
        )}

        {/* Información del estado */}
        <div 
          className="p-6 rounded-xl mb-8"
          style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.2)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <FileCheck size={24} style={{ color: '#AE3F21' }} />
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Estado de tu Solicitud
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User size={18} style={{ color: '#B39A72' }} />
              <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Estado: <strong style={{ color: '#FFFCF3' }}>{coach.estado}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={18} style={{ color: '#B39A72' }} />
              <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Categoría: <strong style={{ color: '#FFFCF3' }}>{coach.categoria}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        <div 
          className="rounded-2xl p-6"
          style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}
        >
          <CoachOnboardingForm 
            initialData={coach}
            onSubmit={handleActualizarPerfil}
            isEditing={true}
            loading={guardando}
          />
        </div>

        {/* Ayuda */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            ¿Necesitas ayuda? Contacta al equipo de {process.env.STUDIO_NAME || 'Strive Studio'}
          </p>
        </div>
      </div>
    </div>
  )
}
