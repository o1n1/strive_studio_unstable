'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Check, Edit2, Trash2, Eye } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabase } from '@/lib/supabase/client'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function ContractTemplatesPage() {
  const { isAuthorized, loading: authLoading } = useProtectedRoute('admin')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  useEffect(() => {
    if (isAuthorized) {
      cargarTemplates()
    }
  }, [isAuthorized])

  const cargarTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('tipo', { ascending: true })
        .order('version', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error cargando templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivar = async (templateId, tipo) => {
    if (!confirm('¿Activar este template? El anterior se desactivará.')) return

    try {
      // Desactivar otros del mismo tipo
      await supabase
        .from('contract_templates')
        .update({ activo: false })
        .eq('tipo', tipo)
        .eq('activo', true)

      // Activar el seleccionado
      const { error } = await supabase
        .from('contract_templates')
        .update({ activo: true, updated_at: new Date().toISOString() })
        .eq('id', templateId)

      if (error) throw error

      alert('✅ Template activado')
      cargarTemplates()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  const handleEliminar = async (templateId) => {
    if (!confirm('¿Eliminar este template?')) return

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      alert('✅ Template eliminado')
      cargarTemplates()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (!isAuthorized) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: '#FFFCF3' }}>
            Templates de Contratos
          </h1>
          <Button onClick={() => { setEditingTemplate(null); setShowModal(true) }}>
            <Plus size={20} className="mr-2" />
            Nuevo Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['coach', 'staff'].map(tipo => {
            const tipoTemplates = templates.filter(t => t.tipo === tipo)
            const activo = tipoTemplates.find(t => t.activo)

            return (
              <Card key={tipo}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3' }}>
                  Contratos de {tipo === 'coach' ? 'Coaches' : 'Staff'}
                </h2>

                {activo && (
                  <div className="mb-4 p-4 rounded-lg" 
                    style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={20} style={{ color: '#AE3F21' }} />
                      <span className="font-semibold" style={{ color: '#FFFCF3' }}>
                        Template Activo
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#B39A72' }}>
                      {activo.titulo}
                    </p>
                    <p className="text-xs" style={{ color: '#B39A72' }}>
                      Versión {activo.version}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {tipoTemplates.map(template => (
                    <div key={template.id} 
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{ background: 'rgba(42, 42, 42, 0.6)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: '#FFFCF3' }}>
                          {template.titulo}
                        </p>
                        <p className="text-xs" style={{ color: '#B39A72' }}>
                          Versión {template.version} • {template.activo ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!template.activo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivar(template.id, tipo)}
                          >
                            Activar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingTemplate(template); setShowModal(true) }}
                        >
                          <Edit2 size={16} />
                        </Button>
                        {!template.activo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEliminar(template.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); cargarTemplates() }}
        />
      )}
    </DashboardLayout>
  )
}

function TemplateModal({ template, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tipo: template?.tipo || 'coach',
    titulo: template?.titulo || '',
    contenido: template?.contenido || '',
    terminos: template?.terminos ? JSON.stringify(template.terminos, null, 2) : '[]',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let terminos = []
      try {
        terminos = JSON.parse(formData.terminos)
      } catch {
        alert('❌ El JSON de términos es inválido')
        setLoading(false)
        return
      }

      const payload = {
        tipo: formData.tipo,
        titulo: formData.titulo,
        contenido: formData.contenido,
        terminos,
        activo: false,
        created_by: user.id,
      }

      if (template) {
        // Actualizar
        const { error } = await supabase
          .from('contract_templates')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', template.id)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('contract_templates')
          .insert([payload])

        if (error) throw error
      }

      alert('✅ Template guardado')
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0D0D0D] rounded-lg p-6 max-w-4xl w-full border border-[#9C7A5E]/20 my-8">
        <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3' }}>
          {template ? 'Editar Template' : 'Nuevo Template'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B39A72' }}>
              Tipo de Contrato
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              disabled={!!template}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3'
              }}
            >
              <option value="coach">Coach</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B39A72' }}>
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B39A72' }}>
              Contenido del Contrato
            </label>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              required
              rows={10}
              className="w-full px-4 py-2 rounded-lg font-mono text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B39A72' }}>
              Términos (JSON Array)
            </label>
            <textarea
              value={formData.terminos}
              onChange={(e) => setFormData({ ...formData, terminos: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 rounded-lg font-mono text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.6)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3'
              }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Guardar Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}