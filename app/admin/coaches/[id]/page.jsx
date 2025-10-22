'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Loader2, ArrowLeft, CheckCircle, XCircle, Mail, Phone, MapPin, 
  Calendar, Briefcase, Instagram, Facebook, CreditCard, FileText,
  User, AlertCircle, Download, Eye
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function CoachDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  
  const [coach, setCoach] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [certificaciones, setCertificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    if (isAuthorized && params.id) {
      cargarDatosCoach()
    }
  }, [isAuthorized, params.id])

  const cargarDatosCoach = async () => {
    try {
      setLoading(true)

      // Cargar datos del coach con JOIN a profiles
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles!inner(
            nombre,
            apellidos,
            email,
            avatar_url,
            telefono
          )
        `)
        .eq('id', params.id)
        .single()

      if (coachError) throw coachError

      setCoach(coachData)

      // Cargar documentos
      const { data: docsData } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', params.id)
        .order('created_at', { ascending: false })

      setDocumentos(docsData || [])

      // Cargar certificaciones
      const { data: certsData } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', params.id)
        .order('fecha_obtencion', { ascending: false })

      setCertificaciones(certsData || [])

    } catch (error) {
      console.error('❌ Error cargando datos del coach:', error)
      alert('Error cargando información del coach')
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async () => {
    if (!confirm('¿Estás seguro de aprobar a este coach? Se activará en el sistema.')) {
      return
    }

    try {
      setProcessing(true)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        alert('No estás autenticado')
        return
      }

      const response = await fetch('/api/coaches/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ coachId: params.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error aprobando coach')
      }

      alert('✅ Coach aprobado exitosamente')
      await cargarDatosCoach()
    } catch (error) {
      console.error('❌ Error aprobando coach:', error)
      alert('Error al aprobar coach: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleRechazar = async () => {
    if (!motivo.trim()) {
      alert('Debes indicar el motivo del rechazo')
      return
    }

    if (!confirm('¿Estás seguro de rechazar a este coach?')) {
      return
    }

    try {
      setProcessing(true)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        alert('No estás autenticado')
        return
      }

      const response = await fetch('/api/coaches/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ 
          coachId: params.id,
          motivo 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error rechazando coach')
      }

      alert('❌ Coach rechazado. Se le notificará por email.')
      router.push('/admin/coaches')
    } catch (error) {
      console.error('❌ Error rechazando coach:', error)
      alert('Error al rechazar coach: ' + error.message)
    } finally {
      setProcessing(false)
      setShowModal(null)
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized || !coach) {
    return null
  }

  const nombreCompleto = `${coach.profile.nombre} ${coach.profile.apellidos}`
  const fotoUrl = coach.foto_profesional_url || coach.profile?.avatar_url

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/coaches')}
            className="p-2 rounded-lg hover:opacity-80 transition-all"
            style={{ background: 'rgba(179, 154, 114, 0.2)' }}>
            <ArrowLeft size={20} style={{ color: '#B39A72' }} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Perfil del Coach
            </h1>
            <p className="text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Revisa toda la información antes de aprobar
            </p>
          </div>
        </div>

        {/* Badge de estado */}
        <div className="flex justify-center">
          <span 
            className="px-6 py-3 rounded-full text-sm font-bold"
            style={{
              background: coach.estado === 'pendiente' 
                ? 'rgba(251, 191, 36, 0.2)'
                : coach.estado === 'activo'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              color: coach.estado === 'pendiente'
                ? '#fbbf24'
                : coach.estado === 'activo'
                ? '#10b981'
                : '#ef4444',
              fontFamily: 'Montserrat, sans-serif'
            }}>
            Estado: {coach.estado?.toUpperCase()}
          </span>
        </div>

        {/* Información Personal */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <User className="inline-block mr-2 mb-1" size={24} />
            Información Personal
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Foto y datos básicos */}
            <div className="flex gap-4">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ 
                  background: fotoUrl 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, rgba(174, 63, 33, 0.2), rgba(179, 154, 114, 0.2))',
                  border: '3px solid rgba(179, 154, 114, 0.3)'
                }}>
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nombreCompleto} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: '#B39A72', fontSize: '32px', fontWeight: 'bold' }}>
                    {nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {nombreCompleto}
                </h3>
                <div className="space-y-1 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    {coach.profile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {coach.telefono || 'No especificado'}
                  </div>
                  {coach.fecha_nacimiento && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-3 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              {coach.direccion && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{coach.direccion}</span>
                </div>
              )}
              {coach.rfc && (
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  RFC: {coach.rfc}
                </div>
              )}
              {coach.años_experiencia !== null && (
                <div className="flex items-center gap-2">
                  <Briefcase size={16} />
                  {coach.años_experiencia} años de experiencia
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {coach.bio && (
            <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(179, 154, 114, 0.1)' }}>
              <h4 className="font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Biografía
              </h4>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.bio}
              </p>
            </div>
          )}

          {/* Especialidades */}
          {coach.especialidades && coach.especialidades.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Especialidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {coach.especialidades.map((esp, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {esp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Redes Sociales */}
          <div className="mt-4 flex gap-4">
            {coach.instagram && (
              <a 
                href={`https://instagram.com/${coach.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-all"
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                <Instagram size={18} />
                @{coach.instagram.replace('@', '')}
              </a>
            )}
            {coach.facebook && (
              <a 
                href={coach.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-all"
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                <Facebook size={18} />
                Facebook
              </a>
            )}
          </div>
        </Card>

        {/* Contacto de Emergencia */}
        {coach.contacto_emergencia && coach.contacto_emergencia.nombre && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle className="inline-block mr-2 mb-1" size={24} />
              Contacto de Emergencia
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <div>
                <strong>Nombre:</strong> {coach.contacto_emergencia.nombre}
              </div>
              <div>
                <strong>Teléfono:</strong> {coach.contacto_emergencia.telefono}
              </div>
              {coach.contacto_emergencia.relacion && (
                <div>
                  <strong>Relación:</strong> {coach.contacto_emergencia.relacion}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Información Bancaria */}
        {coach.banco && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <CreditCard className="inline-block mr-2 mb-1" size={24} />
              Información Bancaria
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <div>
                <strong>Banco:</strong> {coach.banco}
              </div>
              <div>
                <strong>Titular:</strong> {coach.titular_cuenta || 'No especificado'}
              </div>
              {coach.clabe_encriptada && (
                <div>
                  <strong>CLABE:</strong> {'*'.repeat(14)} {coach.clabe_encriptada.slice(-4)}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Documentos */}
        {documentos.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <FileText className="inline-block mr-2 mb-1" size={24} />
              Documentos Subidos ({documentos.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {documentos.map(doc => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ background: 'rgba(179, 154, 114, 0.1)' }}>
                  <div>
                    <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {doc.nombre_archivo}
                    </p>
                    <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {doc.verificado ? '✅ Verificado' : '⏳ Pendiente'}
                    </p>
                  </div>
                  <a
                    href={doc.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:opacity-80 transition-all"
                    style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                    <Eye size={18} style={{ color: '#AE3F21' }} />
                  </a>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Certificaciones */}
        {certificaciones.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              🎓 Certificaciones ({certificaciones.length})
            </h2>
            <div className="space-y-3">
              {certificaciones.map(cert => (
                <div 
                  key={cert.id}
                  className="p-4 rounded-lg"
                  style={{ background: 'rgba(179, 154, 114, 0.1)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {cert.nombre}
                      </p>
                      <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {cert.institucion}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        Obtenida: {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}
                        {cert.fecha_vigencia && ` • Vigencia: ${new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}`}
                      </p>
                    </div>
                    {cert.archivo_url && (
                      <a
                        href={cert.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:opacity-80 transition-all"
                        style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <Download size={18} style={{ color: '#AE3F21' }} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Acciones (solo si está pendiente) */}
        {coach.estado === 'pendiente' && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Acciones
            </h2>
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={handleAprobar}
                disabled={processing}
                icon={processing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                style={{ background: '#10b981', color: '#fff' }}>
                {processing ? 'Procesando...' : 'Aprobar Coach'}
              </Button>
              <Button
                onClick={() => setShowModal('rechazar')}
                disabled={processing}
                icon={<XCircle size={20} />}
                style={{ background: '#ef4444', color: '#fff' }}>
                Rechazar Solicitud
              </Button>
            </div>
          </Card>
        )}

        {/* Modal de Rechazo */}
        {showModal === 'rechazar' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full rounded-xl p-6" style={{ background: '#1a1a1a' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Rechazar Solicitud
              </h3>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica el motivo del rechazo..."
                className="w-full p-3 rounded-lg mb-4 min-h-[120px]"
                style={{ 
                  background: 'rgba(42, 42, 42, 0.8)', 
                  color: '#FFFCF3', 
                  border: '1px solid rgba(179, 154, 114, 0.3)',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleRechazar}
                  disabled={processing || !motivo.trim()}
                  icon={processing ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
                  style={{ background: '#ef4444', color: '#fff' }}>
                  {processing ? 'Procesando...' : 'Confirmar Rechazo'}
                </Button>
                <Button
                  onClick={() => {
                    setShowModal(null)
                    setMotivo('')
                  }}
                  disabled={processing}
                  style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72' }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}