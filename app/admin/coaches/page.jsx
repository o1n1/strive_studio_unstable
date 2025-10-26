'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UserPlus, Search, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, Mail, AlertCircle 
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import InvitarCoachModal from '@/components/admin/InvitarCoachModal'
import EditarCoachModal from '@/components/admin/EditarCoachModal'
import { useCoaches, useApproveCoach, useRejectCoach } from '@/hooks/useCoaches'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

export default function AdminCoachesPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const { user } = useUser()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [coachAEditar, setCoachAEditar] = useState(null)
  const [invitaciones, setInvitaciones] = useState([])

  const { coaches, loading: coachesLoading, refetch } = useCoaches()
  const approveCoachMutation = useApproveCoach()
  const rejectCoachMutation = useRejectCoach()

  const loading = authLoading || coachesLoading

  const loadInvitations = async () => {
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

  const handleEditarCoach = (coach) => {
    setCoachAEditar(coach)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setCoachAEditar(null)
  }

  const handleSuccessEdit = async () => {
    await refetch()
  }

  const handleEliminarCoach = async (coachId) => {
    if (!confirm('⚠️ ESTA ACCIÓN ES IRREVERSIBLE\n\n¿Estás seguro de eliminar COMPLETAMENTE este coach?')) {
      return
    }

    try {
      const response = await fetch(`/api/coaches/${coachId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar coach')
      }

      alert('✅ Coach eliminado exitosamente')
      await refetch()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const handleAprobarCoach = async (coachId) => {
    if (!confirm('¿Aprobar este coach? Se activará su cuenta y podrá acceder al sistema.')) {
      return
    }

    try {
      await approveCoachMutation.mutateAsync({
        coachId,
        approvedBy: user?.id
      })
      
      alert('✅ Coach aprobado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al aprobar coach: ' + error.message)
    }
  }

  const handleRechazarCoach = async (coachId) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    try {
      await rejectCoachMutation.mutateAsync(coachId)
      
      alert('✅ Coach rechazado')
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const coachesFiltrados = coaches?.filter(coach => {
    const matchesSearch = 
      coach.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = estadoFilter === 'todos' || coach.estado === estadoFilter

    return matchesSearch && matchesEstado
  }) || []

  const getEstadoBadge = (estado) => {
    const badges = {
      activo: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: 'Activo' },
      pendiente: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', text: 'Pendiente' },
      inactivo: { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', text: 'Inactivo' },
      suspendido: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: 'Suspendido' },
      rechazado: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: 'Rechazado' }
    }
    const badge = badges[estado] || badges.inactivo
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold"
        style={{ background: badge.bg, color: badge.color }}>
        {badge.text}
      </span>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" 
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Gestión de Coaches
            </h1>
            <p className="text-lg mt-1" 
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Administra coaches, invitaciones y solicitudes
            </p>
          </div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <UserPlus size={18} />
            Invitar Coach
          </button>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                  style={{ color: '#B39A72' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellidos o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg outline-none"
                  style={{ 
                    background: 'rgba(42, 42, 42, 0.6)', 
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="px-4 py-2 rounded-lg outline-none cursor-pointer"
                style={{ 
                  background: 'rgba(42, 42, 42, 0.6)', 
                  border: '1px solid rgba(156, 122, 94, 0.3)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="pendiente">Pendientes</option>
                <option value="inactivo">Inactivos</option>
                <option value="suspendido">Suspendidos</option>
                <option value="rechazado">Rechazados</option>
              </select>
            </div>

            <div className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Mostrando {coachesFiltrados.length} de {coaches?.length || 0} coaches
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {coachesFiltrados.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <AlertCircle size={64} className="mx-auto mb-4" style={{ color: '#B39A72' }} />
                <h3 className="text-xl font-bold mb-2" 
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  No se encontraron coaches
                </h3>
                <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  {searchTerm || estadoFilter !== 'todos' 
                    ? 'Intenta con otros filtros de búsqueda'
                    : 'Comienza invitando a tu primer coach'}
                </p>
              </div>
            </Card>
          ) : (
            coachesFiltrados.map((coach) => (
              <Card key={coach.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}>
                      {coach.nombre?.charAt(0)}{coach.apellidos?.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold" 
                          style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.nombre} {coach.apellidos}
                        </h3>
                        {getEstadoBadge(coach.estado)}
                      </div>
                      <p className="text-sm mb-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {coach.email}
                      </p>
                      {coach.rating_promedio > 0 && (
                        <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          ⭐ {coach.rating_promedio.toFixed(1)} • {coach.total_clases || 0} clases
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {coach.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => handleAprobarCoach(coach.id)}
                          className="p-2 rounded-lg transition-all hover:opacity-80"
                          style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                          title="Aprobar">
                          <CheckCircle size={20} style={{ color: '#10b981' }} />
                        </button>
                        <button
                          onClick={() => handleRechazarCoach(coach.id)}
                          className="p-2 rounded-lg transition-all hover:opacity-80"
                          style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                          title="Rechazar">
                          <XCircle size={20} style={{ color: '#ef4444' }} />
                        </button>
                      </>
                    )}
                    
                    <Link href={`/admin/coaches/${coach.id}`}>
                      <button
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(174, 63, 33, 0.2)' }}
                        title="Ver detalles">
                        <Eye size={20} style={{ color: '#AE3F21' }} />
                      </button>
                    </Link>

                    <button
                      onClick={() => handleEditarCoach(coach)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(179, 154, 114, 0.2)' }}
                      title="Editar">
                      <Edit size={20} style={{ color: '#B39A72' }} />
                    </button>

                    <button
                      onClick={() => handleEliminarCoach(coach.id)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                      title="Eliminar">
                      <Trash2 size={20} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {showInviteModal && (
        <InvitarCoachModal 
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            loadInvitations()
          }}
        />
      )}

      {showEditModal && coachAEditar && (
        <EditarCoachModal 
          coach={coachAEditar}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccessEdit}
        />
      )}
    </DashboardLayout>
  )
}