'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, CheckCircle, XCircle, Edit,
  Award, Instagram, Facebook, Share2, Building, CreditCard,
  Download, ExternalLink, FileCheck, Clock, AlertCircle, Edit2
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import EditarContratoModal from '@/components/admin/EditarContratoModal'

export default function CoachDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  
  const [coach, setCoach] = useState(null)
  const [certificaciones, setCertificaciones] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [contratos, setContratos] = useState([])
  const [pagos, setPagos] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [ausencias, setAusencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showEditarContratoModal, setShowEditarContratoModal] = useState(false)

  useEffect(() => {
    if (isAuthorized && params.id) {
      cargarTodosLosDatos()
    }
  }, [isAuthorized, params.id])

  const cargarTodosLosDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (coachError) throw coachError
      setCoach(coachData)

      const { data: certData } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_obtencion', { ascending: false })
      setCertificaciones(certData || [])

      const { data: docsData } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_subida', { ascending: false })
      setDocumentos(docsData || [])

      const { data: contractsData } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', params.id)
        .order('created_at', { ascending: false })
      setContratos(contractsData || [])

      const { data: paymentsData } = await supabase
        .from('coach_payments')
        .select('*')
        .eq('coach_id', params.id)
        .order('periodo_inicio', { ascending: false })
      setPagos(paymentsData || [])

      const { data: evals } = await supabase
        .from('coach_evaluations')
        .select(`
          *,
          evaluador:profiles!evaluado_por(nombre, apellidos)
        `)
        .eq('coach_id', params.id)
        .order('fecha_evaluacion', { ascending: false })
      setEvaluaciones(evals || [])

      const { data: incidents } = await supabase
        .from('coach_incidents')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_incidente', { ascending: false })
      setIncidencias(incidents || [])

      const { data: absences } = await supabase
        .from('coach_absences')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_inicio', { ascending: false })
      setAusencias(absences || [])

      setLoading(false)
    } catch (error) {
      console.error('❌ Error:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleDescargarContrato = async () => {
    try {
      setDownloadingPDF(true)
      
      console.log('📄 Generando PDF para coach:', params.id)
      
      const response = await fetch(`/api/coaches/${params.id}/contract/pdf`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al generar PDF')
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

  const handleAprobar = async () => {
    if (!confirm('¿Aprobar a este coach?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('coaches')
        .update({
          estado: 'activo',
          activo: true,
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: user.id
        })
        .eq('id', params.id)

      if (error) throw error

      alert('✅ Coach aprobado exitosamente')
      cargarTodosLosDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al aprobar coach: ' + error.message)
    }
  }

  const handleRechazar = async () => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    try {
      const { error } = await supabase
        .from('coaches')
        .update({
          estado: 'rechazado',
          activo: false
        })
        .eq('id', params.id)

      if (error) throw error

      alert('✅ Coach rechazado')
      router.push('/admin/coaches')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const getTipoDocumentoLabel = (tipo) => {
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
              style={{ background: '#AE3F21', color: '#FFFCF3' }}>
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
          <button onClick={() => router.push('/admin/coaches')} className="px-4 py-2 rounded-lg transition-all hover:opacity-80 flex items-center gap-2" style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            <ArrowLeft size={18} />
            Volver
          </button>

          {coach.estado === 'pendiente' && (
            <div className="flex gap-3">
              <button onClick={handleAprobar} className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                <CheckCircle size={18} />
                Aprobar
              </button>
              <button onClick={handleRechazar} className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <XCircle size={18} />
                Rechazar
              </button>
            </div>
          )}
        </div>

        {/* Perfil Header */}
        <Card>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: coach.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', backgroundImage: coach.avatar_url ? `url(${coach.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!coach.avatar_url && (coach.nombre?.[0] || 'C')}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.nombre} {coach.apellidos}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : coach.estado === 'pendiente' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: coach.estado === 'activo' ? '#10b981' : coach.estado === 'pendiente' ? '#fbbf24' : '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.estado === 'activo' ? '🟢 Activo' : coach.estado === 'pendiente' ? '🟡 Pendiente' : '🔴 Inactivo'}
                    </span>
                    {coach.es_head_coach && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                        👑 Head Coach {coach.categoria_head ? `- ${coach.categoria_head}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{ color: '#B39A72' }} />
                  <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.email}</span>
                </div>
                {coach.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.telefono}</span>
                  </div>
                )}
                {coach.fecha_nacimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}</span>
                  </div>
                )}
                {coach.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.direccion}</span>
                  </div>
                )}
              </div>

              {(coach.instagram || coach.facebook || coach.tiktok) && (
                <div className="flex gap-3 mt-4">
                  {coach.instagram && (
                    <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Instagram size={16} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.facebook && (
                    <a href={`https://facebook.com/${coach.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Facebook size={16} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.tiktok && (
                    <a href={`https://tiktok.com/@${coach.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Share2 size={16} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* SECCIÓN DE CONTRATOS */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Contratos ({contratos.length})
            </h2>
            <div className="flex gap-3">
              {contratoVigente && (
                <>
                  <button
                    onClick={handleDescargarContrato}
                    disabled={downloadingPDF}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    {downloadingPDF ? (
                      <>
                        <Clock size={18} className="animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Descargar PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowEditarContratoModal(true)}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                    style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <Edit2 size={18} />
                    Renovar Contrato
                  </button>
                </>
              )}
              {!contratoVigente && (
                <button
                  onClick={() => setShowEditarContratoModal(true)}
                  className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                  style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  <FileText size={18} />
                  Crear Contrato
                </button>
              )}
            </div>
          </div>

          {contratos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No hay contratos registrados
            </p>
          ) : (
            <div className="space-y-3">
              {contratos.map((contrato) => (
                <div key={contrato.id} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {contrato.tipo_contrato.replace('_', ' ').toUpperCase()}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: contrato.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 122, 94, 0.2)', color: contrato.estado === 'activo' ? '#10b981' : '#B39A72' }}>
                          {contrato.estado}
                        </span>
                        {contrato.firmado && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                            ✓ Firmado
                          </span>
                        )}
                        {contrato.vigente && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}>
                            Vigente
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        <span>📅 Inicio: {new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')}</span>
                        {contrato.fecha_fin && <span>📅 Fin: {new Date(contrato.fecha_fin).toLocaleDateString('es-MX')}</span>}
                        {contrato.sueldo_base && <span>💰 Base: ${contrato.sueldo_base.toLocaleString()}</span>}
                        {contrato.comision_por_clase && <span>💵 Comisión: ${contrato.comision_por_clase.toLocaleString()}</span>}
                      </div>
                    </div>
                    {contrato.documento_url && (
                      <a href={contrato.documento_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <Download size={16} style={{ color: '#AE3F21' }} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Documentos */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Documentos ({documentos.length})
            </h2>
          </div>

          {documentos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No hay documentos subidos
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <FileText size={20} style={{ color: '#AE3F21' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {getTipoDocumentoLabel(doc.tipo)}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {new Date(doc.fecha_subida).toLocaleDateString('es-MX')}
                      </p>
                      {doc.verificado && (
                        <span className="text-xs" style={{ color: '#10b981' }}>✓ Verificado</span>
                      )}
                    </div>
                  </div>
                  <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                    <ExternalLink size={16} style={{ color: '#AE3F21' }} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Certificaciones */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Certificaciones ({certificaciones.length})
            </h2>
          </div>

          {certificaciones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No hay certificaciones registradas
            </p>
          ) : (
            <div className="space-y-3">
              {certificaciones.map((cert) => (
                <div key={cert.id} className="p-3 rounded-lg border" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {cert.nombre}
                      </p>
                      <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {cert.institucion}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        Obtenida: {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}
                      </p>
                      {cert.fecha_vigencia && (
                        <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          Vigencia: {new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}
                        </p>
                      )}
                    </div>
                    {cert.archivo_url && (
                      <a href={cert.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <ExternalLink size={16} style={{ color: '#AE3F21' }} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Editar Contrato */}
      <EditarContratoModal
        isOpen={showEditarContratoModal}
        onClose={() => setShowEditarContratoModal(false)}
        coach={coach}
        contratoActual={contratoVigente}
        onSuccess={cargarTodosLosDatos}
      />
    </DashboardLayout>
  )
}
