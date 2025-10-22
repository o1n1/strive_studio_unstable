'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Eye, CheckCircle, XCircle, 
  Send, Ban, Loader2, Trash2
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import InvitarCoachModal from '@/components/admin/InvitarCoachModal'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function AdminCoachesPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  
  const [coaches, setCoaches] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tabActivo, setTabActivo] = useState('todos')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  const loadData = async () => {
    await Promise.all([
      cargarCoaches(),
      fetchInvitaciones()
    ])
  }

  const cargarCoaches = async () => {
    try {
      console.log('🔄 Cargando coaches...')
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('coaches_complete')
        .select('*')
        .order('coach_created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Coaches cargados:', (data || []).length)
      setCoaches(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error cargando coaches:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const fetchInvitaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitaciones(data || [])
    } catch (error) {
      console.error('Error cargando invitaciones:', error)
    }
  }

  const handleEliminarCoach = async (coachId) => {
    if (!confirm('⚠️ ESTA ACCIÓN ES IRREVERSIBLE\n\n¿Estás seguro de eliminar COMPLETAMENTE este coach?\n\nSe eliminarán:\n- Datos del coach\n- Perfil\n- Usuario de autenticación\n- Documentos\n- Certificaciones\n- Contratos')) {
      return
    }

    setDeleting(coachId)

    try {
      const response = await fetch('/api/coaches/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ coachId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar coach')
      }

      alert('✅ Coach eliminado completamente')
      await loadData()
    } catch (error) {
      console.error('Error eliminando coach:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleReenviarInvitacion = async (invitacionId) => {
    try {
      const invitacion = invitaciones.find(i => i.id === invitacionId)
      if (!invitacion) return

      const response = await fetch('/api/coaches/invite/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ invitacionId })
      })

      if (!response.ok) throw new Error('Error al reenviar')

      alert('✅ Invitación reenviada')
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al reenviar: ' + error.message)
    }
  }

  const handleCancelarInvitacion = async (invitacionId) => {
    if (!confirm('¿Cancelar esta invitación?')) return

    try {
      const { error } = await supabase
        .from('coach_invitations')
        .update({ estado: 'cancelado' })
        .eq('id', invitacionId)

      if (error) throw error

      alert('✅ Invitación cancelada')
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const stats = {
    total: coaches.length,
    activos: coaches.filter(c => c.estado === 'activo').length,
    pendientes: coaches.filter(c => c.estado === 'pendiente').length,
    inactivos: coaches.filter(c => c.estado === 'inactivo').length,
    invitacionesPendientes: invitaciones.filter(i => i.estado === 'pendiente').length
  }

  const coachesFiltrados = coaches.filter(coach => {
    if (tabActivo === 'activos' && coach.estado !== 'activo') return false
    if (tabActivo === 'pendientes' && coach.estado !== 'pendiente') return false
    if (tabActivo === 'inactivos' && coach.estado !== 'inactivo') return false

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchNombre = coach.nombre?.toLowerCase().includes(search)
      const matchApellidos = coach.apellidos?.toLowerCase().includes(search)
      const matchEmail = coach.email?.toLowerCase().includes(search)
      if (!matchNombre && !matchApellidos && !matchEmail) return false
    }

    return true
  })

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
            <p className="text-red-500 mb-4">Error al cargar coaches</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2 rounded-lg"
              style={{ background: '#AE3F21', color: '#FFFCF3' }}>
              Reintentar
            </button>
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
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Gestión de Coaches
            </h1>
            <p className="text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Administra coaches, invitaciones y aprobaciones
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90 flex items-center gap-2"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <Plus size={20} />
            Invitar Coach
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.total}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Total Coaches
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.activos}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Activos
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.pendientes}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Pendientes
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.inactivos}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Inactivos
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.invitacionesPendientes}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Invitaciones
              </p>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} style={{ color: '#B39A72' }} />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(42, 42, 42, 0.8)',
                  border: '1px solid rgba(156, 122, 94, 0.3)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {['todos', 'activos', 'pendientes', 'inactivos'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTabActivo(tab)}
                  className="px-4 py-2 rounded-lg font-semibold transition-all"
                  style={{
                    background: tabActivo === tab ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                    color: tabActivo === tab ? '#FFFCF3' : '#B39A72',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Lista de Coaches */}
        <div className="space-y-4">
          {coachesFiltrados.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  No se encontraron coaches
                </p>
              </div>
            </Card>
          ) : (
            coachesFiltrados.map(coach => (
              <Card key={coach.id}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ 
                      background: coach.avatar_url ? 'transparent' : 'rgba(174, 63, 33, 0.2)',
                      color: '#AE3F21',
                      backgroundImage: coach.avatar_url ? `url(${coach.avatar_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                    {!coach.avatar_url && (coach.nombre?.[0] || 'C')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.nombre} {coach.apellidos}
                        </h3>
                        <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.email}
                        </p>
                      </div>
                      
                      <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
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

                    <div className="flex flex-wrap gap-3 text-xs mb-3">
                      {coach.telefono && (
                        <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          📱 {coach.telefono}
                        </span>
                      )}
                      {coach.años_experiencia && (
                        <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          🎯 {coach.años_experiencia} años
                        </span>
                      )}
                      {coach.especialidades && coach.especialidades.length > 0 && (
                        <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          💪 {coach.especialidades.length} especialidades
                        </span>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                        style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        <Eye size={16} />
                        Ver Detalle
                      </button>

                      <button
                        onClick={() => handleEliminarCoach(coach.id)}
                        disabled={deleting === coach.id}
                        className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 ml-auto disabled:opacity-50"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                        {deleting === coach.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal Invitar */}
      {showInviteModal && (
        <InvitarCoachModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            fetchInvitaciones()
          }}
        />
      )}
    </DashboardLayout>
  )
}
