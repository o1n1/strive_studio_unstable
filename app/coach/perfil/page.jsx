'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, FileText, AlertTriangle, CheckCircle, Upload, Mail, Phone, Calendar } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import SubirDocumentosModal from '@/components/coach/SubirDocumentosModal'

export default function CoachPerfilPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('coach')
  
  const [coach, setCoach] = useState(null)
  const [profile, setProfile] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSubirModal, setShowSubirModal] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      cargarDatos()
    }
  }, [isAuthorized])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Cargar profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      // Cargar coach
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setCoach(coachData)

      // Cargar documentos
      const { data: docs } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', session.user.id)
        .order('fecha_subida', { ascending: false })
      setDocumentos(docs || [])

      // Cargar notificaciones no leídas
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('leido', false)
        .order('created_at', { ascending: false })
      setNotificaciones(notifs || [])

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const getTipoLabel = (tipo) => {
    const labels = {
      'ine_frente': 'INE Frente',
      'ine_reverso': 'INE Reverso',
      'comprobante_domicilio': 'Comprobante de Domicilio',
      'titulo_cedula': 'Título/Cédula',
      'antecedentes_penales': 'Antecedentes No Penales',
      'estado_cuenta': 'Estado de Cuenta',
      'otro': 'Otro'
    }
    return labels[tipo] || tipo
  }

  const documentosRechazados = documentos.filter(d => d.notas && !d.verificado)
  const documentosPendientes = documentos.filter(d => !d.verificado && !d.notas)
  const documentosAprobados = documentos.filter(d => d.verificado)

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Mi Perfil
          </h1>
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Información personal y documentos
          </p>
        </div>

        {/* Alertas de Correcciones */}
        {documentosRechazados.length > 0 && (
          <div 
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderColor: 'rgba(239, 68, 68, 0.3)' 
            }}
          >
            <AlertTriangle size={24} style={{ color: '#ef4444' }} className="flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: '#ef4444' }}>
                Correcciones Requeridas
              </h3>
              <p className="text-sm mb-3" style={{ color: '#ef4444', opacity: 0.9 }}>
                Algunos documentos necesitan ser corregidos y vueltos a subir
              </p>
              <button
                onClick={() => setShowSubirModal(true)}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                <Upload size={18} />
                Subir Documentos Corregidos
              </button>
            </div>
          </div>
        )}

        {/* Info Personal */}
        <Card title="Información Personal">
          <div className="flex items-start gap-6 mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ 
                background: profile?.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)', 
                color: '#AE3F21',
                backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!profile?.avatar_url && (profile?.nombre?.charAt(0) || 'C')}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#FFFCF3' }}>
                {profile?.nombre} {profile?.apellidos}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                  <Mail size={16} />
                  {profile?.email}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                  <Phone size={16} />
                  {profile?.telefono || 'No especificado'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {coach?.fecha_nacimiento && (
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>
                  Fecha de Nacimiento
                </label>
                <p style={{ color: '#FFFCF3' }}>
                  {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}
                </p>
              </div>
            )}
            {coach?.años_experiencia && (
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>
                  Años de Experiencia
                </label>
                <p style={{ color: '#FFFCF3' }}>{coach.años_experiencia} años</p>
              </div>
            )}
            {coach?.direccion && (
              <div className="col-span-2">
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>
                  Dirección
                </label>
                <p style={{ color: '#FFFCF3' }}>{coach.direccion}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Estado Solicitud */}
        <Card title="Estado de Solicitud">
          <div className="flex items-center gap-4">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                coach?.estado === 'pendiente' ? 'animate-pulse' : ''
              }`}
              style={{ 
                background: coach?.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 
                           coach?.estado === 'rechazado' ? 'rgba(239, 68, 68, 0.2)' :
                           'rgba(251, 191, 36, 0.2)'
              }}
            >
              {coach?.estado === 'activo' ? (
                <CheckCircle size={32} style={{ color: '#10b981' }} />
              ) : coach?.estado === 'rechazado' ? (
                <AlertTriangle size={32} style={{ color: '#ef4444' }} />
              ) : (
                <FileText size={32} style={{ color: '#fbbf24' }} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: '#FFFCF3' }}>
                {coach?.estado === 'activo' ? 'Aprobado' :
                 coach?.estado === 'rechazado' ? 'Rechazado' :
                 'En Revisión'}
              </h3>
              <p className="text-sm" style={{ color: '#B39A72' }}>
                {coach?.estado === 'activo' ? 'Tu cuenta está activa y puedes impartir clases' :
                 coach?.estado === 'rechazado' ? 'Tu solicitud no fue aprobada. Contacta al administrador.' :
                 'Tu documentación está siendo revisada por el equipo administrativo'}
              </p>
            </div>
          </div>
        </Card>

        {/* Documentos */}
        <Card title="Documentos">
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div 
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <p className="text-2xl font-bold mb-1" style={{ color: '#10b981' }}>
                  {documentosAprobados.length}
                </p>
                <p className="text-xs" style={{ color: '#10b981' }}>Aprobados</p>
              </div>
              <div 
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(251, 191, 36, 0.1)' }}
              >
                <p className="text-2xl font-bold mb-1" style={{ color: '#fbbf24' }}>
                  {documentosPendientes.length}
                </p>
                <p className="text-xs" style={{ color: '#fbbf24' }}>Pendientes</p>
              </div>
              <div 
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <p className="text-2xl font-bold mb-1" style={{ color: '#ef4444' }}>
                  {documentosRechazados.length}
                </p>
                <p className="text-xs" style={{ color: '#ef4444' }}>Rechazados</p>
              </div>
            </div>

            {/* Lista Documentos */}
            {documentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
                <p style={{ color: '#B39A72' }}>No hay documentos subidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.map(doc => (
                  <div 
                    key={doc.id}
                    className="p-4 rounded-lg border"
                    style={{ 
                      background: 'rgba(255, 252, 243, 0.02)',
                      borderColor: doc.verificado 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : doc.notas 
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold" style={{ color: '#FFFCF3' }}>
                            {getTipoLabel(doc.tipo)}
                          </h4>
                          {doc.verificado ? (
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                            >
                              <CheckCircle size={12} />
                              Aprobado
                            </span>
                          ) : doc.notas ? (
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                            >
                              <AlertTriangle size={12} />
                              Requiere Corrección
                            </span>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}
                            >
                              En Revisión
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm" style={{ color: '#B39A72' }}>
                          Subido el {new Date(doc.fecha_subida).toLocaleDateString('es-MX')}
                        </p>

                        {doc.notas && (
                          <div 
                            className="mt-3 p-3 rounded-lg"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                          >
                            <p className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                              Motivo del rechazo:
                            </p>
                            <p className="text-sm" style={{ color: '#ef4444' }}>
                              {doc.notas}
                            </p>
                          </div>
                        )}
                      </div>

                      <a 
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
                        style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                      >
                        Ver
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón Subir */}
            <button
              onClick={() => setShowSubirModal(true)}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{ background: '#AE3F21', color: '#FFFCF3' }}
            >
              <Upload size={20} />
              {documentosRechazados.length > 0 ? 'Subir Documentos Corregidos' : 'Subir Documentos'}
            </button>
          </div>
        </Card>
      </div>

      {/* Modal Subir Documentos */}
      {showSubirModal && (
        <SubirDocumentosModal
          isOpen={showSubirModal}
          onClose={() => setShowSubirModal(false)}
          coachId={coach?.id}
          documentosExistentes={documentos}
          onSuccess={() => {
            setShowSubirModal(false)
            cargarDatos()
          }}
        />
      )}
    </DashboardLayout>
  )
}
