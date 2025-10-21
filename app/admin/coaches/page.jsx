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

      // QUERY ARREGLADO: JOIN con profiles para obtener datos básicos
      const { data, error } = await supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles!inner(
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
        console.error(' ❌ Error de Supabase:', error)
        throw error
      }

      console.log('✅ Coaches cargados:', data?.length || 0)
      
      // Transformar datos para que sean más fáciles de usar
      const coachesTransformados = (data || []).map(coach => ({
        ...coach,
        // Extraer campos de profile al nivel principal
        email: coach.profile.email,
        nombre: coach.profile.nombre,
        apellidos: coach.profile.apellidos,
        telefono: coach.profile.telefono,
        avatar_url: coach.profile.avatar_url
      }))

      setCoaches(coachesTransformados)
      setError(null)
    } catch (error) {
      console.error(' 💥 Error al cargar coaches:', error)
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
          invitado_por:profiles!coach_invitations_invitado_por_fkey(nombre, apellidos)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Cargando coaches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <p className="text-red-600 font-semibold mb-2">⚠️ Error</p>
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Gestión de Coaches</h1>
            <p className="text-secondary">Administra tu equipo de entrenadores</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            + Invitar Coach
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-secondary mb-1">Total</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-secondary mb-1">Activos</p>
            <p className="text-3xl font-bold text-green-600">{stats.activos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-secondary mb-1">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-secondary mb-1">Inactivos</p>
            <p className="text-3xl font-bold text-gray-600">{stats.inactivos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-secondary mb-1">Head Coaches</p>
            <p className="text-3xl font-bold text-primary">{stats.headCoaches}</p>
          </div>
        </div>

        {/* Tabs y Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {/* Tabs */}
            <div className="flex gap-2">
              {['todos', 'activos', 'pendientes', 'inactivos', 'head'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTabActivo(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    tabActivo === tab
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'todos' && 'Todos'}
                  {tab === 'activos' && 'Activos'}
                  {tab === 'pendientes' && 'Pendientes'}
                  {tab === 'inactivos' && 'Inactivos'}
                  {tab === 'head' && 'Head Coaches'}
                  {tab !== 'todos' && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                      {tab === 'activos' && stats.activos}
                      {tab === 'pendientes' && stats.pendientes}
                      {tab === 'inactivos' && stats.inactivos}
                      {tab === 'head' && stats.headCoaches}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Buscar coach..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todas">Todas las categorías</option>
                <option value="cycling">Cycling</option>
                <option value="funcional">Funcional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Coaches */}
        {coachesFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">No se encontraron coaches</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachesFiltrados.map(coach => (
              <div
                key={coach.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/coaches/${coach.id}`)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {coach.nombre?.[0]}{coach.apellidos?.[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-primary mb-1">
                      {coach.nombre} {coach.apellidos}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      coach.estado === 'activo' ? 'bg-green-100 text-green-700' :
                      coach.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {coach.estado}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-secondary">
                  <p>📧 {coach.email}</p>
                  <p>📱 {coach.telefono || 'Sin teléfono'}</p>
                  {coach.es_head_coach && (
                    <p className="text-primary font-semibold">
                      🏆 Head Coach - {coach.categoria_head}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sección de Invitaciones Pendientes */}
        {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Invitaciones Pendientes</h2>
            <div className="space-y-3">
              {invitaciones.filter(i => i.estado === 'pendiente').map(inv => {
                const diasRestantes = Math.ceil((new Date(inv.expira_en) - new Date()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={inv.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-primary">{inv.email}</p>
                      <p className="text-sm text-secondary">
                        Categoría: {inv.categoria} • Expira en {diasRestantes} días
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Reenviar
                      </button>
                      <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de invitación */}
      {showInviteModal && (
        <InviteCoachModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            fetchInvitaciones()
          }}
        />
      )}
    </div>
  )
}
