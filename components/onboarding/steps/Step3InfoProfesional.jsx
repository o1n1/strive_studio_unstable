'use client'

import { useState } from 'react'
import { Briefcase, Award, FileText, AlertCircle } from 'lucide-react'

const ESPECIALIDADES_DISPONIBLES = [
  { id: 'hiit', nombre: 'HIIT', descripcion: 'High Intensity Interval Training' },
  { id: 'endurance', nombre: 'Endurance', descripcion: 'Resistencia cardiovascular' },
  { id: 'fuerza', nombre: 'Fuerza', descripcion: 'Entrenamiento de fuerza' },
  { id: 'cardio', nombre: 'Cardio', descripcion: 'Entrenamiento cardiovascular' },
  { id: 'movilidad', nombre: 'Movilidad', descripcion: 'Flexibilidad y movilidad' },
  { id: 'spinning', nombre: 'Spinning', descripcion: 'Ciclismo indoor' },
  { id: 'funcional', nombre: 'Funcional', descripcion: 'Entrenamiento funcional' },
  { id: 'core', nombre: 'Core', descripcion: 'Fortalecimiento del core' },
  { id: 'recuperacion', nombre: 'Recuperación', descripcion: 'Estiramiento y recuperación' }
]

export default function Step3InfoProfesional({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [charCount, setCharCount] = useState(data.bio?.length || 0)

  const validateForm = () => {
    const newErrors = {}

    if (!data.bio?.trim()) {
      newErrors.bio = 'La biografía es requerida'
    } else if (data.bio.trim().length < 50) {
      newErrors.bio = 'La biografía debe tener al menos 50 caracteres'
    } else if (data.bio.trim().length > 500) {
      newErrors.bio = 'La biografía no puede exceder 500 caracteres'
    }

    if (!data.años_experiencia) {
      newErrors.años_experiencia = 'Los años de experiencia son requeridos'
    } else if (data.años_experiencia < 0) {
      newErrors.años_experiencia = 'Los años no pueden ser negativos'
    } else if (data.años_experiencia > 50) {
      newErrors.años_experiencia = 'Años de experiencia no válidos'
    }

    if (!data.especialidades || data.especialidades.length === 0) {
      newErrors.especialidades = 'Debes seleccionar al menos una especialidad'
    } else if (data.especialidades.length > 6) {
      newErrors.especialidades = 'Máximo 6 especialidades'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      nextStep()
    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: 'Error al guardar datos. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const toggleEspecialidad = (especialidadId) => {
    const current = data.especialidades || []
    
    if (current.includes(especialidadId)) {
      updateData({ especialidades: current.filter(id => id !== especialidadId) })
    } else {
      if (current.length < 6) {
        updateData({ especialidades: [...current, especialidadId] })
      }
    }
  }

  const handleBioChange = (e) => {
    const text = e.target.value
    if (text.length <= 500) {
      updateData({ bio: text })
      setCharCount(text.length)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Información Profesional
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Cuéntanos sobre tu experiencia y especialidades
        </p>
      </div>

      {/* Biografía */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Biografía Profesional *
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-4 flex items-center pointer-events-none">
            <FileText size={20} style={{ color: '#B39A72' }} />
          </div>
          <textarea
            value={data.bio || ''}
            onChange={handleBioChange}
            rows="6"
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm resize-none"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.bio ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="Cuéntanos sobre tu trayectoria, filosofía de entrenamiento y qué te apasiona de ser coach..."
          />
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div>
            {errors.bio && (
              <p className="text-xs flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <AlertCircle size={14} /> {errors.bio}
              </p>
            )}
          </div>
          <p className="text-xs" style={{ 
            color: charCount >= 500 ? '#ef4444' : charCount >= 450 ? '#f59e0b' : '#666',
            fontFamily: 'Montserrat, sans-serif' 
          }}>
            {charCount}/500 caracteres
          </p>
        </div>

        <p className="text-xs mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          💡 Consejo: Menciona tus logros, certificaciones principales y estilo de enseñanza.
        </p>
      </div>

      {/* Años de Experiencia */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Años de Experiencia como Coach *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Award size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type="number"
            value={data.años_experiencia || ''}
            onChange={(e) => updateData({ años_experiencia: parseInt(e.target.value) || 0 })}
            min="0"
            max="50"
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.años_experiencia ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="5"
          />
        </div>
        {errors.años_experiencia && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.años_experiencia}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          Incluye tu experiencia total como instructor/entrenador
        </p>
      </div>

      {/* Especialidades */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Especialidades * <span className="text-xs font-normal" style={{ color: '#B39A72' }}>
            (Selecciona entre 1 y 6)
          </span>
        </label>

        <div className="grid md:grid-cols-3 gap-3">
          {ESPECIALIDADES_DISPONIBLES.map((esp) => {
            const isSelected = (data.especialidades || []).includes(esp.id)
            
            return (
              <button
                key={esp.id}
                type="button"
                onClick={() => toggleEspecialidad(esp.id)}
                className="p-4 rounded-xl text-left transition-all hover:scale-105"
                style={{
                  background: isSelected ? 'rgba(174, 63, 33, 0.2)' : 'rgba(156, 122, 94, 0.1)',
                  border: isSelected ? '2px solid #AE3F21' : '2px solid rgba(156, 122, 94, 0.3)',
                  cursor: 'pointer'
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1" style={{ 
                      color: isSelected ? '#AE3F21' : '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif' 
                    }}>
                      {esp.nombre}
                    </p>
                    <p className="text-xs" style={{ 
                      color: isSelected ? '#B39A72' : '#666',
                      fontFamily: 'Montserrat, sans-serif' 
                    }}>
                      {esp.descripcion}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
                      style={{ background: '#AE3F21' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7L6 11L12 3" stroke="#FFFCF3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {errors.especialidades && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.especialidades}
          </p>
        )}

        {(data.especialidades?.length > 0) && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <p className="text-xs" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              ✓ {data.especialidades.length} especialidad{data.especialidades.length > 1 ? 'es' : ''} seleccionada{data.especialidades.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Error de submit */}
      {errors.submit && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            {errors.submit}
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90"
          style={{ background: '#B39A72', color: '#1a1a1a', fontFamily: 'Montserrat, sans-serif' }}>
          ← Anterior
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {loading ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}
