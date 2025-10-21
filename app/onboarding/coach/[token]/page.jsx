'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function CoachOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invitacion, setInvitacion] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    verificarToken()
  }, [params.token])

  const verificarToken = async () => {
    try {
      console.log('🔍 Verificando token:', params.token)

      // Llamar a API que usa Service Role Key
      const response = await fetch('/api/coaches/verify-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: params.token })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Error al verificar:', data.error)
        setError(data.error || 'Token inválido o expirado')
        setLoading(false)
        return
      }

      console.log('✅ Invitación válida:', data.invitacion)
      setInvitacion(data.invitacion)
      setLoading(false)

    } catch (error) {
      console.error('💥 Error:', error)
      setError('Error al verificar la invitación')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#AE3F21' }} />
          <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Verificando invitación...
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
            Invitación No Válida
          </h1>
          <p className="mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            {error}
          </p>
          <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Si crees que esto es un error, contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      <div className="max-w-2xl w-full p-8 rounded-2xl"
        style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircle size={64} className="mx-auto mb-4" style={{ color: '#10b981' }} />
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            ¡Bienvenido a Strive Studio!
          </h1>
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Has sido invitado como coach de <strong>{invitacion?.categoria}</strong>
          </p>
        </div>

        {/* Info */}
        <div className="space-y-4 mb-8">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
            <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <strong>Email:</strong> {invitacion?.email}
            </p>
            <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <strong>Categoría:</strong> {invitacion?.categoria}
            </p>
            <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <strong>Expira:</strong> {new Date(invitacion?.expira_en).toLocaleDateString()}
            </p>
          </div>

          {invitacion?.mensaje_personalizado && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                Mensaje del equipo:
              </p>
              <p className="text-sm italic" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                "{invitacion.mensaje_personalizado}"
              </p>
            </div>
          )}
        </div>

        {/* Siguiente Paso */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Próximos Pasos
          </h2>
          <div className="space-y-3 text-left mb-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontWeight: 'bold' }}>
                1
              </div>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Crea tu cuenta con este email
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontWeight: 'bold' }}>
                2
              </div>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Completa tu perfil profesional
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontWeight: 'bold' }}>
                3
              </div>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Sube tus documentos y certificaciones
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontWeight: 'bold' }}>
                4
              </div>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Espera la aprobación del equipo
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/registro?email=${encodeURIComponent(invitacion?.email)}&token=${params.token}`)}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Comenzar Registro →
          </button>
        </div>
      </div>
    </div>
  )
}
