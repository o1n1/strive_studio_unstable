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
      'ine_frente': 'INE (Frente)',
      'ine_reverso': 'INE (Reverso)',
      'comprobante_domicilio': 'Comprobante de Domicilio',
      'titulo_cedula': 'Título/Cédula',
      'antecedentes_penales': 'Antecedentes No Penales',
      'estado_cuenta': 'Estado de Cuenta',
      'otro': 'Otro'
    }
    return labels[tipo] || tipo
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (!isAuthorized) return null

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center space-y-4">
            <XCircle size={48} style={{ color: '#ef4444' }} className="mx-auto" />
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Error al cargar coach
            </h2>
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{error}</p>
            <button onClick={() => router.push('/admin/coaches')} className="px-4 py-2 rounded-lg font-semibold" style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Volver
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
          <div className="text-center">
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Coach no encontrado</p>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/admin/coaches')} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
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
                      <Instagram size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.facebook && (
                    <a href={`https://facebook.com/${coach.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Facebook size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.tiktok && (
                    <a href={`https://tiktok.com/@${coach.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Share2 size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {coach.bio && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Biografía</h3>
              <p className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.bio}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Información Profesional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Años de experiencia</p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.años_experiencia || 0}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Rating promedio</p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>⭐ {coach.rating_promedio?.toFixed(1) || '0.0'}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Total clases</p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{coach.total_clases || 0}</p>
            </div>
          </div>

          {coach.especialidades && coach.especialidades.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Especialidades</h3>
              <div className="flex flex-wrap gap-2">
                {coach.especialidades.map((esp, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {esp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Certificaciones ({certificaciones.length})</h2>
          </div>

          {certificaciones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>No hay certificaciones registradas</p>
          ) : (
            <div className="space-y-3">
              {certificaciones.map((cert) => (
                <div key={cert.id} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{cert.nombre}</h3>
                        {cert.verificado && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>✓ Verificado</span>
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{cert.institucion}</p>
                      <div className="flex gap-4 text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        <span>📅 {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}</span>
                        {cert.fecha_vigencia && <span>⏰ Vigencia: {new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}</span>}
                      </div>
                    </div>
                    {cert.archivo_url && (
                      <a href={cert.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <Download size={16} style={{ color: '#AE3F21' }} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Documentos ({documentos.length})</h2>
          </div>

          {documentos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>No hay documentos subidos</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <FileText size={20} style={{ color: '#AE3F21' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{getTipoDocumentoLabel(doc.tipo)}</p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{new Date(doc.fecha_subida).toLocaleDateString('es-MX')}</p>
                      {doc.verificado && <span className="text-xs" style={{ color: '#10b981' }}>✓ Verificado</span>}
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

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Contratos ({contratos.length})</h2>
          </div>

          {contratos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>No hay contratos registrados</p>
          ) : (
            <div className="space-y-3">
              {contratos.map((contrato) => (
                <div key={contrato.id} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{contrato.tipo_contrato.replace('_', ' ').toUpperCase()}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: contrato.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 122, 94, 0.2)', color: contrato.estado === 'activo' ? '#10b981' : '#B39A72' }}>
                          {contrato.estado}
                        </span>
                        {contrato.firmado && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>✓ Firmado</span>}
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

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Historial de Pagos ({pagos.length})</h2>
          </div>

          {pagos.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>No hay pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                    <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Periodo</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Clases</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Monto Base</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Bonos</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Total</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b" style={{ borderColor: 'rgba(156, 122, 94, 0.1)' }}>
                      <td className="py-3 px-2 text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {new Date(pago.periodo_inicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} - {new Date(pago.periodo_fin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-2 text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{pago.total_clases}</td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>${pago.monto_base?.toLocaleString() || 0}</td>
                      <td className="py-3 px-2 text-sm text-right" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>${pago.bonos?.toLocaleString() || 0}</td>
                      <td className="py-3 px-2 text-sm text-right font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>${pago.total?.toLocaleString() || 0}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-1 rounded-full text-xs" style={{ background: pago.estado === 'procesado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)', color: pago.estado === 'procesado' ? '#10b981' : '#fbbf24' }}>
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {evaluaciones.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Evaluaciones ({evaluaciones.length})</h2>
            </div>
            <div className="space-y-3">
              {evaluaciones.map((eval) => (
                <div key={eval.id} className="p-4 rounded-lg border" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.periodo}</h3>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Evaluado por: {eval.evaluador?.nombre} {eval.evaluador?.apellidos}</p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{new Date(eval.fecha_evaluacion).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Puntualidad</p>
                      <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.puntualidad}/5</p>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Calidad</p>
                      <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.calidad_clase}/5</p>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Interacción</p>
                      <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.interaccion_clientes}/5</p>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Actitud</p>
                      <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.actitud}/5</p>
                    </div>
                  </div>
                  {eval.comentarios && (
                    <p className="text-sm mt-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{eval.comentarios}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {incidencias.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Incidencias ({incidencias.length})</h2>
            </div>
            <div className="space-y-2">
              {incidencias.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <AlertCircle size={16} style={{ color: '#ef4444' }} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{inc.tipo.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{new Date(inc.fecha_incidente).toLocaleDateString('es-MX')}</span>
                    </div>
                    <p className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{inc.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {ausencias.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>Ausencias ({ausencias.length})</h2>
            </div>
            <div className="space-y-2">
              {ausencias.map((aus) => (
                <div key={aus.id} className="p-3 rounded-lg flex items-start justify-between" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                  <div className="flex items-start gap-3">
                    <Clock size={16} style={{ color: '#B39A72' }} className="mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>{aus.tipo.replace('_', ' ').toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: aus.estado === 'aprobado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)', color: aus.estado === 'aprobado' ? '#10b981' : '#fbbf24' }}>
                          {aus.estado}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {new Date(aus.fecha_inicio).toLocaleDateString('es-MX')} - {new Date(aus.fecha_fin).toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>{aus.dias_totales} días</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
