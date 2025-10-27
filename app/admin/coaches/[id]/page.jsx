'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, CheckCircle, XCircle, Edit,
  Award, Instagram, Facebook, Share2, Building, CreditCard,
  Download, ExternalLink, FileCheck, Clock, AlertCircle, AlertTriangle
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import DocumentosCoachVerificacion from '@/components/admin/DocumentosCoachVerificacion'
import ChecklistAprobacion from '@/components/admin/ChecklistAprobacion'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import RevisarCambiosModal from '@/components/admin/RevisarCambiosModal'

export default function CoachDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  
  const [coach, setCoach] = useState(null)
  const [certificaciones, setCertificaciones] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [mostrarChecklist, setMostrarChecklist] = useState(false)
  const [showRevisarCambiosModal, setShowRevisarCambiosModal] = useState(false)
  const [cambiosPendientes, setCambiosPendientes] = useState(0)

  useEffect(() => {
    if (isAuthorized && params.id) {
      cargarTodosLosDatos()
      verificarCambiosPendientes()
    }
  }, [isAuthorized, params.id])

  const cargarTodosLosDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📥 Cargando datos del coach:', params.id)

      // ✅ USAR LA VISTA coaches_complete como en el código original
      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', params.id)
        .single()

      if (coachError) {
        console.error('❌ Error en query coaches_complete:', coachError)
        throw coachError
      }
      
      setCoach(coachData)
      console.log('✅ Datos del coach cargados:', coachData)
      console.log('✅ Avatar URL:', coachData?.avatar_url)

      // Obtener certificaciones
      const { data: certs, error: certsError } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_obtencion', { ascending: false })

      if (certsError) throw certsError
      setCertificaciones(certs || [])
      console.log('✅ Certificaciones cargadas:', certs?.length || 0)

      // Obtener documentos
      const { data: docs, error: docsError } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_subida', { ascending: false })

      if (docsError) throw docsError
      setDocumentos(docs || [])
      console.log('✅ Documentos cargados:', docs?.length || 0)

      // Obtener contratos
      const { data: contracts, error: contractsError } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', params.id)
        .order('created_at', { ascending: false })

      if (contractsError) throw contractsError
      setContratos(contracts || [])
      console.log('✅ Contratos cargados:', contracts?.length || 0)

      setLoading(false)
    } catch (error) {
      console.error('❌ Error cargando datos:', error)
      setError(error.message)
      setLoading(false)
    }
  }
  
  const verificarCambiosPendientes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/coaches/review-changes?estado=pendiente', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (response.ok) {
        const result = await response.json()
        const pendientes = result.solicitudes.filter(s => s.coach_id === params.id)
        setCambiosPendientes(pendientes.length)
        console.log('📊 Cambios pendientes:', pendientes.length)
      }
    } catch (error) {
      console.error('Error verificando cambios:', error)
    }
  }

  const handleDocumentosActualizados = () => {
    // Recargar documentos cuando se verifique alguno
    cargarTodosLosDatos()
  }

  const handleDescargarContrato = async () => {
    try {
      setDownloadingPDF(true)
      
      console.log('📄 Generando PDF para coach:', params.id)
      
      // Obtener sesión para el token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No hay sesión activa')
      }
      
      const response = await fetch(`/api/coaches/${params.id}/contract/pdf`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        let errorMsg = 'Error al generar PDF'
        try {
          const error = await response.json()
          errorMsg = error.error || errorMsg
        } catch {
          errorMsg = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrato-${coach.nombre}-${coach.apellidos}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('✅ PDF descargado exitosamente')
    } catch (error) {
      console.error('❌ Error descargando PDF:', error)
      alert('Error al descargar el contrato: ' + error.message)
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error al cargar información del coach</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={cargarTodosLosDatos}
              className="px-6 py-2 rounded-lg"
              style={{ background: '#AE3F21', color: '#FFFCF3' }}
            >
              Reintentar
            </button>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  if (!coach) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p style={{ color: '#B39A72' }}>Coach no encontrado</p>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  const contratoVigente = contratos.find(c => c.vigente)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/coaches')} 
            className="px-4 py-2 rounded-lg transition-all hover:opacity-80 flex items-center gap-2" 
            style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <div className="flex gap-3">
            {/* Botón de revisar cambios - Solo si hay cambios pendientes */}
            {coach.estado === 'activo' && cambiosPendientes > 0 && (
              <button
                onClick={() => setShowRevisarCambiosModal(true)}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                style={{ 
                  background: 'rgba(251, 191, 36, 0.2)', 
                  color: '#fbbf24', 
                  fontFamily: 'Montserrat, sans-serif',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                <AlertTriangle size={18} />
                Revisar Cambios ({cambiosPendientes})
              </button>
            )}

            {/* Botones de Aprobar/Rechazar - Solo si está pendiente */}
            {coach.estado === 'pendiente' && (
              <>
                <button 
                  onClick={handleAprobar}
                  className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2" 
                  style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}
                >
                  <CheckCircle size={18} />
                  Aprobar
                </button>
                <button 
                  onClick={handleRechazar}
                  className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2" 
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}
                >
                  <XCircle size={18} />
                  Rechazar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Perfil Header */}
        <Card>
          <div className="flex items-start gap-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" 
              style={{ 
                background: coach.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)', 
                color: '#AE3F21', 
                backgroundImage: coach.avatar_url ? `url(${coach.avatar_url})` : 'none', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              }}
            >
              {!coach.avatar_url && (coach.nombre?.charAt(0) || 'C')}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {coach.nombre} {coach.apellidos}
                </h1>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 
                               coach.estado === 'pendiente' ? 'rgba(174, 63, 33, 0.2)' : 
                               'rgba(156, 122, 94, 0.2)',
                    color: coach.estado === 'activo' ? '#10b981' : 
                           coach.estado === 'pendiente' ? '#AE3F21' : '#9C7A5E',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {coach.estado === 'activo' ? '🟢 Activo' : 
                   coach.estado === 'pendiente' ? '🟡 Pendiente' : 
                   '🔴 Inactivo'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm mb-3" style={{ color: '#B39A72' }}>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{coach.email}</span>
                </div>
                {coach.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{coach.telefono}</span>
                  </div>
                )}
              </div>

              {coach.es_head_coach && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full inline-block" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                  <span className="text-sm font-semibold" style={{ color: '#AE3F21' }}>
                    👑 Head Coach {coach.categoria_head ? `- ${coach.categoria_head}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Información Personal */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Información Personal
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coach.fecha_nacimiento && (
              <div className="flex items-center gap-3">
                <Calendar size={20} style={{ color: '#AE3F21' }} />
                <div>
                  <p className="text-xs" style={{ color: '#B39A72' }}>Fecha de Nacimiento</p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                    {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {coach.direccion && (
              <div className="flex items-center gap-3">
                <MapPin size={20} style={{ color: '#AE3F21' }} />
                <div>
                  <p className="text-xs" style={{ color: '#B39A72' }}>Dirección</p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>{coach.direccion}</p>
                </div>
              </div>
            )}

            {coach.rfc && (
              <div className="flex items-center gap-3">
                <FileText size={20} style={{ color: '#AE3F21' }} />
                <div>
                  <p className="text-xs" style={{ color: '#B39A72' }}>RFC</p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>{coach.rfc}</p>
                </div>
              </div>
            )}

            {coach.contacto_emergencia && (
              <div className="flex items-center gap-3">
                <AlertCircle size={20} style={{ color: '#AE3F21' }} />
                <div>
                  <p className="text-xs" style={{ color: '#B39A72' }}>Contacto de Emergencia</p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                    {coach.contacto_emergencia.nombre} - {coach.contacto_emergencia.telefono}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Información Profesional */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Información Profesional
          </h2>
          
          {coach.bio && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Bio:
              </p>
              <p className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.bio}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award size={16} style={{ color: '#AE3F21' }} />
              <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Experiencia: {coach.años_experiencia || 0} años
              </span>
            </div>

            {coach.especialidades && coach.especialidades.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Especialidades:
                </p>
                <div className="flex flex-wrap gap-2">
                  {coach.especialidades.map((esp, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                    >
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(coach.instagram || coach.facebook || coach.tiktok) && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Redes Sociales:
                </p>
                <div className="flex gap-3">
                  {coach.instagram && (
                    <a 
                      href={`https://instagram.com/${coach.instagram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.1)', color: '#AE3F21' }}
                    >
                      <Instagram size={16} />
                      <span className="text-sm">{coach.instagram}</span>
                    </a>
                  )}
                  {coach.facebook && (
                    <a 
                      href={`https://facebook.com/${coach.facebook}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.1)', color: '#AE3F21' }}
                    >
                      <Facebook size={16} />
                      <span className="text-sm">{coach.facebook}</span>
                    </a>
                  )}
                  {coach.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${coach.tiktok.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.1)', color: '#AE3F21' }}
                    >
                      <Share2 size={16} />
                      <span className="text-sm">{coach.tiktok}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 🆕 COMPONENTE DE DOCUMENTOS - INTEGRADO */}
        <Card>
          <DocumentosCoachVerificacion 
            coachId={params.id} 
            onDocumentosActualizados={handleDocumentosActualizados}
          />
        </Card>

        {/* Certificaciones */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Certificaciones ({certificaciones.length})
          </h2>

          {certificaciones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No hay certificaciones registradas
            </p>
          ) : (
            <div className="space-y-3">
              {certificaciones.map((cert) => (
                <div 
                  key={cert.id} 
                  className="p-4 rounded-lg border flex items-start justify-between gap-4"
                  style={{ 
                    borderColor: cert.verificado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 122, 94, 0.2)',
                    background: cert.verificado ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {cert.verificado && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                      <h3 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {cert.nombre}
                      </h3>
                    </div>
                    <p className="text-sm mb-1" style={{ color: '#B39A72' }}>
                      {cert.institucion}
                    </p>
                    <p className="text-xs" style={{ color: '#666' }}>
                      Obtenida: {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}
                      {cert.fecha_vigencia && ` • Vigencia: ${new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}`}
                    </p>
                  </div>
                  {cert.archivo_url && (
                    <a
                      href={cert.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg transition-all hover:opacity-80 flex items-center gap-2"
                      style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                    >
                      <ExternalLink size={16} />
                      Ver
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Información Bancaria */}
        {(coach.banco || coach.clabe_encriptada) && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Bancaria
            </h2>
            
            <div className="space-y-3">
              {coach.banco && (
                <div className="flex items-center gap-3">
                  <Building size={20} style={{ color: '#AE3F21' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#B39A72' }}>Banco</p>
                    <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>{coach.banco}</p>
                  </div>
                </div>
              )}
              
              {coach.clabe_encriptada && (
                <div className="flex items-center gap-3">
                  <CreditCard size={20} style={{ color: '#AE3F21' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#B39A72' }}>CLABE</p>
                    <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                      {'*'.repeat(14)}{coach.clabe_encriptada.slice(-4)}
                    </p>
                  </div>
                </div>
              )}

              {coach.titular_cuenta && (
                <div className="flex items-center gap-3">
                  <User size={20} style={{ color: '#AE3F21' }} />
                  <div>
                    <p className="text-xs" style={{ color: '#B39A72' }}>Titular</p>
                    <p className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>{coach.titular_cuenta}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Contratos */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Contratos
          </h2>

          {contratos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No hay contratos registrados
            </p>
          ) : (
            <div className="space-y-3">
              {contratos.map((contrato) => (
                <div 
                  key={contrato.id} 
                  className="p-4 rounded-lg border flex items-center justify-between"
                  style={{ 
                    borderColor: contrato.vigente ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 122, 94, 0.2)',
                    background: contrato.vigente ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {contrato.vigente && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                      <h3 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        Contrato {contrato.vigente ? 'Vigente' : 'Histórico'}
                      </h3>
                    </div>
                    <p className="text-xs" style={{ color: '#B39A72' }}>
                      Firmado: {new Date(contrato.fecha_firma || contrato.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <button
                    onClick={handleDescargarContrato}
                    disabled={downloadingPDF}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-50"
                    style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {downloadingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Descargar PDF
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 🆕 MODAL DE CHECKLIST DE APROBACIÓN */}
      {mostrarChecklist && (
        <ChecklistAprobacion 
          coach={coach}
          onClose={() => setMostrarChecklist(false)}
          onSuccess={() => {
            setMostrarChecklist(false)
            cargarTodosLosDatos()
          }}
        />
      )}

      {/* 🆕 MODAL DE REVISAR CAMBIOS PENDIENTES */}
      <RevisarCambiosModal
        isOpen={showRevisarCambiosModal}
        onClose={() => setShowRevisarCambiosModal(false)}
        coachId={params.id}
        onSuccess={() => {
          cargarTodosLosDatos()
          verificarCambiosPendientes()
          setShowRevisarCambiosModal(false)
        }}
      />
    </DashboardLayout>
  )
}
