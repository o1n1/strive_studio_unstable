'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import InvitarCoachModal from '@/components/admin/InvitarCoachModal'

export default function CoachesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [coaches, setCoaches] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [tabActivo, setTabActivo] = useState('todos')
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile || profile.rol !== 'admin') {
        router.push('/')
        return
      }

      await Promise.all([fetchCoaches(), fetchInvitaciones()])
    } catch (error) {
      console.error('💥 Error en autenticación:', error)
      setError('Error al verificar permisos')
    }
  }

  const fetchCoaches = async () => {
    try {
      console.log('📥 Cargando coaches...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('❌ Sin sesión')
        return
      }

      console.log('✅ Sesión válida, cargando coaches...')

      // ✅ QUERY CORREGIDO: coaches.id = profiles.id (relación 1:1)
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

      if (error) {
        console.error('❌ Error de Supabase:', error)
        throw error
      }

      console.log('✅ Coaches cargados:', data?.length || 0)
      
      // Transformar datos para que sean más fáciles de usar
      const coachesTransformados = (data || []).map(coach => ({
        ...coach,
        // Extraer campos de profile al nivel principal
        email: coach.profile?.email || '',
        nombre: coach.profile?.nombre || '',
        apellidos: coach.profile?.apellidos || '',
        telefono: coach.profile?.telefono || '',
        avatar_url: coach.profile?.avatar_url || null
      }))

      setCoaches(coachesTransformados)
      setError(null)
    } catch (error) {
      console.error('💥 Error al cargar coaches:', error)
      setError('Error al cargar coaches. Intenta recargar la página.')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitaciones = async () => {
    try {
      console.log('📥 Cargando invitaciones...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('❌ Error de sesión al cargar invitaciones')
        return
      }

      const { data, error } = await supabase
        .from('coach_invitations')
        .select(`
          *,
          invitador:profiles!coach_invitations_invitado_por_fkey(nombre, apellidos)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error al cargar invitaciones:', error)
        throw error
      }

      console.log('✅ Invitaciones cargadas:', data?.length || 0)
      setInvitaciones(data || [])
    } catch (error) {
      console.error('💥 Error al cargar invitaciones:', error)
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

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    fetchInvitaciones()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AE3F21] mx-auto mb-4"></div>
          <p className="text-white">Cargando coaches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#AE3F21] text-white rounded-lg hover:bg-[#8B3219] transition"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Coaches</h1>
            <p className="text-gray-400">Administra coaches e invitaciones</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-[#AE3F21] text-white rounded-lg hover:bg-[#8B3219] transition flex items-center gap-2"
          >
            <span>+</span>
            <span>Invitar Coach</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Activos</p>
            <p className="text-2xl font-bold text-green-500">{stats.activos}</p>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pendientes}</p>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Inactivos</p>
            <p className="text-2xl font-bold text-gray-500">{stats.inactivos}</p>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Head Coaches</p>
            <p className="text-2xl font-bold text-[#AE3F21]">{stats.headCoaches}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['todos', 'activos', 'pendientes', 'inactivos', 'head'].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition ${
                tabActivo === tab
                  ? 'bg-[#AE3F21] text-white'
                  : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
              }`}
            >
              {tab === 'head' ? 'Head Coaches' : tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#AE3F21]"
          />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#AE3F21]"
          >
            <option value="todas">Todas las categorías</option>
            <option value="cycling">Cycling</option>
            <option value="funcional">Funcional</option>
          </select>
        </div>

        {/* Coaches Grid */}
        {coachesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron coaches</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachesFiltrados.map((coach) => (
              <div
                key={coach.id}
                className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6 hover:border-[#AE3F21] transition cursor-pointer"
                onClick={() => router.push(`/admin/coaches/${coach.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                    {coach.avatar_url ? (
                      <img src={coach.avatar_url} alt={coach.nombre} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{coach.nombre?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {coach.nombre} {coach.apellidos}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          coach.estado === 'activo'
                            ? 'bg-green-500/20 text-green-500'
                            : coach.estado === 'pendiente'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {coach.estado}
                      </span>
                    </div>
                    {coach.es_head_coach && (
                      <span className="inline-block px-2 py-1 bg-[#AE3F21]/20 text-[#AE3F21] text-xs rounded mb-2">
                        🏆 Head Coach {coach.categoria_head}
                      </span>
                    )}
                    <p className="text-gray-400 text-sm mb-2">{coach.email}</p>
                    <p className="text-gray-400 text-sm">{coach.telefono}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invitaciones pendientes */}
        {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Invitaciones Pendientes</h2>
            <div className="space-y-4">
              {invitaciones
                .filter(i => i.estado === 'pendiente')
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-medium">{inv.email}</p>
                      <p className="text-gray-400 text-sm">
                        Categoría: {inv.categoria} • Expira: {new Date(inv.expira_en).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                        Reenviar
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de invitación */}
      {showInviteModal && (
        <InvitarCoachModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  )
}
