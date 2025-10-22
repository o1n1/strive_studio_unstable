'use client'

import { useState, useEffect } from 'react'
import { Plus, Mail, Calendar, X, Send, Loader2, RefreshCw, Ban, UserCog, Filter, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CoachesPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [loading, setLoading] = useState(true)
  const [coaches, setCoaches] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [tabActivo, setTabActivo] = useState('pendientes')
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

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

      console.log('📊 Datos recibidos:', data)

      const coachesTransformados = (data || []).map(coach => {
        console.log('🔍 Coach:', coach.id, {
          nombre: coach.profile?.nombre,
          apellidos: coach.profile?.apellidos,
          email: coach.profile?.email,
          foto_profesional_url: coach.foto_profesional_url
        })
        
        return {
          ...coach,
          email: coach.profile?.email || '',
          nombre: coach.profile?.nombre || '',
          apellidos: coach.profile?.apellidos || '',
          telefono: coach.profile?.telefono || '',
          foto_url: coach.foto_profesional_url || coach.profile?.avatar_url || null
        }
      })

      console.log('✅ Coaches transformados:', coachesTransformados)
      setCoaches(coachesTransformados)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error cargando coaches:', error)
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

  const handleSendInvite = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email requerido'
    if (!formData.categoria) newErrors.categoria = 'Categoría requerida'
    
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors)
      return
    }

    setSendingInvite(true)
    setFormErrors({})

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/coaches/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar invitación')
      }

      alert('✅ Invitación enviada exitosamente')
      setShowInviteModal(false)
      setFormData({ email: '', categoria: 'cycling', expiracion: '7', mensaje: '' })
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      setFormErrors({ submit: error.message })
    } finally {
      setSendingInvite(false)
    }
  }

  const handleReenviarInvitacion = async (invitacionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/coaches/invite/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ invitacionId })
      })

      if (!response.ok) throw new Error('Error al reenviar')
      
      alert('✅ Invitación reenviada')
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reenviar invitación')
    }
  }

  const handleCancelarInvitacion = async (invitacionId) => {
    if (!confirm('¿Cancelar esta invitación?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/coaches/invite/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ invitacionId })
      })

      if (!response.ok) throw new Error('Error al cancelar')
      
      alert('✅ Invitación cancelada')
      await fetchInvitaciones()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cancelar invitación')
    }
  }

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
          <div className="flex gap-3">
            <Button onClick={loadData} variant="secondary">
              <RefreshCw size={20} />
              Actualizar
            </Button>
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus size={20} />
              Invitar Coach
            </Button>
          </div>
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
            <div className="text-center relative">
              <p className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.pendientes}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Pendientes
              </p>
              {stats.pendientes > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center animate-pulse"
                  style={{ background: '#f59e0b' }}>
                  <span className="text-xs font-bold" style={{ color: '#1a1a1a' }}>!</span>
                </div>
              )}
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
              <p className="text-2xl font-bold" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.invitacionesPendientes}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Invitaciones
              </p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['todos', 'pendientes', 'activos', 'inactivos'].map(tab => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className="px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all relative"
              style={{
                background: tabActivo === tab ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                color: tabActivo === tab ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pendientes' && stats.pendientes > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: '#f59e0b', color: '#1a1a1a' }}>
                  {stats.pendientes}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
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

        {/* Lista de Coaches */}
        {coachesFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UserCog size={48} style={{ color: '#9C7A5E', margin: '0 auto 16px' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No hay coaches en esta categoría
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coachesFiltrados.map(coach => (
              <Card key={coach.id}>
                <div className="flex items-start gap-4">
                  {/* Avatar - CON NEXT/IMAGE OPTIMIZADO */}
                  <div className="relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden"
                    style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                    {coach.foto_url ? (
                      <Image
                        src={coach.foto_url}
                        alt={`${coach.nombre} ${coach.apellidos}`}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error('❌ Error cargando imagen:', coach.foto_url)
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#AE3F21" stroke-width="2" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
                        }}
                      />
                    ) : (
                      <UserCog size={32} style={{ color: '#AE3F21', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.nombre || 'Sin nombre'} {coach.apellidos || ''}
                        </h3>
                        <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {coach.email || 'Sin email'}
                        </p>
                      </div>
                      
                      {/* Estado badge */}
                      <div className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: coach.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 
                                     coach.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.2)' :
                                     'rgba(107, 114, 128, 0.2)',
                          color: coach.estado === 'activo' ? '#10b981' : 
                                 coach.estado === 'pendiente' ? '#f59e0b' : 
                                 '#6b7280'
                        }}>
                        {coach.estado === 'activo' ? '✓ Activo' : 
                         coach.estado === 'pendiente' ? '⏳ Pendiente' : 
                         '○ Inactivo'}
                      </div>
                    </div>

                    {/* Badges info */}
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      {coach.es_head_coach && (
                        <span style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                          🏆 Head Coach
                        </span>
                      )}
                      {coach.años_experiencia && (
                        <span style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          🏆 {coach.años_experiencia} años exp.
                        </span>
                      )}
                      {coach.especialidades && coach.especialidades.length > 0 && (
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
                        <>
                          <button
                            onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                            className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                            <CheckCircle size={16} />
                            Revisar y Aprobar
                          </button>
                        </>
                      )}

                      {/* Botón Eliminar (para pruebas) */}
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
            ))}
          </div>
        )}

        {/* Invitaciones Pendientes */}
        {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Invitaciones Pendientes
            </h3>
            <div className="space-y-3">
              {invitaciones.filter(i => i.estado === 'pendiente').map(inv => {
                const expiraEn = new Date(inv.expira_en)
                const diasRestantes = Math.ceil((expiraEn - new Date()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {inv.email}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {inv.categoria} • Expira en {diasRestantes} días
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReenviarInvitacion(inv.id)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                        title="Reenviar">
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => handleCancelarInvitacion(inv.id)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                        title="Cancelar">
                        <Ban size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Modal de Invitación - (mismo código que antes) */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Invitar Coach
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Email del Coach *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: formErrors.email ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    placeholder="coach@email.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                    <option value="cycling">Cycling</option>
                    <option value="funcional">Funcional</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Expiración
                  </label>
                  <select
                    value={formData.expiracion}
                    onChange={(e) => setFormData({ ...formData, expiracion: e.target.value })}
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

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Mensaje personalizado (opcional)
                  </label>
                  <textarea
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                    style={{
                      background: 'rgba(156, 122, 94, 0.1)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    placeholder="Mensaje adicional para el coach..."
                  />
                </div>

                {formErrors.submit && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                    <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                      {formErrors.submit}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                    style={{
                      background: 'rgba(156, 122, 94, 0.2)',
                      color: '#B39A72',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{
                      background: sendingInvite ? 'rgba(174, 63, 33, 0.5)' : '#AE3F21',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                    {sendingInvite ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Enviar Invitación
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}