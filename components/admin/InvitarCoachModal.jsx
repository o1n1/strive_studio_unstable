'use client'

import { useState } from 'react'
import { X, Mail, Calendar, MessageSquare, Send, Loader2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

export default function InvitarCoachModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    categoria: 'cycling',
    expiracion: '7',
    mensaje: ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/coaches/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación')
      }

      onSuccess()
      alert('✅ Invitación enviada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert(error.message || 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Invitar Nuevo Coach
                </h3>
                <p className="text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Envía una invitación por email con un link único
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
                <X size={18} style={{ color: '#B39A72' }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  <Mail size={16} style={{ color: '#AE3F21' }} />
                  Email del Coach *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="coach@ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(156, 122, 94, 0.1)',
                    border: errors.email ? '2px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  📂 Categoría *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'cycling', label: '🚴 Cycling', emoji: '🚴' },
                    { value: 'funcional', label: '💪 Funcional', emoji: '💪' },
                    { value: 'ambos', label: '🔥 Ambos', emoji: '🔥' }
                  ].map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, categoria: cat.value })}
                      className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: formData.categoria === cat.value ? '#AE3F21' : 'rgba(156, 122, 94, 0.2)',
                        color: formData.categoria === cat.value ? '#FFFCF3' : '#B39A72',
                        fontFamily: 'Montserrat, sans-serif',
                        border: formData.categoria === cat.value ? 'none' : '1px solid rgba(156, 122, 94, 0.2)'
                      }}
                      disabled={loading}
                    >
                      <div className="text-2xl mb-1">{cat.emoji}</div>
                      {cat.value}
                    </button>
                  ))}
                </div>
                {errors.categoria && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    {errors.categoria}
                  </p>
                )}
              </div>

              {/* Expiración */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  <Calendar size={16} style={{ color: '#AE3F21' }} />
                  Expiración del Link
                </label>
                <select
                  value={formData.expiracion}
                  onChange={(e) => setFormData({ ...formData, expiracion: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(156, 122, 94, 0.1)',
                    border: '1px solid rgba(156, 122, 94, 0.2)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  disabled={loading}
                >
                  <option value="7">7 días</option>
                  <option value="15">15 días</option>
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                </select>
              </div>

              {/* Mensaje Personalizado */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2"
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  <MessageSquare size={16} style={{ color: '#AE3F21' }} />
                  Mensaje Personalizado (Opcional)
                </label>
                <textarea
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Agrega un mensaje personal para el coach..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: 'rgba(156, 122, 94, 0.1)',
                    border: '1px solid rgba(156, 122, 94, 0.2)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  disabled={loading}
                />
                <p className="text-xs mt-1 opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Este mensaje aparecerá en el email de invitación
                </p>
              </div>

              {/* Vista Previa */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  📧 Vista Previa del Email
                </p>
                <div className="text-xs space-y-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  <p><strong>Para:</strong> {formData.email || 'coach@ejemplo.com'}</p>
                  <p><strong>Asunto:</strong> Invitación para unirte como Coach - {formData.categoria}</p>
                  <p><strong>Expira:</strong> En {formData.expiracion} días</p>
                  {formData.mensaje && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                      <p className="italic opacity-70">"{formData.mensaje}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
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
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: loading ? 'rgba(174, 63, 33, 0.5)' : '#AE3F21',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar Invitación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
