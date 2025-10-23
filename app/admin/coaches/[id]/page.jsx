'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, Edit, Award, Instagram, 
  Facebook, Share2, Building, CreditCard, Download, 
  ExternalLink, FileCheck, Edit2
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import EditarContratoModal from '@/components/admin/EditarContratoModal'
import ChecklistAprobacion from '@/components/admin/ChecklistAprobacion'

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
                  className={`px-3 py-1 rounded-full text-sm font-semibold`}
                  style={{
                    background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 
                               coach.estado === 'pendiente' ? 'rgba(174, 63, 33, 0.2)' : 
                               'rgba(156, 122, 94, 0.2)',
                    color: coach.estado === 'activo' ? '#10b981' : 
                           coach.estado === 'pendiente' ? '#AE3F21' : 
                           '#9C7A5E'
                  }}
                >
                  {coach.estado === 'activo' ? '🟢 Activo' : 
                   coach.estado === 'pendiente' ? '⏳ Pendiente' : 
                   '⚪ Inactivo'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{ color: '#B39A72' }} />
                  <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{coach.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{ color: '#B39A72' }} />
                  <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{coach.telefono}</span>
                </div>
                {coach.fecha_nacimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                )}
                {coach.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{coach.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Checklist de Aprobación (solo para coaches pendientes) */}
        {coach.estado === 'pendiente' && (
          <ChecklistAprobacion 
            coach={coach} 
            onSuccess={cargarTodosLosDatos}
          />
        )}

        {/* Grid de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    {coach.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram size={16} style={{ color: '#B39A72' }} />
                        <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          @{coach.instagram}
                        </span>
                      </div>
                    )}
                    {coach.facebook && (
                      <div className="flex items-center gap-2">
                        <Facebook size={16} style={{ color: '#B39A72' }} />
                        <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.facebook}
                        </span>
                      </div>
                    )}
                    {coach.tiktok && (
                      <div className="flex items-center gap-2">
                        <Share2 size={16} style={{ color: '#B39A72' }} />
                        <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          @{coach.tiktok}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Información Bancaria */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Bancaria
            </h2>
            
            <div className="space-y-3">
              {coach.banco && (
                <div className="flex items-center gap-2">
                  <Building size={16} style={{ color: '#AE3F21' }} />
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Banco: {coach.banco}
                  </span>
                </div>
              )}
              
              {coach.clabe_encriptada && (
                <div className="flex items-center gap-2">
                  <CreditCard size={16} style={{ color: '#AE3F21' }} />
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    CLABE: ****{coach.clabe_encriptada.slice(-4)}
                  </span>
                </div>
              )}
              
              {coach.titular_cuenta && (
                <div className="flex items-center gap-2">
                  <User size={16} style={{ color: '#AE3F21' }} />
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Titular: {coach.titular_cuenta}
                  </span>
                </div>
              )}

              {coach.rfc && (
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: '#AE3F21' }} />
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    RFC: {coach.rfc}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Contrato */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Contrato
              </h2>
              <button
                onClick={() => setShowEditarContratoModal(true)}
                className="p-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}
              >
                <Edit2 size={18} style={{ color: '#AE3F21' }} />
              </button>
            </div>

            {contratoVigente ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Estado:
                  </span>
                  <span className="text-sm font-semibold" style={{ color: contratoVigente.firmado ? '#10b981' : '#ef4444' }}>
                    {contratoVigente.firmado ? '✓ Firmado' : '⚠ Sin firmar'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Tipo:
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                    {contratoVigente.tipo_contrato}
                  </span>
                </div>

                {contratoVigente.fecha_inicio && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Inicio:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                      {new Date(contratoVigente.fecha_inicio).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleDescargarContrato}
                  disabled={downloadingPDF}
                  className="w-full py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
                >
                  {downloadingPDF ? (
                    <>Generando PDF...</>
                  ) : (
                    <>
                      <Download size={18} />
                      Descargar Contrato PDF
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                No hay contrato vigente
              </p>
            )}
          </Card>

          {/* Documentos */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Documentos ({documentos.length})
            </h2>

            {documentos.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                No hay documentos subidos
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentos.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-3 rounded-lg border flex items-center justify-between" 
                    style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
                  >
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
                    <a 
                      href={doc.archivo_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 rounded-lg transition-all hover:opacity-80" 
                      style={{ background: 'rgba(174, 63, 33, 0.2)' }}
                    >
                      <ExternalLink size={16} style={{ color: '#AE3F21' }} />
                    </a>
                  </div>
                ))}
              </div>
            )}
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
                    className="p-3 rounded-lg border" 
                    style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
                  >
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
                        <a 
                          href={cert.archivo_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 rounded-lg transition-all hover:opacity-80" 
                          style={{ background: 'rgba(174, 63, 33, 0.2)' }}
                        >
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
