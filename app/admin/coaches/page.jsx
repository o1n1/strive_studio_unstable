'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserCog, Plus, Eye, CheckCircle, Trash2, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function CoachesPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthorized) {
      cargarCoaches()
    }
  }, [isAuthorized])

  const cargarCoaches = async () => {
    try {
      console.log('🔄 Cargando coaches...')
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error en query:', error)
        throw error
      }

      const coachesTransformados = (data || []).map(coach => ({
        ...coach,
        email: coach.profile?.email || '',
        nombre: coach.profile?.nombre || '',
        apellidos: coach.profile?.apellidos || '',
        telefono: coach.profile?.telefono || '',
        avatar_url: coach.profile?.avatar_url || null,
        aprobado_por_nombre: coach.aprobador 
          ? `${coach.aprobador.nombre} ${coach.aprobador.apellidos}`.trim()
          : null
      }))

      console.log('✅ Coaches cargados:', coachesTransformados.length)
      setCoaches(coachesTransformados)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error en cargarCoaches:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleEliminarCoach = async (coachId) => {
    if (!confirm('¿Estás seguro de eliminar este coach? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setDeleting(coachId)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        alert('No estás autenticado')
        return
      }

      const response = await fetch('/api/coaches/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ coachId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error eliminando coach')
      }

      console.log('✅ Coach eliminado')
      await cargarCoaches()
    } catch (error) {
      console.error('❌ Error eliminando coach:', error)
      alert('Error al eliminar coach: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  // Filtrar coaches según estado seleccionado
  const coachesFiltrados = coaches.filter(coach => {
    if (estadoFilter === 'todos') return true
    return coach.estado === estadoFilter
  })

  // Contar por estado
  const counts = {
    todos: coaches.length,
    pendiente: coaches.filter(c => c.estado === 'pendiente').length,
    activo: coaches.filter(c => c.estado === 'activo').length,
    inactivo: coaches.filter(c => c.estado === 'inactivo').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <UserCog className="inline-block mr-3 mb-1" size={32} />
              Gestión de Coaches
            </h1>
            <p className="text-xs sm:text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Administra coaches, invitaciones y solicitudes
            </p>
          </div>

          <Button
            onClick={() => router.push('/admin/coaches/invitar')}
            icon={<Plus size={20} />}
            style={{ background: '#AE3F21', color: '#FFFCF3' }}>
            Invitar Coach
          </Button>
        </div>

        {/* Tabs de estado */}
        <Card>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'activo', label: 'Activos' },
              { key: 'inactivo', label: 'Inactivos' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setEstadoFilter(key)}
                className="px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap"
                style={{
                  background: estadoFilter === key ? '#AE3F21' : 'transparent',
                  color: estadoFilter === key ? '#FFFCF3' : '#B39A72',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        </Card>

        {/* Error message */}
        {error && (
          <Card>
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <div>
                <p className="font-semibold">Error al cargar coaches</p>
                <p className="text-sm opacity-80">{error}</p>
                <button
                  onClick={cargarCoaches}
                  className="mt-2 px-4 py-2 rounded-lg font-semibold hover:opacity-80"
                  style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Reintentar
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de coaches */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#AE3F21' }} />
            </div>
          </Card>
        ) : coachesFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UserCog size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {estadoFilter === 'todos' 
                  ? 'No hay coaches registrados aún' 
                  : `No hay coaches en estado: ${estadoFilter}`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coachesFiltrados.map(coach => {
              // DATOS CORREGIDOS con validación segura
              const profile = coach.profile || {}
              const nombreCompleto = profile.nombre && profile.apellidos
                ? `${profile.nombre} ${profile.apellidos}` 
                : profile.nombre || 'Coach'

              const email = profile.email || 'Sin email'
              
              // Prioridad: foto_profesional_url > avatar_url
              const fotoUrl = coach.foto_profesional_url || profile.avatar_url

              // Iniciales para fallback
              const iniciales = nombreCompleto
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <Card key={coach.id}>
                  <div className="flex gap-4">
                    {/* Foto de perfil */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ 
                          background: fotoUrl 
                            ? 'transparent' 
                            : 'linear-gradient(135deg, rgba(174, 63, 33, 0.2), rgba(179, 154, 114, 0.2))',
                          border: '2px solid rgba(179, 154, 114, 0.3)'
                        }}>
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={nombreCompleto}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Error cargando imagen:', fotoUrl)
                              // Reemplazar con iniciales
                              const parent = e.target.parentElement
                              parent.style.background = 'linear-gradient(135deg, rgba(174, 63, 33, 0.2), rgba(179, 154, 114, 0.2))'
                              e.target.style.display = 'none'
                              const span = document.createElement('span')
                              span.style.cssText = 'color: #B39A72; font-size: 20px; font-weight: bold; font-family: Montserrat, sans-serif'
                              span.textContent = iniciales
                              parent.appendChild(span)
                            }}
                          />
                        ) : (
                          <span style={{ color: '#B39A72', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Montserrat, sans-serif' }}>
                            {iniciales}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información del coach */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {nombreCompleto}
                          </h3>
                          <p className="text-sm truncate" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                            {email}
                          </p>
                        </div>
                        
                        {/* Badge de estado */}
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
                          style={{
                            background: coach.estado === 'pendiente' 
                              ? 'rgba(251, 191, 36, 0.2)'
                              : coach.estado === 'activo'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(156, 163, 175, 0.2)',
                            color: coach.estado === 'pendiente'
                              ? '#fbbf24'
                              : coach.estado === 'activo'
                              ? '#10b981'
                              : '#9ca3af',
                            fontFamily: 'Montserrat, sans-serif'
                          }}>
                          {coach.estado === 'pendiente' && '⏳ '}
                          {coach.estado === 'activo' && '✅ '}
                          {coach.estado === 'inactivo' && '⛔ '}
                          {coach.estado?.toUpperCase() || 'DESCONOCIDO'}
                        </span>
                      </div>

                      {/* Información adicional */}
                      <div className="flex flex-wrap gap-3 text-xs mb-3">
                        {coach.telefono && (
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                            📞 {coach.telefono}
                          </span>
                        )}
                        {coach.años_experiencia !== null && coach.años_experiencia !== undefined && (
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                            ⭐ {coach.años_experiencia} años exp.
                          </span>
                        )}
                        {coach.especialidades && Array.isArray(coach.especialidades) && coach.especialidades.length > 0 && (
                          <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                            💪 {coach.especialidades.length} especialidades
                          </span>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                          className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                          style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          <Eye size={16} />
                          Ver Detalle
                        </button>

                        {coach.estado === 'pendiente' && (
                          <button
                            onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                            className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                            <CheckCircle size={16} />
                            Revisar y Aprobar
                          </button>
                        )}

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleEliminarCoach(coach.id)}
                          disabled={deleting === coach.id}
                          className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 ml-auto"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                          {deleting === coach.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          {deleting === coach.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}