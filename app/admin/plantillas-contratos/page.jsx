'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Card from '@/components/ui/Card'
import { FileText, Plus, Edit2, Eye, Trash2, Save, X, AlertCircle } from 'lucide-react'

export default function PlantillasContratosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plantillas, setPlantillas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_contrato: 'por_clase',
    contenido: '',
    es_default: false,
    notas: ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    verificarAcceso()
  }, [])

  const verificarAcceso = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.rol !== 'admin') {
        router.push('/')
        return
      }

      await cargarPlantillas()
    } catch (error) {
      console.error('Error verificando acceso:', error)
      router.push('/login')
    }
  }

  const cargarPlantillas = async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPlantillas(data || [])
    } catch (error) {
      console.error('Error cargando plantillas:', error)
      alert('Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (plantilla = null) => {
    if (plantilla) {
      setEditando(plantilla.id)
      setFormData({
        nombre: plantilla.nombre,
        tipo_contrato: plantilla.tipo_contrato,
        contenido: plantilla.contenido,
        es_default: plantilla.es_default,
        notas: plantilla.notas || ''
      })
    } else {
      setEditando(null)
      setFormData({
        nombre: '',
        tipo_contrato: 'por_clase',
        contenido: '',
        es_default: false,
        notas: ''
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setEditando(null)
    setFormData({
      nombre: '',
      tipo_contrato: 'por_clase',
      contenido: '',
      es_default: false,
      notas: ''
    })
    setErrors({})
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.contenido.trim()) {
      newErrors.contenido = 'El contenido es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const guardarPlantilla = async () => {
    if (!validarFormulario()) return

    setSaving(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()

      const plantillaData = {
        nombre: formData.nombre.trim(),
        tipo_contrato: formData.tipo_contrato,
        contenido: formData.contenido.trim(),
        es_default: formData.es_default,
        notas: formData.notas.trim() || null,
        actualizado_por: session.user.id
      }

      if (editando) {
        // Actualizar plantilla existente
        const { error } = await supabase
          .from('contract_templates')
          .update(plantillaData)
          .eq('id', editando)

        if (error) throw error

        alert('✅ Plantilla actualizada correctamente')
      } else {
        // Crear nueva plantilla
        plantillaData.creado_por = session.user.id
        plantillaData.vigente = true
        plantillaData.version = 1

        const { error } = await supabase
          .from('contract_templates')
          .insert(plantillaData)

        if (error) throw error

        alert('✅ Plantilla creada correctamente')
      }

      await cargarPlantillas()
      cerrarModal()

    } catch (error) {
      console.error('Error guardando plantilla:', error)
      alert('❌ Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminarPlantilla = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Plantilla eliminada')
      await cargarPlantillas()

    } catch (error) {
      console.error('Error eliminando plantilla:', error)
      alert('❌ Error al eliminar: ' + error.message)
    }
  }

  const cambiarEstado = async (id, vigente) => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { error } = await supabase
        .from('contract_templates')
        .update({ vigente: !vigente })
        .eq('id', id)

      if (error) throw error

      await cargarPlantillas()

    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('❌ Error al cambiar estado: ' + error.message)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AE3F21' }}></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Plantillas de Contratos
          </h1>
          <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Gestiona las plantillas de contratos para todos los coaches
          </p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
          style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      {/* Info Box */}
      <Card className="mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={24} style={{ color: '#AE3F21' }} />
          <div>
            <p className="font-semibold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Variables disponibles en el contenido:
            </p>
            <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              <code style={{ background: 'rgba(174, 63, 33, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                {'{{nombre_completo}}'}, {'{{fecha_inicio}}'}, {'{{categoria}}'}, {'{{fecha_firma}}'}
              </code>
            </p>
            <p className="text-xs mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
              Estas variables se reemplazarán automáticamente con los datos reales del coach al generar el contrato.
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de Plantillas */}
      <div className="space-y-4">
        {plantillas.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText size={48} style={{ color: '#666' }} className="mx-auto mb-4" />
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                No hay plantillas creadas
              </p>
            </div>
          </Card>
        ) : (
          plantillas.map((plantilla) => (
            <Card key={plantilla.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {plantilla.nombre}
                    </h3>
                    {plantilla.es_default && (
                      <span 
                        className="text-xs px-3 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                      >
                        Por Defecto
                      </span>
                    )}
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ 
                        background: plantilla.vigente ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 122, 94, 0.2)', 
                        color: plantilla.vigente ? '#10b981' : '#9C7A5E' 
                      }}
                    >
                      {plantilla.vigente ? '🟢 Vigente' : '⚪ Inactiva'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    <span>Tipo: <strong>{plantilla.tipo_contrato}</strong></span>
                    <span>•</span>
                    <span>Versión: <strong>{plantilla.version}</strong></span>
                    <span>•</span>
                    <span>Creada: <strong>{new Date(plantilla.created_at).toLocaleDateString('es-MX')}</strong></span>
                  </div>

                  {plantilla.notas && (
                    <p className="text-sm mb-3" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                      📝 {plantilla.notas}
                    </p>
                  )}

                  <div 
                    className="p-3 rounded-lg text-xs overflow-auto max-h-40"
                    style={{ background: 'rgba(42, 42, 42, 0.8)', color: '#B39A72', fontFamily: 'monospace' }}
                  >
                    <pre className="whitespace-pre-wrap">{plantilla.contenido.substring(0, 300)}...</pre>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => abrirModal(plantilla)}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'rgba(174, 63, 33, 0.2)' }}
                    title="Editar"
                  >
                    <Edit2 size={18} style={{ color: '#AE3F21' }} />
                  </button>

                  <button
                    onClick={() => cambiarEstado(plantilla.id, plantilla.vigente)}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'rgba(156, 122, 94, 0.2)' }}
                    title={plantilla.vigente ? 'Desactivar' : 'Activar'}
                  >
                    {plantilla.vigente ? (
                      <Eye size={18} style={{ color: '#9C7A5E' }} />
                    ) : (
                      <Eye size={18} style={{ color: '#666' }} />
                    )}
                  </button>

                  {!plantilla.es_default && (
                    <button
                      onClick={() => eliminarPlantilla(plantilla.id, plantilla.nombre)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                      title="Eliminar"
                    >
                      <Trash2 size={18} style={{ color: '#ef4444' }} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Edición/Creación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={cerrarModal}>
          <div 
            className="rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {editando ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button onClick={cerrarModal} className="p-2 hover:opacity-80 transition-all">
                <X size={24} style={{ color: '#B39A72' }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Contrato Por Clase 2025"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    border: errors.nombre ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
                {errors.nombre && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nombre}</p>
                )}
              </div>

              {/* Tipo de Contrato */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Tipo de Contrato *
                </label>
                <select
                  value={formData.tipo_contrato}
                  onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
                  className="w-full p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <option value="por_clase">Por Clase</option>
                  <option value="tiempo_completo">Tiempo Completo</option>
                  <option value="medio_tiempo">Medio Tiempo</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Contenido del Contrato *
                </label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  placeholder="Escribe aquí el contenido completo del contrato..."
                  rows={15}
                  className="w-full p-3 rounded-lg font-mono text-sm"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    border: errors.contenido ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3'
                  }}
                />
                {errors.contenido && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.contenido}</p>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Notas Internas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas sobre esta plantilla (solo visible para admins)"
                  rows={2}
                  className="w-full p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 252, 243, 0.05)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              {/* Checkbox Default */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_default}
                    onChange={(e) => setFormData({ ...formData, es_default: e.target.checked })}
                    className="w-4 h-4"
                    style={{ accentColor: '#AE3F21' }}
                  />
                  <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Usar como plantilla por defecto para este tipo de contrato
                  </span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cerrarModal}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(156, 122, 94, 0.2)',
                    color: '#B39A72',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarPlantilla}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: '#AE3F21',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Plantilla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
