'use client'

import { useState } from 'react'
import { X, FileText, DollarSign, Calendar, AlertCircle } from 'lucide-react'

export default function EditarContratoModal({ 
  isOpen, 
  onClose, 
  coach, 
  contratoActual,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo_contrato: contratoActual?.tipo_contrato || 'por_clase',
    fecha_inicio: contratoActual?.fecha_inicio ? new Date(contratoActual.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fecha_fin: contratoActual?.fecha_fin ? new Date(contratoActual.fecha_fin).toISOString().split('T')[0] : '',
    sueldo_base: contratoActual?.sueldo_base || '',
    comision_por_clase: contratoActual?.comision_por_clase || '',
    notas: contratoActual?.notas || '',
    es_renovacion: false // Si es true, marca el anterior como no vigente
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Obtener token de sesión
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      const response = await fetch('/api/coaches/update-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          coachId: coach.id,
          contratoId: contratoActual?.id,
          ...formData,
          sueldo_base: formData.sueldo_base ? parseFloat(formData.sueldo_base) : null,
          comision_por_clase: formData.comision_por_clase ? parseFloat(formData.comision_por_clase) : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar contrato')
      }

      const data = await response.json()
      console.log('✅ Contrato actualizado:', data)

      alert('✅ Contrato actualizado exitosamente. Se ha generado un nuevo PDF.')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('❌ Error:', error)
      alert('Error al actualizar el contrato: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6" style={{ background: '#2A2A2A', border: '1px solid rgba(156, 122, 94, 0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
              <FileText size={24} style={{ color: '#AE3F21' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {contratoActual ? 'Renovar Contrato' : 'Crear Contrato'}
              </h2>
              <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                {coach.nombre} {coach.apellidos}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(179, 154, 114, 0.2)' }}>
            <X size={20} style={{ color: '#B39A72' }} />
          </button>
        </div>

        {/* Alert Info */}
        {contratoActual && (
          <div className="mb-6 p-4 rounded-lg flex gap-3" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <AlertCircle size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <div className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <strong>Renovación de contrato:</strong> Se generará un nuevo PDF con la información actualizada. El contrato anterior quedará como historial.
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Contrato */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Tipo de Contrato *
            </label>
            <select
              required
              value={formData.tipo_contrato}
              onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
              className="w-full px-4 py-3 rounded-lg outline-none"
              style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <option value="por_clase">Por Clase</option>
              <option value="tiempo_completo">Tiempo Completo</option>
              <option value="medio_tiempo">Medio Tiempo</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Fecha de Inicio *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="w-full px-4 py-3 rounded-lg outline-none"
                style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Fecha de Fin (opcional)
              </label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                className="w-full px-4 py-3 rounded-lg outline-none"
                style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              />
              <p className="text-xs mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Dejar vacío para vigencia indefinida
              </p>
            </div>
          </div>

          {/* Compensación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <DollarSign size={16} className="inline mr-1" />
                Sueldo Base (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sueldo_base}
                onChange={(e) => setFormData({ ...formData, sueldo_base: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg outline-none"
                style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <DollarSign size={16} className="inline mr-1" />
                Comisión por Clase (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.comision_por_clase}
                onChange={(e) => setFormData({ ...formData, comision_por_clase: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg outline-none"
                style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Notas Adicionales
            </label>
            <textarea
              rows={4}
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Agregar notas sobre el contrato..."
              className="w-full px-4 py-3 rounded-lg outline-none resize-none"
              style={{ background: 'rgba(179, 154, 114, 0.1)', border: '1px solid rgba(179, 154, 114, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>

          {/* Checkbox Renovación */}
          {contratoActual && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="es_renovacion"
                checked={formData.es_renovacion}
                onChange={(e) => setFormData({ ...formData, es_renovacion: e.target.checked })}
                className="mt-1"
              />
              <label htmlFor="es_renovacion" className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Marcar contrato anterior como <strong>no vigente</strong> y crear uno nuevo (renovación completa)
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(179, 154, 114, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {loading ? 'Guardando...' : contratoActual ? 'Renovar Contrato' : 'Crear Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
