'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Loader2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

/**
 * Modal para revisar y aprobar/rechazar cambios solicitados por coaches
 */
export default function RevisarCambiosModal({ isOpen, onClose, coachId, onSuccess }) {
  const [loading, setLoading] = useState(true)
  const [procesando, setProcessing] = useState(false)
  const [solicitudes, setSolicitudes] = useState([])
  const [seleccionadas, setSeleccionadas] = useState({})
  const [comentarios, setComentarios] = useState({})

  useEffect(() => {
    if (isOpen && coachId) {
      cargarSolicitudes()
    }
  }, [isOpen, coachId])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando solicitudes de cambios...')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/coaches/review-changes?estado=pendiente`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Error cargando solicitudes')

      const result = await response.json()
      
      // Filtrar solo las del coach actual
      const solicitudesCoach = result.solicitudes.filter(s => s.coach_id === coachId)
      
      console.log('✅ Solicitudes cargadas:', solicitudesCoach.length)
      setSolicitudes(solicitudesCoach)

    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCambio = (solicitudId, campo, aprobado) => {
    setSeleccionadas(prev => ({
      ...prev,
      [solicitudId]: {
        ...prev[solicitudId],
        [campo]: aprobado
      }
    }))
  }

  const handleAprobarTodos = async (solicitudId) => {
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/coaches/review-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          requestId: solicitudId,
          accion: 'aprobar_todos'
        })
      })

      if (!response.ok) throw new Error('Error aprobando cambios')

      console.log('✅ Cambios aprobados')
      await cargarSolicitudes()
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar cambios')
    } finally {
      setProcessing(false)
    }
  }

  const handleRechazarTodos = async (solicitudId) => {
    if (!confirm('¿Seguro que deseas rechazar todos los cambios?')) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/coaches/review-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          requestId: solicitudId,
          accion: 'rechazar_todos',
          comentarios: comentarios[solicitudId] || ''
        })
      })

      if (!response.ok) throw new Error('Error rechazando cambios')

      console.log('✅ Cambios rechazados')
      await cargarSolicitudes()
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al rechazar cambios')
    } finally {
      setProcessing(false)
    }
  }

  const handleRevisarIndividual = async (solicitudId) => {
    const seleccion = seleccionadas[solicitudId] || {}
    const aprobados = []
    const rechazados = []

    Object.entries(seleccion).forEach(([campo, aprobado]) => {
      if (aprobado) {
        aprobados.push(campo)
      } else {
        rechazados.push(campo)
      }
    })

    if (aprobados.length === 0 && rechazados.length === 0) {
      alert('Debes seleccionar al menos un cambio para aprobar o rechazar')
      return
    }

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/coaches/review-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          requestId: solicitudId,
          accion: 'revisar_individual',
          cambiosAprobados: aprobados,
          cambiosRechazados: rechazados,
          comentarios: comentarios[solicitudId] || ''
        })
      })

      if (!response.ok) throw new Error('Error procesando cambios')

      console.log('✅ Cambios procesados')
      await cargarSolicitudes()
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar cambios')
    } finally {
      setProcessing(false)
    }
  }

  const getNombreCampo = (campo) => {
    const nombres = {
      'nombre': 'Nombre',
      'apellidos': 'Apellidos',
      'fecha_nacimiento': 'Fecha de Nacimiento',
      'rfc': 'RFC',
      'años_experiencia': 'Años de Experiencia',
      'telefono': 'Teléfono',
      'direccion': 'Dirección'
    }
    return nombres[campo] || campo
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'rgba(42, 42, 42, 0.98)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
        
        {/* Header */}
        <div className="sticky top-0 p-6 border-b"
          style={{ 
            background: 'rgba(42, 42, 42, 0.98)', 
            borderColor: 'rgba(156, 122, 94, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <AlertTriangle size={24} style={{ color: '#AE3F21' }} />
                Cambios Solicitados
              </h2>
              <p className="text-sm mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Revisa y aprueba los cambios solicitados por el coach
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={procesando}
              className="p-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'rgba(179, 154, 114, 0.2)' }}>
              <X size={24} style={{ color: '#B39A72' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#AE3F21' }} />
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Cargando solicitudes...
              </p>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={64} className="mx-auto mb-4" style={{ color: '#10b981' }} />
              <h3 className="text-xl font-bold mb-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No hay solicitudes pendientes
              </h3>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Este coach no tiene cambios pendientes de revisión
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {solicitudes.map(solicitud => (
                <div key={solicitud.id} 
                  className="rounded-xl p-6 border"
                  style={{ 
                    background: 'rgba(156, 122, 94, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.2)'
                  }}>
                  
                  {/* Fecha de solicitud */}
                  <div className="flex items-center gap-2 mb-4 text-sm"
                    style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    <Calendar size={16} />
                    Solicitado: {new Date(solicitud.created_at).toLocaleString('es-MX')}
                  </div>

                  {/* Lista de cambios */}
                  <div className="space-y-3 mb-6">
                    {solicitud.cambios.map((cambio, idx) => (
                      <div key={idx} 
                        className="p-4 rounded-lg"
                        style={{ background: 'rgba(42, 42, 42, 0.6)' }}>
                        
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold mb-1"
                              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                              {getNombreCampo(cambio.campo)}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs mb-1" style={{ color: '#B39A72' }}>Anterior:</p>
                                <p className="font-mono p-2 rounded"
                                  style={{ 
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                  }}>
                                  {cambio.valor_anterior || '(vacío)'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs mb-1" style={{ color: '#B39A72' }}>Nuevo:</p>
                                <p className="font-mono p-2 rounded"
                                  style={{ 
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                  }}>
                                  {cambio.valor_nuevo}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Controles de aprobación individual */}
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleToggleCambio(solicitud.id, cambio.campo, true)}
                              className="p-2 rounded-lg transition-all"
                              style={{
                                background: seleccionadas[solicitud.id]?.[cambio.campo] === true
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'rgba(16, 185, 129, 0.1)',
                                border: `2px solid ${seleccionadas[solicitud.id]?.[cambio.campo] === true
                                  ? '#10b981'
                                  : 'rgba(16, 185, 129, 0.3)'}`
                              }}>
                              <CheckCircle size={20} style={{ color: '#10b981' }} />
                            </button>
                            
                            <button
                              onClick={() => handleToggleCambio(solicitud.id, cambio.campo, false)}
                              className="p-2 rounded-lg transition-all"
                              style={{
                                background: seleccionadas[solicitud.id]?.[cambio.campo] === false
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : 'rgba(239, 68, 68, 0.1)',
                                border: `2px solid ${seleccionadas[solicitud.id]?.[cambio.campo] === false
                                  ? '#ef4444'
                                  : 'rgba(239, 68, 68, 0.3)'}`
                              }}>
                              <XCircle size={20} style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comentarios */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2"
                      style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      Comentarios (opcional)
                    </label>
                    <textarea
                      value={comentarios[solicitud.id] || ''}
                      onChange={(e) => setComentarios(prev => ({
                        ...prev,
                        [solicitud.id]: e.target.value
                      }))}
                      placeholder="Agrega comentarios sobre esta revisión..."
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg text-sm resize-none"
                      style={{
                        background: 'rgba(156, 122, 94, 0.1)',
                        border: '1px solid rgba(156, 122, 94, 0.2)',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAprobarTodos(solicitud.id)}
                      disabled={procesando}
                      className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        fontFamily: 'Montserrat, sans-serif'
                      }}>
                      <CheckCircle size={18} />
                      Aprobar Todos
                    </button>

                    <button
                      onClick={() => handleRevisarIndividual(solicitud.id)}
                      disabled={procesando}
                      className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                      style={{
                        background: '#AE3F21',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}>
                      Revisar Individual
                    </button>

                    <button
                      onClick={() => handleRechazarTodos(solicitud.id)}
                      disabled={procesando}
                      className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        fontFamily: 'Montserrat, sans-serif'
                      }}>
                      <XCircle size={18} />
                      Rechazar Todos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
