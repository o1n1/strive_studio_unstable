'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, CheckCircle, XCircle, Edit,
  Award, Instagram, Facebook, Share2, Building, CreditCard,
  Download, ExternalLink, FileCheck, Clock, AlertCircle, Edit2, Loader2
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
  const [showChecklistModal, setShowChecklistModal] = useState(false)

  useEffect(() => {
    if (isAuthorized && params.id) {
      cargarTodosLosDatos()
    }
  }, [isAuthorized, params.id])

  const cargarTodosLosDatos = async () => {
    try {
      setLoading(true)
      console.log('📥 Cargando datos del coach:', params.id)

      // Query 1: Datos del coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', params.id)
        .single()

      if (coachError) throw coachError

      // Query 2: Datos del profile (separado)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nombre, apellidos, email, telefono, avatar_url')
        .eq('id', params.id)
        .single()

      if (profileError) throw profileError
      
      // Combinar datos
      setCoach({
        ...coachData,
        nombre: profileData.nombre,
        apellidos: profileData.apellidos,
        email: profileData.email,
        telefono_profile: profileData.telefono,
        avatar_url: profileData.avatar_url
      })

      console.log('✅ Datos del coach cargados')

      // Cargar certificaciones
      const { data: certs } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_obtencion', { ascending: false })
      setCertificaciones(certs || [])

      // Cargar documentos
      const { data: docs } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_subida', { ascending: false })
      setDocumentos(docs || [])

      // Cargar contratos
      const { data: contracts } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', params.id)
        .order('created_at', { ascending: false })
      setContratos(contracts || [])

      // Cargar pagos
      const { data: payments } = await supabase
        .from('coach_payments')
        .select('*')
        .eq('coach_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setPagos(payments || [])

      // Cargar evaluaciones
      const { data: evals } = await supabase
        .from('coach_evaluations')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_evaluacion', { ascending: false })
      setEvaluaciones(evals || [])

      // Cargar incidencias
      const { data: incidents } = await supabase
        .from('coach_incidents')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_incidente', { ascending: false })
      setIncidencias(incidents || [])

      // Cargar ausencias
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
          <button 
            onClick={() => router.push('/admin/coaches')} 
            className="px-4 py-2 rounded-lg transition-all hover:opacity-80 flex items-center gap-2" 
            style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          {coach.estado === 'pendiente' && (
            <button 
              onClick={() => setShowChecklistModal(true)}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2" 
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}
            >
              <CheckCircle size={18} />
              Revisar y Aprobar
            </button>
          )}
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
                               coach.estado === 'pendiente' ? 'rgba(251, 191, 36, 0.2)' :
                               coach.estado === 'rechazado' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: coach.estado === 'activo' ? '#10b981' : 
                          coach.estado === 'pendiente' ? '#fbbf24' :
                          coach.estado === 'rechazado' ? '#ef4444' : '#9ca3af',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {coach.estado === 'activo' ? '✓ Activo' :
                   coach.estado === 'pendiente' ? '⏳ Pendiente' :
                   coach.estado === 'rechazado' ? '✗ Rechazado' : coach.estado}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                  <Mail size={16} />
                  {coach.email}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                  <Phone size={16} />
                  {coach.telefono_profile || 'No especificado'}
                </div>
                {coach.fecha_ingreso && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                    <Calendar size={16} />
                    Ingreso: {new Date(coach.fecha_ingreso).toLocaleDateString('es-MX')}
                  </div>
                )}
                {coach.años_experiencia && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#B39A72' }}>
                    <Award size={16} />
                    {coach.años_experiencia} años de experiencia
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Información Personal */}
        <Card title="Información Personal">
          <div className="grid grid-cols-2 gap-6">
            {coach.fecha_nacimiento && (
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>Fecha de Nacimiento</label>
                <p style={{ color: '#FFFCF3' }}>{new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}</p>
              </div>
            )}
            {coach.rfc && (
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>RFC</label>
                <p style={{ color: '#FFFCF3' }}>{coach.rfc}</p>
              </div>
            )}
            {coach.direccion && (
              <div className="col-span-2">
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>Dirección</label>
                <p style={{ color: '#FFFCF3' }}>{coach.direccion}</p>
              </div>
            )}
            {coach.bio && (
              <div className="col-span-2">
                <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>Biografía</label>
                <p style={{ color: '#FFFCF3' }}>{coach.bio}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Documentos */}
        <Card title="Documentos">
          {documentos.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#B39A72' }}>No hay documentos cargados</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {documentos.map(doc => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-lg border"
                  style={{ 
                    background: 'rgba(255, 252, 243, 0.02)',
                    borderColor: doc.verificado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 122, 94, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: '#FFFCF3' }}>
                      {getTipoDocumentoLabel(doc.tipo)}
                    </span>
                    {doc.verificado && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                  </div>
                  <a 
                    href={doc.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm flex items-center gap-1 hover:underline"
                    style={{ color: '#AE3F21' }}
                  >
                    <ExternalLink size={14} />
                    Ver documento
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Certificaciones */}
        <Card title="Certificaciones">
          {certificaciones.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#B39A72' }}>No hay certificaciones registradas</p>
          ) : (
            <div className="space-y-3">
              {certificaciones.map(cert => (
                <div 
                  key={cert.id}
                  className="p-4 rounded-lg border flex items-center justify-between"
                  style={{ 
                    background: 'rgba(255, 252, 243, 0.02)',
                    borderColor: cert.verificado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 122, 94, 0.2)'
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1" style={{ color: '#FFFCF3' }}>{cert.nombre}</h4>
                    <p className="text-sm" style={{ color: '#B39A72' }}>
                      {cert.institucion} • {new Date(cert.fecha_obtencion).getFullYear()}
                    </p>
                  </div>
                  {cert.verificado && <CheckCircle size={20} style={{ color: '#10b981' }} />}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Contratos */}
        <Card title="Contratos">
          {contratos.length === 0 ? (
            <p className="text-center py-8" style={{ color: '#B39A72' }}>No hay contratos registrados</p>
          ) : (
            <div className="space-y-3">
              {contratos.map(contrato => (
                <div 
                  key={contrato.id}
                  className="p-4 rounded-lg border"
                  style={{ 
                    background: 'rgba(255, 252, 243, 0.02)',
                    borderColor: contrato.vigente ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 122, 94, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold" style={{ color: '#FFFCF3' }}>
                          {contrato.tipo_contrato?.replace('_', ' ').toUpperCase()}
                        </h4>
                        {contrato.vigente && (
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-semibold"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                          >
                            VIGENTE
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#B39A72' }}>
                        Inicio: {new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')}
                        {contrato.fecha_fin && ` • Fin: ${new Date(contrato.fecha_fin).toLocaleDateString('es-MX')}`}
                      </p>
                    </div>
                    {contrato.documento_url && (
                      <a 
                        href={contrato.documento_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg flex items-center gap-2 transition-all hover:opacity-80"
                        style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                      >
                        <Download size={16} />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Checklist Aprobación */}
      {showChecklistModal && (
        <ChecklistAprobacion
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          coach={coach}
          certificaciones={certificaciones}
          documentos={documentos}
          onSuccess={() => {
            setShowChecklistModal(false)
            cargarTodosLosDatos()
          }}
        />
      )}

      {/* Modal Editar Contrato */}
      {showEditarContratoModal && (
        <EditarContratoModal
          isOpen={showEditarContratoModal}
          onClose={() => setShowEditarContratoModal(false)}
          coachId={params.id}
          contratoActual={contratoVigente}
          onSuccess={() => {
            setShowEditarContratoModal(false)
            cargarTodosLosDatos()
          }}
        />
      )}
    </DashboardLayout>
  )
}