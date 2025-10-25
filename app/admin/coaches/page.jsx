// app/admin/coaches/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Eye, CheckCircle, XCircle, 
  Send, Ban, Loader2, Trash2, Edit2  // ← ✨ MODIFICACIÓN: Agregado Edit2
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import InvitarCoachModal from '@/components/admin/InvitarCoachModal'
import EditarCoachAdminModal from '@/components/admin/EditarCoachAdminModal' // ← ✨ NUEVO: Import del modal de edición
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
  
  // ← ✨ NUEVO: Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [coachAEditar, setCoachAEditar] = useState(null)

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
        .order('created_at', { ascending: false })

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

  // ← ✨ NUEVO: Función para abrir modal de edición
  const handleEditarCoach = (coach) => {
    console.log('🖊️ Abriendo editor para:', coach.nombre, coach.apellidos)
    setCoachAEditar(coach)
    setShowEditModal(true)
  }

  // ← ✨ NUEVO: Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setCoachAEditar(null)
  }

  // ← ✨ NUEVO: Función de éxito al editar
  const handleSuccessEdit = async () => {
    console.log('✅ Coach editado exitosamente, recargando datos...')
    await loadData()
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
        .update({ estado: 'cancelada' })
        .eq('id', invitacionId)

      if (error) throw error

      alert('✅ Invitación cancelada')
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al cancelar: ' + error.message)
    }
  }

  // Filtrado de coaches
  const coachesFiltrados = coaches.filter(coach => {
    const matchSearch = searchTerm === '' || 
      coach.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchTab = tabActivo === 'todos' || coach.estado === tabActivo

    return matchSearch && matchTab
  })

  // Calcular estadísticas
  const stats = {
    total: coaches.length,
    activos: coaches.filter(c => c.estado === 'activo').length,
    pendientes: coaches.filter(c => c.estado === 'pendiente').length,
    inactivos: coaches.filter(c => c.estado === 'inactivo').length,
    invitaciones: invitaciones.filter(i => i.estado === 'pendiente').length
  }

  if (authLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  if (loading && coaches.length === 0) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#AE3F21' }} />
            <p style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Cargando coaches...
            </p>
          </div>
        </Card>
      </DashboardLayout>
    )
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
                Total
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#22c55e' }}>
                {stats.activos}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Activos
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#f59e0b' }}>
                {stats.pendientes}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Pendientes
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#6b7280' }}>
                {stats.inactivos}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Inactivos
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1" style={{ color: '#AE3F21' }}>
                {stats.invitaciones}
              </p>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Invitaciones
              </p>
            </div>
          </Card>
        </div>

        {/* Búsqueda y Filtros */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(42, 42, 42, 0.8)',
                  border: '1px solid rgba(156, 122, 94, 0.3)',
                  color: '#FFFCF3'
                }}
              />
            </div>

            {/* Tabs de Filtrado */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'activo', label: 'Activos' },
                { key: 'pendiente', label: 'Pendientes' },
                { key: 'inactivo', label: 'Inactivos' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTabActivo(tab.key)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: tabActivo === tab.key ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                    color: tabActivo === tab.key ? '#FFFCF3' : '#B39A72',
                    border: `1px solid ${tabActivo === tab.key ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)'}`
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Lista de Coaches */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(156, 122, 94, 0.3)' }}>
                  <th className="text-left py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Coach
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Email
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Estado
                  </th>
                  <th className="text-left py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Fecha Registro
                  </th>
                  <th className="text-right py-3 px-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {coachesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: '#B39A72' }}>
                      {searchTerm ? 'No se encontraron coaches con ese criterio' : 'No hay coaches registrados'}
                    </td>
                  </tr>
                ) : (
                  coachesFiltrados.map(coach => (
                    <tr 
                      key={coach.id} 
                      className="border-b hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            {coach.nombre} {coach.apellidos}
                          </p>
                          <p className="text-xs" style={{ color: '#B39A72' }}>
                            {coach.años_experiencia} años de exp.
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: '#B39A72' }}>
                          {coach.email}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                          background: coach.categoria === 'cycling' ? 'rgba(174, 63, 33, 0.2)' : 
                                     coach.categoria === 'funcional' ? 'rgba(34, 197, 94, 0.2)' :
                                     'rgba(59, 130, 246, 0.2)',
                          color: coach.categoria === 'cycling' ? '#AE3F21' : 
                                coach.categoria === 'funcional' ? '#22c55e' : '#3b82f6'
                        }}>
                          {coach.categoria}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                          background: coach.estado === 'activo' ? 'rgba(34, 197, 94, 0.2)' : 
                                     coach.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.2)' :
                                     'rgba(107, 114, 128, 0.2)',
                          color: coach.estado === 'activo' ? '#22c55e' : 
                                coach.estado === 'pendiente' ? '#f59e0b' : '#6b7280'
                        }}>
                          {coach.estado}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: '#B39A72' }}>
                          {new Date(coach.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* ← ✨ NUEVO: Botón de editar coach */}
                          <button
                            onClick={() => handleEditarCoach(coach)}
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                            title="Editar coach"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => handleEliminarCoach(coach.id)}
                            disabled={deleting === coach.id}
                            className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                            title="Eliminar coach"
                          >
                            {deleting === coach.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invitaciones Pendientes */}
        {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Invitaciones Pendientes
            </h2>
            <div className="space-y-3">
              {invitaciones
                .filter(i => i.estado === 'pendiente')
                .map(inv => (
                  <div 
                    key={inv.id}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: '#FFFCF3' }}>
                        {inv.email}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72' }}>
                        Categoría: {inv.categoria} • Expira: {new Date(inv.fecha_expiracion).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReenviarInvitacion(inv.id)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                        title="Reenviar invitación"
                      >
                        <Send size={18} />
                      </button>
                      <button
                        onClick={() => handleCancelarInvitacion(inv.id)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                        title="Cancelar invitación"
                      >
                        <Ban size={18} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Invitar Coach */}
      <InvitarCoachModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false)
          loadData()
        }}
      />

      {/* ← ✨ NUEVO: Modal de Edición de Coach */}
      <EditarCoachAdminModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        coach={coachAEditar}
        onSuccess={handleSuccessEdit}
      />
    </DashboardLayout>
  )
}