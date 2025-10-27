'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { FileText, Plus, Edit2, Check, Clock, Trash2, AlertCircle } from 'lucide-react'

export default function PlantillasContratosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plantillas, setPlantillas] = useState([])
  const [tabActivo, setTabActivo] = useState('coaches') // coaches | staff
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contenido: '',
    categoria: 'coaches'
  })
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

  const plantillasCoaches = plantillas.filter(p => 
    p.tipo_contrato === 'por_clase' || 
    p.tipo_contrato === 'tiempo_completo' ||
    p.tipo_contrato === 'medio_tiempo'
  )

  const plantillasStaff = plantillas.filter(p => 
    p.tipo_contrato === 'freelance'
  )

  const plantillasActuales = tabActivo === 'coaches' ? plantillasCoaches : plantillasStaff

  const plantillaActiva = plantillasActuales.find(p => p.es_default && p.vigente)
  const historial = plantillasActuales.filter(p => !(p.es_default && p.vigente))

  const nuevaPlantilla = () => {
    setEditando('nueva')
    setFormData({
      nombre: '',
      contenido: '',
      categoria: tabActivo
    })
  }

  const editarPlantilla = (plantilla) => {
    setEditando(plantilla.id)
    setFormData({
      nombre: plantilla.nombre,
      contenido: plantilla.contenido,
      categoria: tabActivo
    })
  }

  const cancelar = () => {
    setEditando(null)
    setFormData({ nombre: '', contenido: '', categoria: 'coaches' })
  }

  const guardar = async () => {
    if (!formData.nombre.trim() || !formData.contenido.trim()) {
      alert('❌ Completa todos los campos')
      return
    }

    setSaving(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()

      // Determinar tipo_contrato según categoría
      const tipo_contrato = tabActivo === 'coaches' ? 'por_clase' : 'freelance'

      if (editando === 'nueva') {
        // Crear nueva plantilla
        const plantillaData = {
          nombre: formData.nombre.trim(),
          tipo_contrato,
          contenido: formData.contenido.trim(),
          vigente: true,
          es_default: false,
          version: 1,
          creado_por: session.user.id,
          actualizado_por: session.user.id
        }

        const { error } = await supabase
          .from('contract_templates')
          .insert(plantillaData)

        if (error) throw error

        alert('✅ Plantilla creada correctamente')
      } else {
        // Actualizar plantilla existente
        const plantillaData = {
          nombre: formData.nombre.trim(),
          contenido: formData.contenido.trim(),
          actualizado_por: session.user.id,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('contract_templates')
          .update(plantillaData)
          .eq('id', editando)

        if (error) throw error

        alert('✅ Plantilla actualizada correctamente')
      }

      await cargarPlantillas()
      cancelar()
    } catch (error) {
      console.error('Error guardando:', error)
      alert('❌ Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const activarPlantilla = async (id) => {
    if (!confirm('¿Activar esta plantilla? Será la que se use en el onboarding.')) return

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Determinar tipo_contrato según tab
      const tipo_contrato = tabActivo === 'coaches' ? 'por_clase' : 'freelance'

      // Desactivar todas las demás del mismo tipo
      await supabase
        .from('contract_templates')
        .update({ es_default: false })
        .eq('tipo_contrato', tipo_contrato)

      // Activar la seleccionada
      const { error } = await supabase
        .from('contract_templates')
        .update({ 
          es_default: true, 
          vigente: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error

      alert('✅ Plantilla activada')
      await cargarPlantillas()
    } catch (error) {
      console.error('Error activando:', error)
      alert('❌ Error al activar: ' + error.message)
    }
  }

  const eliminarPlantilla = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return

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
      console.error('Error eliminando:', error)
      alert('❌ Error al eliminar: ' + error.message)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Plantillas de Contratos
            </h1>
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Gestiona los contratos que se firman en el onboarding
            </p>
          </div>
          <button
            onClick={nuevaPlantilla}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            <Plus size={20} />
            Nueva Plantilla
          </button>
        </div>

        {/* Info Variables */}
        <Card>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#AE3F21' }} />
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Variables disponibles:
              </p>
              <div className="flex flex-wrap gap-2">
                {['{{nombre_completo}}', '{{fecha_inicio}}', '{{categoria}}', '{{fecha_firma}}'].map(v => (
                  <code key={v} className="text-xs px-2 py-1 rounded" 
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}>
                    {v}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2">
          {['coaches', 'staff'].map(tab => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                background: tabActivo === tab ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                color: tabActivo === tab ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {tab === 'coaches' ? 'Coaches' : 'Staff'}
            </button>
          ))}
        </div>

        {/* Plantilla Activa */}
        {plantillaActiva && !editando && (
          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Check size={24} style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    {plantillaActiva.nombre}
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                    ACTIVO
                  </span>
                </div>
                <p className="text-sm mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Esta es la plantilla que se usa actualmente en el onboarding
                </p>
                <div className="p-4 rounded-lg mb-4 max-h-60 overflow-y-auto"
                  style={{ background: 'rgba(42, 42, 42, 0.6)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                  <pre className="text-xs whitespace-pre-wrap" style={{ color: '#B39A72', fontFamily: 'monospace' }}>
                    {plantillaActiva.contenido}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editarPlantilla(plantillaActiva)}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Formulario de Edición */}
        {editando && (
          <Card>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {editando === 'nueva' ? 'Nueva Plantilla' : 'Editar Plantilla'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Contrato Coach Estándar v2"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background: 'rgba(42, 42, 42, 0.6)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Contenido del Contrato
                </label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  placeholder="Escribe el contenido del contrato aquí..."
                  rows={20}
                  className="w-full p-3 rounded-lg font-mono text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.6)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3'
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelar}
                  className="flex-1 py-3 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(156, 122, 94, 0.2)',
                    color: '#B39A72',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={saving}
                  className="flex-1 py-3 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: '#AE3F21',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Historial */}
        {!editando && historial.length > 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Clock size={20} className="inline mr-2" />
              Historial de Versiones ({historial.length})
            </h3>
            <div className="space-y-3">
              {historial.map(plantilla => (
                <div key={plantilla.id} className="p-4 rounded-lg flex items-center justify-between"
                  style={{ background: 'rgba(42, 42, 42, 0.4)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {plantilla.nombre}
                    </p>
                    <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Creada: {new Date(plantilla.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => activarPlantilla(plantilla.id)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Activar
                    </button>
                    <button
                      onClick={() => editarPlantilla(plantilla)}
                      className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
                      style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => eliminarPlantilla(plantilla.id, plantilla.nombre)}
                      className="px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!plantillaActiva && !editando && historial.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4" style={{ color: '#B39A72' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                No hay plantillas de {tabActivo === 'coaches' ? 'coaches' : 'staff'}
              </h3>
              <p className="mb-6" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Crea la primera plantilla para comenzar
              </p>
              <button
                onClick={nuevaPlantilla}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-80 inline-flex items-center gap-2"
                style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              >
                <Plus size={20} />
                Crear Plantilla
              </button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}