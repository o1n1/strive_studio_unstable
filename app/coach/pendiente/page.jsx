'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, FileText, Mail, LogOut, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function CoachPendientePage() {
  const router = useRouter()
  const [coach, setCoach] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Cargar datos del coach
      const { data: coachData } = await supabase
        .from('coaches')
        .select(`
          *,
          profiles!inner(nombre, apellidos, email, avatar_url)
        `)
        .eq('id', session.user.id)
        .single()

      if (!coachData) {
        router.push('/login')
        return
      }

      setCoach({
        ...coachData,
        nombre: coachData.profiles.nombre,
        apellidos: coachData.profiles.apellidos,
        email: coachData.profiles.email,
        avatar_url: coachData.profiles.avatar_url
      })

      // Cargar documentos si hay correcciones
      if (coachData.estado === 'rechazado' || coachData.estado === 'pendiente') {
        const { data: docs } = await supabase
          .from('coach_documents')
          .select('*')
          .eq('coach_id', session.user.id)
          .order('fecha_subida', { ascending: false })
        
        setDocumentos(docs || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#AE3F21' }} />
          <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  const documentosRechazados = documentos.filter(d => d.notas && !d.verificado)
  const estadoPendiente = coach?.estado === 'pendiente'
  const estadoRechazado = coach?.estado === 'rechazado' || !coach?.activo

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ 
                background: coach?.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)', 
                color: '#AE3F21',
                backgroundImage: coach?.avatar_url ? `url(${coach.avatar_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
              {!coach?.avatar_url && (coach?.nombre?.[0] || 'C')}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            {coach?.nombre} {coach?.apellidos}
          </h1>
          
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            {coach?.email}
          </p>
        </div>

        {/* Card Principal */}
        <div className="rounded-2xl p-8 mb-6"
          style={{ background: 'rgba(255, 252, 243, 0.03)', border: '1px solid rgba(179, 154, 114, 0.1)' }}>
          
          {/* Estado Pendiente */}
          {estadoPendiente && (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                  <Clock size={32} style={{ color: '#fbbf24' }} />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Solicitud en Revisión
                  </h2>
                  <p className="text-lg mb-4"
                    style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Tu solicitud está siendo revisada por el equipo administrativo de Strive Studio.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
                  <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Hemos recibido tu información y documentación
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={20} style={{ color: '#fbbf24', marginTop: '2px' }} />
                  <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Nuestro equipo está verificando tus credenciales
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={20} style={{ color: '#B39A72', marginTop: '2px' }} />
                  <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Te notificaremos por email cuando tu cuenta sea aprobada
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg mb-6"
                style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <p className="text-sm"
                  style={{ color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' }}>
                  💡 <strong>Tiempo estimado:</strong> La revisión suele tardar entre 24-48 horas hábiles.
                </p>
              </div>
            </>
          )}

          {/* Estado Rechazado */}
          {estadoRechazado && (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle size={32} style={{ color: '#ef4444' }} />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Se Requieren Correcciones
                  </h2>
                  <p className="text-lg"
                    style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Tu solicitud necesita algunas correcciones antes de ser aprobada.
                  </p>
                </div>
              </div>

              {/* Notas internas (motivo del rechazo) */}
              {coach?.notas_internas && (
                <div className="p-4 rounded-lg mb-6"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p className="font-semibold mb-2"
                    style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    📋 Comentarios del Administrador:
                  </p>
                  <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.notas_internas}
                  </p>
                </div>
              )}

              {/* Documentos rechazados */}
              {documentosRechazados.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Documentos que requieren corrección:
                  </h3>
                  <div className="space-y-3">
                    {documentosRechazados.map(doc => (
                      <div key={doc.id}
                        className="p-3 rounded-lg"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div className="flex items-start gap-2 mb-2">
                          <FileText size={18} style={{ color: '#ef4444', marginTop: '2px' }} />
                          <p className="font-semibold"
                            style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                            {doc.tipo_documento}
                          </p>
                        </div>
                        <p className="text-sm"
                          style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {doc.notas}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg mb-6"
                style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
                <p className="text-sm"
                  style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  📧 <strong>Próximo paso:</strong> Hemos enviado un email a {coach?.email} con instrucciones detalladas para realizar las correcciones necesarias.
                </p>
              </div>
            </>
          )}

          {/* Contacto */}
          <div className="pt-6 border-t"
            style={{ borderColor: 'rgba(179, 154, 114, 0.1)' }}>
            <p className="text-sm text-center mb-4"
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Si tienes preguntas, contáctanos a <strong>strive.studio99@gmail.com</strong>
            </p>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="text-center">
          <button
            onClick={handleCerrarSesion}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 mx-auto"
            style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
