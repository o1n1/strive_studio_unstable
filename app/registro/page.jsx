'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import CoachOnboardingForm from '@/components/onboarding/CoachOnboardingForm'

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [invitacion, setInvitacion] = useState(null)
  const [error, setError] = useState(null)

  const email = searchParams.get('email')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!email || !token) {
      setError('Parámetros faltantes. Por favor usa el link de invitación.')
      setLoading(false)
      return
    }

    verificarInvitacion()
  }, [email, token])

  const verificarInvitacion = async () => {
    try {
      const response = await fetch('/api/coaches/verify-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Token inválido')
        setLoading(false)
        return
      }

      setInvitacion(data.invitacion)
      setLoading(false)
    } catch (err) {
      console.error('Error verificando invitación:', err)
      setError('Error al verificar invitación')
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
          <p className="text-xl mb-4" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      <CoachOnboardingForm invitacion={invitacion} token={token} />
    </div>
  )
}
