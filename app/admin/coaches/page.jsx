'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Search, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import InvitarCoachModal from '@/components/admin/InvitarCoachModal'
import { authenticatedFetch } from '@/lib/auth-helper'

export default function CoachesPage() {
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState('todos')
  const [showInvitarModal, setShowInvitarModal] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  useEffect(() => {
    if (isAuthorized) {
      fetchCoaches()
      fetchInvitaciones()
    }
  }, [isAuthorized])

  const fetchCoaches = async () => {
    try {
      const { data: coachesData, error } = await supabase
        .from('coaches')
        .select(`
          *,
          profiles!inner(id, email, nombre, apellidos, telefono, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const coachesFormateados = coachesData.map(coach => ({
        ...coach,
        email: coach.profiles.email,
        nombre: coach.profiles.nombre,
        apellidos: coach.profiles.apellidos,
        telefono: coach.profiles.telefono,
        avatar_url: coach.profiles.avatar_url
      }))

      setCoaches(coachesFormateados)
    } catch (error) {
      console.error('Error al cargar coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_invitations')
        .select(`
          *,
          invitado_por:profiles!coach_invitations_invitado_por_fkey(nombre, apellidos)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitaciones(data || [])
    } catch (error) {
      console.error('Error al cargar invitaciones:', error)
    }
  }

  const stats = {
    total: coaches.length,
    activos: coaches.filter(c => c.estado === 'activo').length,
    pendientes: coaches.filter(c => c.estado === 'pendiente').length + invitaciones.filter(i => i.estado === 'pendiente').length,
    inactivos: coaches.filter(c => c.estado === 'inactivo').length,
    headCoaches: coaches.filter(c => c.es_head_coach).length
  }

  const coachesFiltrados = coaches.filter(coach => {
    const matchSearch = `${coach.nombre} ${coach.apellidos} ${coach.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = filtroCategoria === 'todas' || coach.categoria_head === filtroCategoria
    const matchTab = 
      tabActivo === 'todos' ||
      (tabActivo === 'activos' && coach.estado === 'activo') ||
      (tabActivo === 'pendientes' && coach.estado === 'pendiente') ||
      (tabActivo === 'inactivos' && coach.estado === 'inactivo') ||
      (tabActivo === 'head' && coach.es_head_coach)
    
    return matchSearch && matchCategoria && matchTab
  })

  const invitacionesFiltradas = invitaciones.filter(inv => {
    return tabActivo === 'todos' || tabActivo === 'pendientes'
  })

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                <Users size={24} style={{ color: '#AE3F21' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Gestión de Coaches
                </h2>
                <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Administra coaches e invitaciones
                </p>
              </div>
            </div>
            <Button onClick={() => setShowInvitarModal(true)}>
              <UserPlus size={18} />
              Invitar Coach
            </Button>
          </div>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                <Users size={20} style={{ color: '#AE3F21' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.total}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Total
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.activos}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Activos
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                <Clock size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.pendientes}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Pendientes
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(107, 114, 128, 0.2)' }}>
                <XCircle size={20} style={{ color: '#6b7280' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.inactivos}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Inactivos
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                <AlertCircle size={20} style={{ color: '#AE3F21' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.headCoaches}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Head Coaches
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs y Filtros */}
        <Card>
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'todos', label: 'Todos', count: stats.total },
                { id: 'activos', label: 'Activos', count: stats.activos },
                { id: 'pendientes', label: 'Pendientes', count: stats.pendientes },
                { id: 'inactivos', label: 'Inactivos', count: stats.inactivos },
                { id: 'head', label: 'Head Coaches', count: stats.headCoaches }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all"
                  style={{
                    background: tabActivo === tab.id ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                    color: tabActivo === tab.id ? '#FFFCF3' : '#B39A72',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {tab.label}
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: '#B39A72' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                  style={{
                    background: 'rgba(156, 122, 94, 0.1)',
                    border: '1px solid rgba(156, 122, 94, 0.2)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                <option value="todas">Todas las categorías</option>
                <option value="cycling">Cycling</option>
                <option value="funcional">Funcional</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Lista de Invitaciones Pendientes */}
        {(tabActivo === 'todos' || tabActivo === 'pendientes') && invitacionesFiltradas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Invitaciones Pendientes
            </h3>
            {invitacionesFiltradas.map(inv => (
              <InvitacionCard 
                key={inv.id} 
                invitacion={inv} 
                onUpdate={fetchInvitaciones}
              />
            ))}
          </div>
        )}

        {/* Lista de Coaches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coachesFiltrados.map(coach => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        {coachesFiltrados.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No se encontraron coaches
              </p>
              <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Intenta cambiar los filtros o invita a tu primer coach
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Invitar Coach */}
      {showInvitarModal && (
        <InvitarCoachModal
          onClose={() => setShowInvitarModal(false)}
          onSuccess={() => {
            fetchInvitaciones()
            setShowInvitarModal(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}

function CoachCard({ coach }) {
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activo': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }
      case 'pendiente': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
      case 'inactivo': return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' }
      case 'suspendido': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
      default: return { bg: 'rgba(156, 122, 94, 0.2)', color: '#9C7A5E' }
    }
  }

  const estadoStyle = getEstadoColor(coach.estado)

  return (
    <Card>
      <div className="space-y-4">
        {/* Header con Avatar y Estado */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt={coach.nombre} 
                className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                <Users size={24} style={{ color: '#AE3F21' }} />
              </div>
            )}
            <div>
              <h3 className="font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.nombre} {coach.apellidos}
              </h3>
              {coach.es_head_coach && (
                <span className="text-xs px-2 py-1 rounded-full inline-block mt-1"
                  style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  🏆 Head Coach {coach.categoria_head}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: estadoStyle.bg, color: estadoStyle.color, fontFamily: 'Montserrat, sans-serif' }}>
            {coach.estado}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          <p>📧 {coach.email}</p>
          {coach.telefono && <p>📱 {coach.telefono}</p>}
          {coach.especialidades && (
            <p>🎯 {coach.especialidades.join(', ')}</p>
          )}
          <div className="flex items-center gap-4 pt-2">
            <span>📊 {coach.total_clases || 0} clases</span>
            <span>⭐ {(coach.rating_promedio || 0).toFixed(1)}/5</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1 text-sm">
            Ver Perfil
          </Button>
          <Button variant="secondary" className="flex-1 text-sm">
            💰 Pagos
          </Button>
        </div>
      </div>
    </Card>
  )
}

function InvitacionCard({ invitacion, onUpdate }) {
  const [reenviando, setReenviando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const getEstadoInfo = (estado) => {
    switch(estado) {
      case 'pendiente':
        const diasRestantes = Math.ceil((new Date(invitacion.expira_en) - new Date()) / (1000 * 60 * 60 * 24))
        return { 
          icon: Clock, 
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.2)',
          texto: `Expira en ${diasRestantes} días`
        }
      case 'usado': return { icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', texto: 'Usado' }
      case 'expirado': return { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', texto: 'Expirado' }
      case 'cancelado': return { icon: XCircle, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)', texto: 'Cancelado' }
      default: return { icon: AlertCircle, color: '#9C7A5E', bg: 'rgba(156, 122, 94, 0.2)', texto: estado }
    }
  }

  const handleReenviar = async () => {
    setReenviando(true)
    try {
      const response = await authenticatedFetch('/api/coaches/invite/resend', {
        method: 'POST',
        body: JSON.stringify({ invitationId: invitacion.id })
      })

      if (!response.ok) throw new Error('Error al reenviar')
      
      alert('Invitación reenviada exitosamente')
      onUpdate()
    } catch (error) {
      console.error('Error:', error)
      alert(error.message || 'Error al reenviar la invitación')
    } finally {
      setReenviando(false)
    }
  }

  const handleCancelar = async () => {
    if (!confirm('¿Estás seguro de cancelar esta invitación?')) return

    setCancelando(true)
    try {
      const response = await authenticatedFetch('/api/coaches/invite/cancel', {
        method: 'POST',
        body: JSON.stringify({ invitationId: invitacion.id })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cancelar')
      }
      
      alert('Invitación cancelada exitosamente')
      onUpdate()
    } catch (error) {
      console.error('Error:', error)
      alert(error.message || 'Error al cancelar la invitación')
    } finally {
      setCancelando(false)
    }
  }

  const estadoInfo = getEstadoInfo(invitacion.estado)
  const Icon = estadoInfo.icon

  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: estadoInfo.bg }}>
            <Icon size={20} style={{ color: estadoInfo.color }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {invitacion.email}
            </p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <span>📂 {invitacion.categoria}</span>
              <span>• {estadoInfo.texto}</span>
              {invitacion.invitado_por && (
                <span>• Por: {invitacion.invitado_por.nombre}</span>
              )}
            </div>
          </div>
        </div>
        
        {invitacion.estado === 'pendiente' && (
          <div className="flex gap-2">
            <button
              onClick={handleReenviar}
              disabled={reenviando}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(174, 63, 33, 0.2)',
                color: '#AE3F21',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {reenviando ? 'Enviando...' : 'Reenviar'}
            </button>
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {cancelando ? 'Cancelando...' : 'Cancelar'}
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
