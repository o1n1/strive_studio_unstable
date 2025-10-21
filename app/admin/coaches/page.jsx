'use client'

import { useState, useEffect } from 'react'
import { Plus, Mail, Calendar, X, Send, Loader2, RefreshCw, Ban, UserCog, Filter } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { useRouter } from 'next/navigation'

export default function CoachesPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [loading, setLoading] = useState(true)
  const [coaches, setCoaches] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [tabActivo, setTabActivo] = useState('todos')
  const [error, setError] = useState(null)

  // Form data para modal
  const [formData, setFormData] = useState({
    email: '',
    categoria: 'cycling',
    expiracion: '7',
    mensaje: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized])

  const loadData = async () => {
    await Promise.all([fetchCoaches(), fetchInvitaciones()])
  }

  const fetchCoaches = async () => {
    try {
      setLoading(true)
      console.log('📥 Cargando coaches...')
      
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
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const coachesTransformados = (data || []).map(coach => ({
        ...coach,
        email: coach.profile?.email || '',
        nombre: coach.profile?.nombre || '',
        apellidos: coach.profile?.apellidos || '',
        telefono: coach.profile?.telefono || '',
        avatar_url: coach.profile?.avatar_url || null
      }))

      setCoaches(coachesTransformados)
      console.log('✅ Coaches cargados:', coachesTransformados.length)
    } catch (error) {
      console.error('Error al cargar coaches:', error)
      setError('Error al cargar coaches')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitaciones = async () => {
    try {
      console.log('📥 Cargando invitaciones...')
      
      const { data, error } = await supabase
        .from('coach_invitations')
        .select(`
          *,
          invitador:profiles!coach_invitations_invitado_por_fkey(nombre, apellidos)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvitaciones(data || [])
      console.log('✅ Invitaciones cargadas:', data?.length || 0)
    } catch (error) {
      console.error('Error al cargar invitaciones:', error)
    }
  }

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    
    // Validar
    const errors = {}
    if (!formData.email) errors.email = 'Email requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email inválido'
    if (!formData.categoria) errors.categoria = 'Categoría requerida'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSendingInvite(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('No hay sesión activa')
        return
      }

      const response = await fetch('/api/coaches/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación')
      }

      alert('✅ Invitación enviada exitosamente')
      setShowInviteModal(false)
      setFormData({ email: '', categoria: 'cycling', expiracion: '7', mensaje: '' })
      setFormErrors({})
      fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert(error.message || 'Error al enviar la invitación')
    } finally {
      setSendingInvite(false)
    }
  }

  const handleReenviarInvitacion = async (invitacionId) => {
    if (!confirm('¿Reenviar esta invitación?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/coaches/invite/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invitationId: invitacionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar')
      }

      alert('✅ Invitación reenviada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert(error.message)
    }
  }

  const handleCancelarInvitacion = async (invitacionId) => {
    if (!confirm('¿Cancelar esta invitación? Esta acción no se puede deshacer.')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/coaches/invite/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invitationId: invitacionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar')
      }

      alert('✅ Invitación cancelada')
      fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert(error.message)
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Gestión de Coaches
            </h1>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Administra coaches e invitaciones
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus size={20} />
            Invitar Coach
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.total}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Total
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.activos}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Activos
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.pendientes}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Pendientes
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.inactivos}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Inactivos
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.headCoaches}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Head Coaches
              </p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['todos', 'activos', 'pendientes', 'inactivos', 'head'].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className="px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all capitalize"
              style={{
                background: tabActivo === tab ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                color: tabActivo === tab ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {tab === 'head' ? 'Head Coaches' : tab}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
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
            className="px-4 py-3 rounded-xl text-sm"
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

        {/* Coaches Grid */}
        {coachesFiltrados.length === 0 && coaches.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UserCog size={48} style={{ color: '#9C7A5E', margin: '0 auto 16px' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No hay coaches registrados
              </p>
              <p className="text-sm opacity-70 mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Comienza invitando coaches al estudio
              </p>
              <Button onClick={() => setShowInviteModal(true)}>
                <Plus size={20} />
                Invitar Primer Coach
              </Button>
            </div>
          </Card>
        ) : coachesFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                No se encontraron coaches con los filtros aplicados
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coachesFiltrados.map((coach) => (
              <Card key={coach.id} className="cursor-pointer hover:opacity-80 transition-all"
                onClick={() => router.push(`/admin/coaches/${coach.id}`)}>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ 
                      background: 'rgba(174, 63, 33, 0.2)',
                      color: '#AE3F21'
                    }}>
                    {coach.avatar_url ? (
                      <img src={coach.avatar_url} alt={coach.nombre} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      coach.nombre?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {coach.nombre} {coach.apellidos}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
                        style={{
                          background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' :
                                     coach.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.2)' : 
                                     'rgba(107, 114, 128, 0.2)',
                          color: coach.estado === 'activo' ? '#10b981' :
                                coach.estado === 'pendiente' ? '#f59e0b' : '#6b7280'
                        }}>
                        {coach.estado}
                      </span>
                    </div>
                    {coach.es_head_coach && (
                      <div className="mb-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}>
                          🏆 Head Coach
                        </span>
                      </div>
                    )}
                    <p className="text-sm mb-1 truncate" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {coach.email}
                    </p>
                    {coach.telefono && (
                      <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {coach.telefono}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Invitaciones Pendientes */}
        {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Invitaciones Pendientes
            </h2>
            <div className="space-y-3">
              {invitaciones.filter(i => i.estado === 'pendiente').map((inv) => {
                const diasRestantes = Math.ceil((new Date(inv.expira_en) - new Date()) / (1000 * 60 * 60 * 24))
                
                return (
                  <Card key={inv.id}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {inv.email}
                        </p>
                        <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          <span className="inline-block px-2 py-1 rounded text-xs mr-2"
                            style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}>
                            {inv.categoria}
                          </span>
                          Expira en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReenviarInvitacion(inv.id)}
                          className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-80"
                          style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                          <RefreshCw size={16} />
                          Reenviar
                        </button>
                        <button
                          onClick={() => handleCancelarInvitacion(inv.id)}
                          className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-80"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          <Ban size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => !sendingInvite && setShowInviteModal(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <Card>
              <form onSubmit={handleInviteSubmit} className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b"
                  style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      Invitar Nuevo Coach
                    </h3>
                    <p className="text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Envía una invitación por email
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    disabled={sendingInvite}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                    style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
                    <X size={18} style={{ color: '#B39A72' }} />
                  </button>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <Mail size={16} style={{ color: '#AE3F21' }} />
                    Email del Coach *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="coach@ejemplo.com"
                    disabled={sendingInvite}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: formErrors.email ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <UserCog size={16} style={{ color: '#AE3F21' }} />
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    disabled={sendingInvite}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    required>
                    <option value="cycling">🚴 Cycling</option>
                    <option value="funcional">💪 Funcional</option>
                    <option value="ambos">🔥 Ambos</option>
                  </select>
                </div>

                {/* Expiración */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <Calendar size={16} style={{ color: '#AE3F21' }} />
                    Link Válido Por
                  </label>
                  <select
                    value={formData.expiracion}
                    onChange={(e) => setFormData({ ...formData, expiracion: e.target.value })}
                    disabled={sendingInvite}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                    <option value="7">7 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                  </select>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                    style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    <Send size={16} style={{ color: '#AE3F21' }} />
                    Mensaje Personalizado (Opcional)
                  </label>
                  <textarea
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    placeholder="Ej: Estamos emocionados de que te unas a nuestro equipo..."
                    disabled={sendingInvite}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    disabled={sendingInvite}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: 'rgba(156, 122, 94, 0.2)',
                      color: '#B39A72',
                      fontFamily: 'Montserrat, sans-serif',
                      cursor: sendingInvite ? 'not-allowed' : 'pointer',
                      opacity: sendingInvite ? 0.5 : 1
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: sendingInvite ? 'rgba(174, 63, 33, 0.5)' : '#AE3F21',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif',
                      cursor: sendingInvite ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
