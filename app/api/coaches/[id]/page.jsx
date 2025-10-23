'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, CheckCircle, XCircle, Edit,
  Award, Instagram, Facebook, Share2, Building, CreditCard,
  Download, ExternalLink, FileCheck, Clock, AlertCircle
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

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

  const handleDescargarContrato = async (contratoId) => {
    try {
      setDownloadingPDF(true)
      
      // Llamar al API route para generar el PDF
      const response = await fetch(`/api/coaches/${params.id}/contract/pdf`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al generar PDF')
      }

      // Obtener el blob del PDF
      const blob = await response.blob()
      
      // Crear URL temporal y descargar
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
              </div>
            </div>
          </div>
        </Card>

        {/* 📄 NUEVA SECCIÓN: CONTRATOS */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText size={24} style={{ color: '#AE3F21' }} />
              <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Contratos
              </h2>
            </div>
            {contratoVigente && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                {contratoVigente.firmado ? '✅ Firmado' : '⏳ Pendiente de Firma'}
              </span>
            )}
          </div>

          {contratos.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={48} style={{ color: '#B39A72', margin: '0 auto 16px' }} />
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                No hay contratos registrados para este coach
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Contrato Vigente */}
              {contratoVigente && (
                <div className="p-4 rounded-lg" style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.2)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        Contrato Vigente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Tipo:</span>
                          <span className="ml-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {contratoVigente.tipo_contrato || 'Por Clase'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Inicio:</span>
                          <span className="ml-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {new Date(contratoVigente.fecha_inicio).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        {contratoVigente.sueldo_base && (
                          <div>
                            <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Sueldo Base:</span>
                            <span className="ml-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                              ${Number(contratoVigente.sueldo_base).toLocaleString('es-MX')} MXN
                            </span>
                          </div>
                        )}
                        {contratoVigente.comision_por_clase && (
                          <div>
                            <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Comisión/Clase:</span>
                            <span className="ml-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                              ${Number(contratoVigente.comision_por_clase).toLocaleString('es-MX')} MXN
                            </span>
                          </div>
                        )}
                      </div>
                      {contratoVigente.firmado && contratoVigente.fecha_firma && (
                        <div className="mt-3 text-xs" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                          ✅ Firmado el {new Date(contratoVigente.fecha_firma).toLocaleDateString('es-MX')} a las {new Date(contratoVigente.fecha_firma).toLocaleTimeString('es-MX')}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDescargarContrato(contratoVigente.id)}
                    disabled={downloadingPDF}
                    className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {downloadingPDF ? (
                      <>
                        <Clock size={18} className="animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Descargar Contrato PDF
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Historial de Contratos */}
              {contratos.length > 1 && (
                <div>
                  <h3 className="font-bold mb-3 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Historial de Contratos ({contratos.length - 1})
                  </h3>
                  <div className="space-y-2">
                    {contratos.filter(c => !c.vigente).map((contrato) => (
                      <div key={contrato.id} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(179, 154, 114, 0.05)', border: '1px solid rgba(179, 154, 114, 0.1)' }}>
                        <div className="text-sm">
                          <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {contrato.tipo_contrato || 'Por Clase'}
                          </span>
                          <span className="mx-2" style={{ color: '#B39A72' }}>•</span>
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                            {new Date(contrato.fecha_inicio).toLocaleDateString('es-MX')}
                          </span>
                          {contrato.fecha_fin && (
                            <>
                              <span className="mx-2" style={{ color: '#B39A72' }}>→</span>
                              <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                                {new Date(contrato.fecha_fin).toLocaleDateString('es-MX')}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                          {contrato.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Resto de secciones existentes... */}
        {/* Aquí van las demás Cards que ya existían en el archivo original */}
      </div>
    </DashboardLayout>
  )
}
