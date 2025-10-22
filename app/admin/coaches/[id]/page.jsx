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
          aprobador:profiles!coaches_aprobado_por_fkey(
            nombre,
            apellidos
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Transformar datos
      const coachTransformado = {
        ...data,
        email: data.profile?.email || '',
        nombre: data.profile?.nombre || '',
        apellidos: data.profile?.apellidos || '',
        telefono: data.profile?.telefono || '',
        avatar_url: data.profile?.avatar_url || null,
        aprobado_por_nombre: data.aprobador 
          ? `${data.aprobador.nombre} ${data.aprobador.apellidos}`.trim()
          : null
      }

      setCoach(coachTransformado)
      console.log('🖼️ Coach completo:', coachTransformado)
      console.log('🖼️ Avatar URL:', coachTransformado.avatar_url)
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
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Bio */}
              {coach.bio && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                  <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Especialidades */}
          {coach.especialidades && coach.especialidades.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <Award size={20} style={{ color: '#AE3F21' }} />
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {coach.especialidades.map((esp, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {esp}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Redes Sociales */}
          {(coach.instagram || coach.facebook || coach.tiktok) && (
            <Card>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <Share2 size={20} style={{ color: '#AE3F21' }} />
                Redes Sociales
              </h3>
              <div className="space-y-2">
                {coach.instagram && (
                  <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <Instagram size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      @{coach.instagram}
                    </span>
                  </a>
                )}
                {coach.facebook && (
                  <a href={`https://facebook.com/${coach.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <Facebook size={16} style={{ color: '#B39A72' }} />
                    <span style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.facebook}
                    </span>
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Información Bancaria */}
          {(coach.banco || coach.clabe_encriptada) && (
            <Card>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <CreditCard size={20} style={{ color: '#AE3F21' }} />
                Información Bancaria
              </h3>
              <div className="space-y-2">
                {coach.banco && (
                  <div>
                    <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Banco
                    </label>
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.banco}
                    </p>
                  </div>
                )}
                {coach.clabe_encriptada && (
                  <div>
                    <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      CLABE
                    </label>
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      ****{coach.clabe_encriptada.slice(-4)}
                    </p>
                  </div>
                )}
                {coach.titular_cuenta && (
                  <div>
                    <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Titular
                    </label>
                    <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.titular_cuenta}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Datos Administrativos */}
          <Card>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <FileText size={20} style={{ color: '#AE3F21' }} />
              Datos Administrativos
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Fecha de registro
                </label>
                <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {new Date(coach.created_at).toLocaleDateString('es-MX')}
                </p>
              </div>
              
              {coach.fecha_aprobacion && (
                <div>
                  <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Fecha de aprobación
                  </label>
                  <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {new Date(coach.fecha_aprobacion).toLocaleDateString('es-MX')}
                  </p>
                </div>
              )}

              {coach.aprobado_por_nombre && (
                <div>
                  <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Aprobado por
                  </label>
                  <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.aprobado_por_nombre}
                  </p>
                </div>
              )}

              {coach.años_experiencia && (
                <div>
                  <label className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Años de experiencia
                  </label>
                  <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {coach.años_experiencia} años
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
