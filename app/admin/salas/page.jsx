'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Edit2, Power, PowerOff, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function AdminSalasPage() {
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSala, setEditingSala] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    tipo: 'cycling',
    descripcion: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      fetchSalas()
    }
  }, [isAuthorized])

  const fetchSalas = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('nombre')

      if (error) throw error
      setSalas(data || [])
    } catch (error) {
      console.error('Error al cargar salas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (sala = null) => {
    if (sala) {
      setEditingSala(sala)
      setFormData({
        nombre: sala.nombre,
        capacidad: sala.capacidad.toString(),
        tipo: sala.tipo,
        descripcion: sala.descripcion || ''
      })
    } else {
      setEditingSala(null)
      setFormData({
        nombre: '',
        capacidad: '',
        tipo: 'cycling',
        descripcion: ''
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSala(null)
    setFormData({
      nombre: '',
      capacidad: '',
      tipo: 'cycling',
      descripcion: ''
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.capacidad) {
      newErrors.capacidad = 'La capacidad es requerida'
    } else if (parseInt(formData.capacidad) < 1) {
      newErrors.capacidad = 'La capacidad debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const salaData = {
        nombre: formData.nombre.trim(),
        capacidad: parseInt(formData.capacidad),
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim() || null,
        updated_at: new Date().toISOString()
      }

      if (editingSala) {
        const { error } = await supabase
          .from('rooms')
          .update(salaData)
          .eq('id', editingSala.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([salaData])

        if (error) throw error
      }

      await fetchSalas()
      handleCloseModal()
    } catch (error) {
      console.error('Error al guardar sala:', error)
      setErrors({ general: 'Error al guardar la sala. Intenta de nuevo.' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSalaEstado = async (sala) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ 
          activo: !sala.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', sala.id)

      if (error) throw error
      await fetchSalas()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
    }
  }

  if (authLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  const tiposSala = [
    { value: 'cycling', label: 'Cycling' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'multiuso', label: 'Multiuso' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Gestión de Salas
            </h1>
            <p className="text-xs sm:text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Administra las salas de tu estudio
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
            <Plus size={20} />
            Nueva Sala
          </Button>
        </div>

        {/* Lista de Salas */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#AE3F21' }} />
            </div>
          </Card>
        ) : salas.length === 0 ? (
          <Card>
            <div className="text-center py-10 sm:py-12">
              <Building2 size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
              <p className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No hay salas registradas
              </p>
              <p className="text-xs sm:text-sm opacity-70 mb-5 sm:mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Crea tu primera sala para comenzar
              </p>
              <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
                <Plus size={20} />
                Crear Primera Sala
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {salas.map((sala) => (
              <Card key={sala.id}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: sala.activo ? 'rgba(174, 63, 33, 0.2)' : 'rgba(156, 122, 94, 0.2)'
                        }}
                      >
                        <Building2 
                          size={20}
                          className="sm:w-6 sm:h-6"
                          style={{ color: sala.activo ? '#AE3F21' : '#9C7A5E' }} 
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {sala.nombre}
                        </h3>
                        <p className="text-xs opacity-60" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {tiposSala.find(t => t.value === sala.tipo)?.label}
                        </p>
                      </div>
                    </div>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        sala.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {sala.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 rounded-lg"
                    style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                    <span className="text-xs sm:text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Capacidad
                    </span>
                    <span className="font-bold text-base sm:text-lg" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                      {sala.capacidad}
                    </span>
                  </div>

                  {sala.descripcion && (
                    <p className="text-xs sm:text-sm opacity-70 line-clamp-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {sala.descripcion}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleOpenModal(sala)}
                      className="flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80 text-xs sm:text-sm"
                      style={{
                        background: 'rgba(174, 63, 33, 0.2)',
                        color: '#AE3F21',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    >
                      <Edit2 size={14} className="sm:w-4 sm:h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleSalaEstado(sala)}
                      className="flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80 text-xs sm:text-sm"
                      style={{
                        background: sala.activo ? 'rgba(156, 122, 94, 0.2)' : 'rgba(174, 63, 33, 0.2)',
                        color: sala.activo ? '#9C7A5E' : '#AE3F21',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    >
                      {sala.activo ? <PowerOff size={14} className="sm:w-4 sm:h-4" /> : <Power size={14} className="sm:w-4 sm:h-4" />}
                      <span className="hidden sm:inline">{sala.activo ? 'Desactivar' : 'Activar'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={handleCloseModal}
        >
          <div 
            className="w-full max-w-md backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
            style={{ 
              background: 'rgba(53, 53, 53, 0.95)',
              border: '1px solid rgba(156, 122, 94, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {editingSala ? 'Editar Sala' : 'Nueva Sala'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {errors.general && (
                <div className="p-3 sm:p-4 rounded-xl" 
                  style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
                  <p className="text-xs sm:text-sm" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {errors.general}
                  </p>
                </div>
              )}

              <Input
                label="Nombre de la Sala"
                icon={Building2}
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Sala Cycling 1"
                error={errors.nombre}
                disabled={submitting}
              />

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Tipo de Sala *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm sm:text-base"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {tiposSala.map((tipo) => (
                    <option key={tipo.value} value={tipo.value} style={{ background: '#353535' }}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Capacidad *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  disabled={submitting}
                  placeholder="Número de personas"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm sm:text-base"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: errors.capacidad ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
                {errors.capacidad && (
                  <p className="text-xs mt-1" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    {errors.capacidad}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  disabled={submitting}
                  placeholder="Describe las características de la sala..."
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none text-sm sm:text-base"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    borderColor: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all hover:opacity-80 disabled:opacity-50 text-sm sm:text-base"
                  style={{
                    background: 'rgba(156, 122, 94, 0.2)',
                    color: '#B39A72',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                  style={{
                    background: '#AE3F21',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingSala ? 'Actualizar' : 'Crear Sala'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
