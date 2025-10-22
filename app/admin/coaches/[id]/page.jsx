'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, User, Mail, Phone, Calendar, MapPin, FileText, Award, Loader2, ExternalLink } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import Image from 'next/image'

export default function CoachDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isAuthorized && params.id) {
      fetchCoachDetail()
    }
  }, [isAuthorized, params.id])

  const fetchCoachDetail = async () => {
    try {
      setLoading(true)
      console.log('📥 Cargando detalle del coach:', params.id)
      
      const { data, error } = await supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles!coaches_id_fkey(
            id,
            email,
            nombre,
            apellidos,
            telefono,
            avatar_url
          ),
          certificaciones:coach_certifications(*),
          documentos:coach_documents(*),
          contratos:coach_contracts(*)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      console.log('📊 Datos del coach:', data)

      const coachData = {
        ...data,
        email: data.profile?.email || '',
        nombre: data.profile?.nombre || '',
        apellidos: data.profile?.apellidos || '',
        telefono: data.profile?.telefono || '',
        foto_url: data.foto_profesional_url || data.profile?.avatar_url || null
      }

      console.log('✅ Coach procesado:', coachData)
      setCoach(coachData)
    } catch (error) {
      console.error('❌ Error cargando coach:', error)
      alert('Error al cargar los datos del coach')
      router.push('/admin/coaches')
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async () => {
    if (!confirm('¿Aprobar a este coach?')) return

    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('coaches')
        .update({
          estado: 'activo',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: user.id
        })
        .eq('id', params.id)

      if (error) throw error

      alert('✅ Coach aprobado exitosamente')
      router.push('/admin/coaches')
    } catch (error) {
      console.error('Error aprobando coach:', error)
      alert('❌ Error al aprobar coach')
    } finally {
      setProcessing(false)
    }
  }

  const handleRechazar = async () => {
    const motivo = prompt('Motivo del rechazo (será enviado por email):')
    if (!motivo) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('coaches')
        .update({
          estado: 'inactivo',
          notas_internas: `RECHAZADO: ${motivo}`
        })
        .eq('id', params.id)

      if (error) throw error

      alert('✅ Coach rechazado. Se enviará notificación por email.')
      router.push('/admin/coaches')
    } catch (error) {
      console.error('Error rechazando coach:', error)
      alert('❌ Error al rechazar coach')
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized || !coach) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/coaches')}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Detalle del Coach
            </h1>
            <p className="text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Revisa y aprueba la solicitud
            </p>
          </div>
          {coach.estado === 'pendiente' && (
            <div className="flex gap-3">
              <Button
                onClick={handleRechazar}
                disabled={processing}
                variant="secondary"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                <XCircle size={20} />
                Rechazar
              </Button>
              <Button
                onClick={handleAprobar}
                disabled={processing}
                variant="primary">
                {processing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                Aprobar
              </Button>
            </div>
          )}
        </div>

        {/* Estado Badge */}
        <div className="inline-block px-4 py-2 rounded-full text-sm font-bold"
          style={{
            background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 
                       coach.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.2)' :
                       'rgba(107, 114, 128, 0.2)',
            color: coach.estado === 'activo' ? '#10b981' : 
                   coach.estado === 'pendiente' ? '#f59e0b' : 
                   '#6b7280'
          }}>
          {coach.estado === 'activo' ? '✓ Activo' : 
           coach.estado === 'pendiente' ? '⏳ Pendiente de Aprobación' : 
           '○ Inactivo'}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Info Personal */}
          <div className="lg:col-span-1 space-y-6">
            {/* Foto y Nombre */}
            <Card>
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden"
                  style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                  {coach.foto_url ? (
                    <Image
                      src={coach.foto_url}
                      alt={`${coach.nombre} ${coach.apellidos}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error('❌ Error cargando foto:', coach.foto_url)
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <User size={48} style={{ color: '#AE3F21', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.nombre || 'Sin nombre'} {coach.apellidos || ''}
                  </h2>
                  <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Coach de {coach.categoria || 'Cycling/Funcional'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Contacto */}
            <Card>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Información de Contacto
              </h3>
              <div className="space-y-3">
                {coach.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={20} style={{ color: '#B39A72' }} />
                    <span className="text-sm break-all" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.email}
                    </span>
                  </div>
                )}
                {coach.telefono && (
                  <div className="flex items-center gap-3">
                    <Phone size={20} style={{ color: '#B39A72' }} />
                    <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.telefono}
                    </span>
                  </div>
                )}
                {coach.fecha_nacimiento && (
                  <div className="flex items-center gap-3">
                    <Calendar size={20} style={{ color: '#B39A72' }} />
                    <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                )}
                {coach.direccion && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} style={{ color: '#B39A72' }} className="mt-1" />
                    <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.direccion}
                    </span>
                  </div>
                )}
                {coach.rfc && (
                  <div className="flex items-center gap-3">
                    <FileText size={20} style={{ color: '#B39A72' }} />
                    <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      RFC: {coach.rfc}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Contacto de Emergencia */}
            {coach.contacto_emergencia && Object.keys(coach.contacto_emergencia).length > 0 && (
              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Contacto de Emergencia
                </h3>
                <div className="space-y-2 text-sm">
                  {coach.contacto_emergencia.nombre && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Nombre: </span>
                      {coach.contacto_emergencia.nombre}
                    </p>
                  )}
                  {coach.contacto_emergencia.telefono && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Teléfono: </span>
                      {coach.contacto_emergencia.telefono}
                    </p>
                  )}
                  {coach.contacto_emergencia.relacion && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Relación: </span>
                      {coach.contacto_emergencia.relacion}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Columna Derecha - Info Profesional */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {coach.bio && (
              <Card>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Bio
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif', opacity: 0.9 }}>
                  {coach.bio}
                </p>
              </Card>
            )}

            {/* Experiencia y Especialidades */}
            <Card>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Experiencia y Especialidades
              </h3>
              <div className="space-y-4">
                {coach.años_experiencia && (
                  <div>
                    <p className="text-sm opacity-70 mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Años de Experiencia
                    </p>
                    <p className="text-xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.años_experiencia} años
                    </p>
                  </div>
                )}
                {coach.especialidades && coach.especialidades.length > 0 && (
                  <div>
                    <p className="text-sm opacity-70 mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Especialidades
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {coach.especialidades.map((esp, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Certificaciones */}
            {coach.certificaciones && coach.certificaciones.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Certificaciones
                </h3>
                <div className="space-y-3">
                  {coach.certificaciones.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <Award size={20} style={{ color: '#AE3F21' }} className="mt-1" />
                          <div>
                            <h4 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                              {cert.nombre}
                            </h4>
                            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                              {cert.institucion}
                            </p>
                          </div>
                        </div>
                        {cert.verificado && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs mt-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        <span>Obtenido: {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}</span>
                        {cert.fecha_vigencia && (
                          <span>Vigencia: {new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}</span>
                        )}
                      </div>
                      {cert.archivo_url && (
                        <a
                          href={cert.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-xs font-semibold hover:opacity-80 transition-all"
                          style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                          Ver certificado <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Documentos */}
            {coach.documentos && coach.documentos.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Documentos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coach.documentos.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                      <div className="flex items-center gap-3">
                        <FileText size={20} style={{ color: '#AE3F21' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {doc.tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {doc.verificado && (
                            <p className="text-xs" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                              ✓ Verificado
                            </p>
                          )}
                        </div>
                        <ExternalLink size={16} style={{ color: '#B39A72' }} />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Redes Sociales */}
            {(coach.instagram || coach.facebook || coach.tiktok) && (
              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Redes Sociales
                </h3>
                <div className="space-y-2 text-sm">
                  {coach.instagram && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Instagram: </span>
                      <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener noreferrer" 
                        className="hover:opacity-80 transition-all" style={{ color: '#AE3F21' }}>
                        @{coach.instagram}
                      </a>
                    </p>
                  )}
                  {coach.facebook && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Facebook: </span>
                      <a href={coach.facebook} target="_blank" rel="noopener noreferrer" 
                        className="hover:opacity-80 transition-all" style={{ color: '#AE3F21' }}>
                        Ver perfil
                      </a>
                    </p>
                  )}
                  {coach.tiktok && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">TikTok: </span>
                      <a href={`https://tiktok.com/@${coach.tiktok}`} target="_blank" rel="noopener noreferrer" 
                        className="hover:opacity-80 transition-all" style={{ color: '#AE3F21' }}>
                        @{coach.tiktok}
                      </a>
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Información Bancaria */}
            {coach.banco && (
              <Card>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Bancaria
                </h3>
                <div className="space-y-2 text-sm">
                  <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="opacity-70">Banco: </span>
                    {coach.banco}
                  </p>
                  {coach.titular_cuenta && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">Titular: </span>
                      {coach.titular_cuenta}
                    </p>
                  )}
                  {coach.clabe_encriptada && (
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      <span className="opacity-70">CLABE: </span>
                      ****{coach.clabe_encriptada.slice(-4)}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}