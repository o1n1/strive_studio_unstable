'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  FileText, DollarSign, CheckCircle, XCircle, Edit,
  Award, Instagram, Facebook, Share2, Building, CreditCard
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthorized && params.id) {
      cargarDatosCoach()
    }
  }, [isAuthorized, params.id])

  const cargarDatosCoach = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando coach con ID:', params.id)

      const { data, error } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (error) throw error
      
      console.log('✅ Coach cargado:', data)
      console.log('🖼️ Avatar URL:', data?.avatar_url)
      
      setCoach(data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error cargando datos del coach:', error)
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
      cargarDatosCoach()
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
          <div className="text-center space-y-4">
            <XCircle size={48} style={{ color: '#ef4444' }} className="mx-auto" />
            <h2 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Error al cargar coach
            </h2>
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/admin/coaches')}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
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
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Coach no encontrado
            </p>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/coaches')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            <ArrowLeft size={18} />
            Volver
          </button>

          {coach.estado === 'pendiente' && (
            <div className="flex gap-3">
              <button
                onClick={handleAprobar}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                <CheckCircle size={18} />
                Aprobar
              </button>
              <button
                onClick={handleRechazar}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <XCircle size={18} />
                Rechazar
              </button>
            </div>
          )}
        </div>

        {/* Información Personal */}
        <Card>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ 
                background: coach.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)',
                color: '#AE3F21',
                backgroundImage: coach.avatar_url ? `url(${coach.avatar_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
              {!coach.avatar_url && (coach.nombre?.[0] || 'C')}
            </div>

            {/* Info básica */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.nombre} {coach.apellidos}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: coach.estado === 'activo' 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : coach.estado === 'pendiente'
                          ? 'rgba(251, 191, 36, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                        color: coach.estado === 'activo' 
                          ? '#10b981' 
                          : coach.estado === 'pendiente'
                          ? '#fbbf24'
                          : '#ef4444',
                        fontFamily: 'Montserrat, sans-serif'
                      }}>
                      {coach.estado === 'activo' ? '🟢 Activo' : 
                       coach.estado === 'pendiente' ? '🟡 Pendiente' : 
                       '🔴 Inactivo'}
                    </span>
                    {coach.es_head_coach && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          background: 'rgba(174, 63, 33, 0.2)', 
                          color: '#AE3F21',
                          fontFamily: 'Montserrat, sans-serif'
                        }}>
                        👑 Head Coach {coach.categoria_head ? `- ${coach.categoria_head}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info de contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{ color: '#B39A72' }} />
                  <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.email}
                  </span>
                </div>
                {coach.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.telefono}
                    </span>
                  </div>
                )}
                {coach.fecha_nacimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {new Date(coach.fecha_nacimiento).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                )}
                {coach.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.direccion}
                    </span>
                  </div>
                )}
              </div>

              {/* Redes sociales */}
              {(coach.instagram || coach.facebook || coach.tiktok) && (
                <div className="flex gap-3 mt-4">
                  {coach.instagram && (
                    <a 
                      href={`https://instagram.com/${coach.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Instagram size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.facebook && (
                    <a 
                      href={`https://facebook.com/${coach.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Facebook size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                  {coach.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${coach.tiktok}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                      <Share2 size={18} style={{ color: '#AE3F21' }} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {coach.bio && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Biografía
              </h3>
              <p className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.bio}
              </p>
            </div>
          )}
        </Card>

        {/* Información Profesional */}
        <Card>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Información Profesional
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Años de experiencia
              </p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.años_experiencia || 0}
              </p>
            </div>
            
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Rating promedio
              </p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                ⭐ {coach.rating_promedio?.toFixed(1) || '0.0'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Total clases
              </p>
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.total_clases || 0}
              </p>
            </div>
          </div>

          {/* Especialidades */}
          {coach.especialidades && coach.especialidades.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Especialidades
              </h3>
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

          {/* Contadores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
              <Award size={20} className="mx-auto mb-1" style={{ color: '#B39A72' }} />
              <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.total_certificaciones || 0}
              </p>
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Certificaciones
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
              <FileText size={20} className="mx-auto mb-1" style={{ color: '#B39A72' }} />
              <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.total_documentos || 0}
              </p>
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Documentos
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
              <FileText size={20} className="mx-auto mb-1" style={{ color: '#B39A72' }} />
              <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.contratos_vigentes || 0}
              </p>
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Contratos
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
              <DollarSign size={20} className="mx-auto mb-1" style={{ color: '#B39A72' }} />
              <p className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.pagos_pendientes || 0}
              </p>
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Pagos pendientes
              </p>
            </div>
          </div>
        </Card>

        {/* Información Administrativa */}
        {coach.tipo_compensacion && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Administrativa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Tipo de compensación
                </p>
                <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {coach.tipo_compensacion}
                </p>
              </div>
              
              {coach.monto_base && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Monto base
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    ${coach.monto_base.toLocaleString()} MXN
                  </p>
                </div>
              )}
              
              {coach.banco && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Banco
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.banco}
                  </p>
                </div>
              )}
              
              {coach.fecha_ingreso && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Fecha de ingreso
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {new Date(coach.fecha_ingreso).toLocaleDateString('es-MX')}
                  </p>
                </div>
              )}
            </div>

            {coach.notas_internas && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                <p className="text-xs mb-1" style={{ color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' }}>
                  📝 Notas internas
                </p>
                <p className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {coach.notas_internas}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
