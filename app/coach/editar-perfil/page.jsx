'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, AlertCircle, Loader2, 
  ArrowLeft, Shield
} from 'lucide-react'
import EditarPerfilForm from '@/components/coach/EditarPerfilForm'
import { supabase } from '@/lib/supabase/client'

export default function EditarPerfilCoachPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [coach, setCoach] = useState(null)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    cargarDatosCoach()
  }, [])

  const cargarDatosCoach = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos del coach...')

      // Obtener sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Debes iniciar sesión para acceder a esta página.')
        router.push('/login')
        return
      }

      const userId = session.user.id
      console.log('👤 User ID:', userId)

      // Verificar si es admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', userId)
        .single()

      if (profileData?.rol === 'admin') {
        setEsAdmin(true)
        console.log('🔑 Usuario es admin')
      }

      // Cargar datos completos del coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', userId)
        .single()

      if (coachError) {
        console.error('❌ Error cargando coach:', coachError)
        setError('Error al cargar tus datos. Por favor contacta al administrador.')
        return
      }

      if (!coachData) {
        setError('No se encontró tu perfil de coach. Por favor contacta al administrador.')
        return
      }

      console.log('✅ Coach cargado:', coachData.nombre)
      console.log('📊 Estado:', coachData.estado)
      setCoach(coachData)

    } catch (error) {
      console.error('❌ Error:', error)
      setError('Error al cargar tus datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleActualizarPerfil = async (formData) => {
    setGuardando(true)
    setMensaje(null)

    try {
      console.log('💾 Guardando cambios...')

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

      const result = await response.json()

      setMensaje({
        tipo: 'success',
        texto: result.message
      })

      console.log('✅ Perfil actualizado:', result)

      // Mostrar info adicional si hay cambios pendientes
      if (result.cambios_pendientes > 0) {
        setTimeout(() => {
          setMensaje({
            tipo: 'info',
            texto: `✅ ${result.cambios_aplicados} cambios guardados. ${result.cambios_pendientes} cambios están pendientes de aprobación del admin.`
          })
        }, 3000)
      }

      // Recargar datos después de 3 segundos
      setTimeout(() => {
        cargarDatosCoach()
        setMensaje(null)
      }, 5000)

    } catch (error) {
      console.error('❌ Error actualizando perfil:', error)
      setMensaje({
        tipo: 'error',
        texto: '❌ Error al actualizar: ' + error.message
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleVolver = () => {
    if (esAdmin) {
      router.push('/admin/coaches')
    } else {
      router.push('/coach/dashboard')
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

  if (!coach) {
    return null
  }

  const esCoachPendiente = coach.estado === 'pendiente'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleVolver}
            className="flex items-center gap-2 px-4 py-2 rounded-lg mb-4 transition-all hover:opacity-80"
            style={{ 
              background: 'rgba(179, 154, 114, 0.1)', 
              color: '#B39A72',
              fontFamily: 'Montserrat, sans-serif'
            }}>
            <ArrowLeft size={18} />
            Volver
          </button>

          <h1 className="text-3xl md:text-4xl font-bold mb-2" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Editar Mi Perfil
          </h1>
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            {esCoachPendiente 
              ? 'Completa o edita tu información antes de la aprobación'
              : 'Actualiza tu información profesional y de contacto'
            }
          </p>
        </div>

        {/* Mensaje de éxito/error/info */}
        {mensaje && (
          <div 
            className="p-4 rounded-lg mb-6 flex items-start gap-3"
            style={{ 
              background: mensaje.tipo === 'success' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : mensaje.tipo === 'error'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${
                mensaje.tipo === 'success' 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : mensaje.tipo === 'error'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(59, 130, 246, 0.3)'
              }`
            }}>
            {mensaje.tipo === 'success' ? (
              <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            ) : mensaje.tipo === 'error' ? (
              <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
            )}
            <p style={{ 
              color: mensaje.tipo === 'success' 
                ? '#10b981' 
                : mensaje.tipo === 'error'
                  ? '#ef4444'
                  : '#3b82f6',
              fontFamily: 'Montserrat, sans-serif',
              margin: 0,
              flex: 1
            }}>
              {mensaje.texto}
            </p>
          </div>
        )}

        {/* Estado del Coach */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ 
            background: coach.estado === 'pendiente' 
              ? 'rgba(251, 191, 36, 0.1)' 
              : 'rgba(16, 185, 129, 0.1)', 
            border: `1px solid ${
              coach.estado === 'pendiente' 
                ? 'rgba(251, 191, 36, 0.3)' 
                : 'rgba(16, 185, 129, 0.3)'
            }`
          }}>
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ 
              color: coach.estado === 'pendiente' ? '#fbbf24' : '#10b981' 
            }} />
            <div>
              <p className="font-bold" style={{ 
                color: coach.estado === 'pendiente' ? '#fbbf24' : '#10b981',
                fontFamily: 'Montserrat, sans-serif'
              }}>
                Estado: {coach.estado === 'pendiente' ? 'Pendiente de Aprobación' : 'Activo'}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {esCoachPendiente 
                  ? 'Puedes editar todos los campos libremente hasta que seas aprobado'
                  : 'Algunos campos requieren aprobación del admin para cambios'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Información sobre campos protegidos (solo para coaches activos) */}
        {!esCoachPendiente && !esAdmin && (
          <div 
            className="p-4 rounded-xl mb-6"
            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <p className="text-sm" style={{ color: '#3b82f6', fontFamily: 'Montserrat, sans-serif' }}>
              ℹ️ Los campos marcados con "Cambio requiere aprobación" serán enviados al admin para su revisión antes de actualizarse.
            </p>
          </div>
        )}

        {/* Formulario de Edición */}
        <div 
          className="rounded-2xl p-6"
          style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
          <EditarPerfilForm
            initialData={coach}
            onSubmit={handleActualizarPerfil}
            loading={guardando}
            esCoachPendiente={esCoachPendiente}
            esAdmin={esAdmin}
          />
        </div>

        {/* Footer de ayuda */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            ¿Necesitas ayuda? Contacta al equipo de Strive Studio
          </p>
        </div>
      </div>
    </div>
  )
}
