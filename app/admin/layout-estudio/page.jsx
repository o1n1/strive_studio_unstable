'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle, Wrench, Power } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function LayoutEstudioPage() {
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [salas, setSalas] = useState([])
  const [salaSeleccionada, setSalaSeleccionada] = useState(null)
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [spotEditando, setSpotEditando] = useState(null)
  const [formData, setFormData] = useState({
    numero: '',
    estado: 'disponible',
    notas: ''
  })

  // Función para obtener el nombre según tipo de sala
  const getNombreSpot = (tipo) => {
    return tipo === 'cycling' ? 'Bici' : 'Tapete'
  }

  const getNombreSpotPlural = (tipo) => {
    return tipo === 'cycling' ? 'bicis' : 'tapetes'
  }

  useEffect(() => {
    if (isAuthorized) {
      fetchSalas()
    }
  }, [isAuthorized])

  useEffect(() => {
    if (salaSeleccionada) {
      fetchSpots()
      
      // Suscripción a cambios en tiempo real
      const channel = supabase
        .channel(`spots-${salaSeleccionada.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'spots', 
            filter: `room_id=eq.${salaSeleccionada.id}` 
          },
          (payload) => {
            console.log('Cambio en tiempo real:', payload)
            fetchSpots()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [salaSeleccionada])

  const fetchSalas = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      setSalas(data || [])
      if (data && data.length > 0) {
        setSalaSeleccionada(data[0])
      }
    } catch (error) {
      console.error('Error al cargar salas:', error)
      alert('Error al cargar las salas')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpots = async () => {
    if (!salaSeleccionada) return
    
    try {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .eq('room_id', salaSeleccionada.id)
        .order('numero')

      if (error) throw error
      setSpots(data || [])
    } catch (error) {
      console.error('Error al cargar spots:', error)
      alert('Error al cargar los spots')
    }
  }

  const handleOpenEditModal = (spot) => {
    setSpotEditando(spot)
    setFormData({
      numero: spot.numero.toString(),
      estado: spot.estado,
      notas: spot.notas || ''
    })
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSpotEditando(null)
    setFormData({
      numero: '',
      estado: 'disponible',
      notas: ''
    })
  }

  const handleUpdateSpot = async (e) => {
    e.preventDefault()
    if (!spotEditando) return

    try {
      const { error } = await supabase
        .from('spots')
        .update({
          numero: parseInt(formData.numero),
          estado: formData.estado,
          notas: formData.notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', spotEditando.id)

      if (error) throw error
      
      handleCloseEditModal()
      // Recargar inmediatamente
      await fetchSpots()
    } catch (error) {
      console.error('Error al actualizar spot:', error)
      alert('Error al actualizar el spot')
    }
  }

  const handleAgregarBici = async () => {
    if (!salaSeleccionada) return

    try {
      // Obtener el siguiente número disponible
      const maxNumero = spots.length > 0 ? Math.max(...spots.map(s => s.numero)) : 0
      
      const { error } = await supabase
        .from('spots')
        .insert({
          room_id: salaSeleccionada.id,
          numero: maxNumero + 1,
          tipo: salaSeleccionada.tipo === 'cycling' ? 'bike' : 'mat',
          estado: 'disponible'
        })

      if (error) throw error
      
      // Recargar inmediatamente después de agregar
      await fetchSpots()
    } catch (error) {
      console.error('Error al agregar spot:', error)
      alert(`Error al agregar ${getNombreSpot(salaSeleccionada.tipo).toLowerCase()}`)
    }
  }

  const handleEliminarBici = async (spotId) => {
    const nombreSpot = getNombreSpot(salaSeleccionada?.tipo).toLowerCase()
    if (!confirm(`¿Estás seguro de eliminar este ${nombreSpot}? Esta acción no se puede deshacer.`)) return

    try {
      const { error } = await supabase
        .from('spots')
        .delete()
        .eq('id', spotId)

      if (error) throw error
      
      handleCloseEditModal()
      // Recargar inmediatamente después de eliminar
      await fetchSpots()
    } catch (error) {
      console.error('Error al eliminar spot:', error)
      alert(`Error al eliminar ${nombreSpot}`)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible': return '#10b981'
      case 'mantenimiento': return '#f59e0b'
      case 'reparacion': return '#ef4444'
      case 'inactivo': return '#6b7280'
      default: return '#9C7A5E'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'disponible': return CheckCircle
      case 'mantenimiento': return Wrench
      case 'reparacion': return AlertCircle
      case 'inactivo': return Power
      default: return CheckCircle
    }
  }

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'disponible': return 'Disponible'
      case 'mantenimiento': return 'Mantenimiento'
      case 'reparacion': return 'Reparación'
      case 'inactivo': return 'Inactivo'
      default: return estado
    }
  }

  // Calcular estadísticas
  const stats = {
    total: spots.length,
    disponibles: spots.filter(s => s.estado === 'disponible').length,
    mantenimiento: spots.filter(s => s.estado === 'mantenimiento').length,
    reparacion: spots.filter(s => s.estado === 'reparacion').length,
    inactivas: spots.filter(s => s.estado === 'inactivo').length
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
              Layout del Estudio
            </h1>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Gestiona la disponibilidad y estado de todos los espacios
            </p>
          </div>
          <Button onClick={handleAgregarBici} disabled={!salaSeleccionada}>
            <Plus size={20} />
            Agregar {salaSeleccionada ? getNombreSpot(salaSeleccionada.tipo) : 'Spot'}
          </Button>
        </div>

        {/* Selector de sala */}
        {salas.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {salas.map((sala) => (
              <button
                key={sala.id}
                onClick={() => setSalaSeleccionada(sala)}
                className="px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all"
                style={{
                  background: salaSeleccionada?.id === sala.id ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                  color: salaSeleccionada?.id === sala.id ? '#FFFCF3' : '#B39A72',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                {sala.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.disponibles}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Disponibles
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                <Wrench size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.mantenimiento}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Mantenimiento
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.reparacion}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Reparación
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(107, 114, 128, 0.2)' }}>
                <Power size={20} style={{ color: '#6b7280' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.inactivas}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Inactivos
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Grid de bicis/tapetes */}
        {salaSeleccionada && (
          <Card>
            {spots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  No hay {getNombreSpotPlural(salaSeleccionada.tipo)} en esta sala
                </p>
                <p className="text-sm opacity-70 mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Comienza agregando el primer {getNombreSpot(salaSeleccionada.tipo).toLowerCase()}
                </p>
                <Button onClick={handleAgregarBici}>
                  <Plus size={20} />
                  Agregar Primer {getNombreSpot(salaSeleccionada.tipo)}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {spots.map((spot) => {
                  const Icon = getEstadoIcon(spot.estado)
                  return (
                    <div
                      key={spot.id}
                      onClick={() => handleOpenEditModal(spot)}
                      className="aspect-square rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
                      style={{
                        background: `${getEstadoColor(spot.estado)}20`,
                        border: `2px solid ${getEstadoColor(spot.estado)}40`
                      }}
                    >
                      <Icon size={24} style={{ color: getEstadoColor(spot.estado) }} />
                      <p className="text-2xl font-bold mt-2" style={{ color: getEstadoColor(spot.estado), fontFamily: 'Montserrat, sans-serif' }}>
                        {spot.numero}
                      </p>
                      <p className="text-xs opacity-70 text-center" style={{ color: getEstadoColor(spot.estado), fontFamily: 'Montserrat, sans-serif' }}>
                        {getEstadoLabel(spot.estado)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modal de edición */}
      {showEditModal && spotEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleCloseEditModal}>
          <div 
            className="w-full max-w-md backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
            style={{ 
              background: 'rgba(53, 53, 53, 0.95)',
              border: '1px solid rgba(156, 122, 94, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Editar {getNombreSpot(salaSeleccionada?.tipo)} #{spotEditando.numero}
            </h2>

            <form onSubmit={handleUpdateSpot} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Número
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <option value="disponible" style={{ background: '#353535' }}>🟢 Disponible</option>
                  <option value="mantenimiento" style={{ background: '#353535' }}>🟡 Mantenimiento</option>
                  <option value="reparacion" style={{ background: '#353535' }}>🔴 Reparación</option>
                  <option value="inactivo" style={{ background: '#353535' }}>⚫ Inactivo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Ej: Necesita ajuste de asiento"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleEliminarBici(spotEditando.id)}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all hover:opacity-90"
                  style={{
                    background: '#AE3F21',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
