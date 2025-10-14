'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle, Wrench, Power, LayoutGrid, List, User, UserPlus } from 'lucide-react'
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
  const [vistaActual, setVistaActual] = useState('layout')
  const [showEditModal, setShowEditModal] = useState(false)
  const [spotEditando, setSpotEditando] = useState(null)
  const [draggedSpot, setDraggedSpot] = useState(null)
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'bike',
    estado: 'disponible',
    notas: ''
  })

  // Configuración del grid
  const COLUMNAS = 8
  const FILAS = 6

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
      numero: spot.numero?.toString() || '',
      tipo: spot.tipo || 'bike',
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
      tipo: 'bike',
      estado: 'disponible',
      notas: ''
    })
  }

  const handleUpdateSpot = async (e) => {
    e.preventDefault()
    if (!spotEditando) return

    try {
      const updateData = {
        tipo: formData.tipo,
        estado: formData.estado,
        notas: formData.notas,
        updated_at: new Date().toISOString()
      }

      // Manejar el número según el tipo
      if (formData.tipo === 'coach') {
        // Si se está convirtiendo a coach y no tiene número negativo, asignar uno
        if (!spotEditando.numero || spotEditando.numero > 0) {
          const coachSpots = spots.filter(s => s.tipo === 'coach' && s.id !== spotEditando.id)
          const minNumero = coachSpots.length > 0 
            ? Math.min(...coachSpots.map(s => s.numero)) 
            : 0
          updateData.numero = minNumero <= 0 ? minNumero - 1 : -1
        }
      } else {
        // Si no es coach, usar el número del formulario
        updateData.numero = parseInt(formData.numero)
      }

      const { error } = await supabase
        .from('spots')
        .update(updateData)
        .eq('id', spotEditando.id)

      if (error) throw error
      
      handleCloseEditModal()
      await fetchSpots()
    } catch (error) {
      console.error('Error al actualizar spot:', error)
      alert('Error al actualizar el spot')
    }
  }

  const handleAgregarSpot = async (tipoSpot) => {
    if (!salaSeleccionada) return

    try {
      let numero
      if (tipoSpot === 'coach') {
        // Para coaches, usar números negativos (-1, -2, -3, etc)
        const coachSpots = spots.filter(s => s.tipo === 'coach')
        const minNumero = coachSpots.length > 0 
          ? Math.min(...coachSpots.map(s => s.numero)) 
          : 0
        numero = minNumero <= 0 ? minNumero - 1 : -1
      } else {
        const maxNumero = spots.filter(s => s.tipo !== 'coach').length > 0 
          ? Math.max(...spots.filter(s => s.tipo !== 'coach').map(s => s.numero)) 
          : 0
        numero = maxNumero + 1
      }
      
      // Encontrar primera posición vacía en el grid
      let fila = null
      let columna = null
      
      for (let f = 1; f <= FILAS; f++) {
        for (let c = 1; c <= COLUMNAS; c++) {
          const ocupado = spots.some(s => s.fila === f && s.columna === c)
          if (!ocupado) {
            fila = f
            columna = c
            break
          }
        }
        if (fila && columna) break
      }
      
      const { error } = await supabase
        .from('spots')
        .insert({
          room_id: salaSeleccionada.id,
          numero: numero,
          tipo: tipoSpot,
          estado: 'disponible',
          fila: fila,
          columna: columna
        })

      if (error) throw error
      
      await fetchSpots()
    } catch (error) {
      console.error('Error al agregar spot:', error)
      alert('Error al agregar spot')
    }
  }

  const handleEliminarSpot = async (spotId) => {
    if (!confirm('¿Estás seguro de eliminar este spot? Esta acción no se puede deshacer.')) return

    try {
      const { error } = await supabase
        .from('spots')
        .delete()
        .eq('id', spotId)

      if (error) throw error
      
      handleCloseEditModal()
      await fetchSpots()
    } catch (error) {
      console.error('Error al eliminar spot:', error)
      alert('Error al eliminar spot')
    }
  }

  // Funciones para Drag & Drop
  const handleDragStart = (e, spot) => {
    setDraggedSpot(spot)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, fila, columna) => {
    e.preventDefault()
    
    if (!draggedSpot) return

    const spotEnPosicion = spots.find(s => s.fila === fila && s.columna === columna && s.id !== draggedSpot.id)
    if (spotEnPosicion) {
      alert('Esta posición ya está ocupada')
      setDraggedSpot(null)
      return
    }

    try {
      const { error } = await supabase
        .from('spots')
        .update({
          fila: fila,
          columna: columna,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggedSpot.id)

      if (error) throw error
      
      await fetchSpots()
      setDraggedSpot(null)
    } catch (error) {
      console.error('Error al mover spot:', error)
      alert('Error al mover la posición')
      setDraggedSpot(null)
    }
  }

  const getEstadoColor = (estado, tipo) => {
    if (tipo === 'coach') return '#AE3F21'
    
    switch (estado) {
      case 'disponible': return '#10b981'
      case 'mantenimiento': return '#f59e0b'
      case 'reparacion': return '#ef4444'
      case 'inactivo': return '#6b7280'
      default: return '#9C7A5E'
    }
  }

  const getEstadoIcon = (tipo, estado) => {
    if (tipo === 'coach') return User
    
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

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'bike': return 'Bici'
      case 'mat': return 'Tapete'
      case 'coach': return 'Coach'
      case 'position': return 'Posición'
      default: return tipo
    }
  }

  // Calcular estadísticas
  const spotsClientes = spots.filter(s => s.tipo !== 'coach')
  const coaches = spots.filter(s => s.tipo === 'coach')
  
  const stats = {
    total: spotsClientes.length,
    disponibles: spotsClientes.filter(s => s.estado === 'disponible').length,
    mantenimiento: spotsClientes.filter(s => s.estado === 'mantenimiento').length,
    reparacion: spotsClientes.filter(s => s.estado === 'reparacion').length,
    inactivas: spotsClientes.filter(s => s.estado === 'inactivo').length,
    coaches: coaches.length
  }

  // Renderizar grid layout
  const renderGridLayout = () => {
    const grid = []
    
    for (let fila = 1; fila <= FILAS; fila++) {
      const row = []
      
      for (let col = 1; col <= COLUMNAS; col++) {
        const spotEnPosicion = spots.find(s => s.fila === fila && s.columna === col)
        
        if (spotEnPosicion) {
          const Icon = getEstadoIcon(spotEnPosicion.tipo, spotEnPosicion.estado)
          const color = getEstadoColor(spotEnPosicion.estado, spotEnPosicion.tipo)
          const isCoach = spotEnPosicion.tipo === 'coach'
          
          row.push(
            <div
              key={`${fila}-${col}`}
              draggable
              onDragStart={(e) => handleDragStart(e, spotEnPosicion)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, fila, col)}
              onClick={() => handleOpenEditModal(spotEnPosicion)}
              className="aspect-square rounded-xl p-2 flex flex-col items-center justify-center cursor-move transition-all hover:scale-105"
              style={{
                background: isCoach ? 'rgba(174, 63, 33, 0.2)' : `${color}20`,
                border: `2px solid ${isCoach ? 'rgba(174, 63, 33, 0.6)' : `${color}40`}`
              }}
            >
              <Icon size={20} style={{ color }} />
              {isCoach ? (
                <p className="text-xs font-bold mt-1 text-center" style={{ color, fontFamily: 'Montserrat, sans-serif' }}>
                  COACH
                </p>
              ) : (
                <p className="text-xl font-bold mt-1" style={{ color, fontFamily: 'Montserrat, sans-serif' }}>
                  {spotEnPosicion.numero}
                </p>
              )}
            </div>
          )
        } else {
          row.push(
            <div
              key={`${fila}-${col}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, fila, col)}
              className="aspect-square rounded-xl border-2 border-dashed transition-all hover:border-solid hover:bg-white/5"
              style={{
                borderColor: 'rgba(156, 122, 94, 0.2)'
              }}
            />
          )
        }
      }
      
      grid.push(
        <div key={fila} className="grid grid-cols-8 gap-2">
          {row}
        </div>
      )
    }
    
    return grid
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
              Gestiona la disponibilidad y organización visual de los espacios
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => handleAgregarSpot(salaSeleccionada?.tipo === 'cycling' ? 'bike' : 'mat')} 
              disabled={!salaSeleccionada}
            >
              <Plus size={20} />
              {salaSeleccionada ? getNombreSpot(salaSeleccionada.tipo) : 'Spot'}
            </Button>
            <Button 
              onClick={() => handleAgregarSpot('coach')} 
              disabled={!salaSeleccionada}
              variant="secondary"
            >
              <UserPlus size={20} />
              Coach
            </Button>
          </div>
        </div>

        {/* Selector de sala y vista */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

          {/* Toggle de vista */}
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActual('layout')}
              className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all"
              style={{
                background: vistaActual === 'layout' ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                color: vistaActual === 'layout' ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <LayoutGrid size={18} />
              Layout
            </button>
            <button
              onClick={() => setVistaActual('lista')}
              className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all"
              style={{
                background: vistaActual === 'lista' ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                color: vistaActual === 'lista' ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <List size={18} />
              Lista
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                <User size={20} style={{ color: '#AE3F21' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  {stats.coaches}
                </p>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Coaches
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {salaSeleccionada && (
          <Card>
            {spots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  No hay spots en esta sala
                </p>
                <p className="text-sm opacity-70 mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Comienza agregando {getNombreSpotPlural(salaSeleccionada.tipo)} y coaches
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => handleAgregarSpot(salaSeleccionada.tipo === 'cycling' ? 'bike' : 'mat')}>
                    <Plus size={20} />
                    Agregar {getNombreSpot(salaSeleccionada.tipo)}
                  </Button>
                  <Button onClick={() => handleAgregarSpot('coach')} variant="secondary">
                    <UserPlus size={20} />
                    Agregar Coach
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {vistaActual === 'layout' ? (
                  <div className="space-y-4">
                    {/* Grid layout */}
                    <div className="space-y-2">
                      {renderGridLayout()}
                    </div>

                    {/* Leyenda */}
                    <div className="flex flex-wrap gap-4 p-4 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'rgba(174, 63, 33, 0.4)' }} />
                        <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Coach</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'rgba(16, 185, 129, 0.4)' }} />
                        <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'rgba(245, 158, 11, 0.4)' }} />
                        <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Mantenimiento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.4)' }} />
                        <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Reparación</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: 'rgba(107, 114, 128, 0.4)' }} />
                        <span className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>Inactivo</span>
                      </div>
                    </div>

                    {/* Instrucciones */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
                      <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        💡 <strong>Instrucciones:</strong> Arrastra los spots para reorganizar el layout según la distribución física del estudio. 
                        Haz click en cualquiera para editar su estado o eliminarla.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {spots.map((spot) => {
                      const Icon = getEstadoIcon(spot.tipo, spot.estado)
                      const color = getEstadoColor(spot.estado, spot.tipo)
                      const isCoach = spot.tipo === 'coach'
                      
                      return (
                        <div
                          key={spot.id}
                          onClick={() => handleOpenEditModal(spot)}
                          className="aspect-square rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
                          style={{
                            background: isCoach ? 'rgba(174, 63, 33, 0.2)' : `${color}20`,
                            border: `2px solid ${isCoach ? 'rgba(174, 63, 33, 0.6)' : `${color}40`}`
                          }}
                        >
                          <Icon size={24} style={{ color }} />
                          {isCoach ? (
                            <p className="text-sm font-bold mt-2 text-center" style={{ color, fontFamily: 'Montserrat, sans-serif' }}>
                              COACH
                            </p>
                          ) : (
                            <>
                              <p className="text-2xl font-bold mt-2" style={{ color, fontFamily: 'Montserrat, sans-serif' }}>
                                {spot.numero}
                              </p>
                              <p className="text-xs opacity-70 text-center" style={{ color, fontFamily: 'Montserrat, sans-serif' }}>
                                {getEstadoLabel(spot.estado)}
                              </p>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
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
              Editar {spotEditando.tipo === 'coach' ? 'Coach' : `${getTipoLabel(spotEditando.tipo)} #${spotEditando.numero}`}
            </h2>

            <form onSubmit={handleUpdateSpot} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <option value="bike" style={{ background: '#353535' }}>🚴 Bici</option>
                  <option value="mat" style={{ background: '#353535' }}>🧘 Tapete</option>
                  <option value="coach" style={{ background: '#353535' }}>👨‍🏫 Coach</option>
                </select>
              </div>

              {formData.tipo !== 'coach' && (
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
              )}

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
                  onClick={() => handleEliminarSpot(spotEditando.id)}
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
