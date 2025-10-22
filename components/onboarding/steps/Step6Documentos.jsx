'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'

export default function Step6Documentos({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  
  const ineFrenteRef = useRef(null)
  const ineReversoRef = useRef(null)
  const comprobanteDomicilioRef = useRef(null)

  const validateForm = () => {
    const newErrors = {}

    // Obligatorios
    if (!data.ine_frente) {
      newErrors.ine_frente = 'La INE (frente) es obligatoria'
    }
    if (!data.ine_reverso) {
      newErrors.ine_reverso = 'La INE (reverso) es obligatoria'
    }
    if (!data.comprobante_domicilio) {
      newErrors.comprobante_domicilio = 'El comprobante de domicilio es obligatorio'
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

  const handleFileChange = (field, e, ref) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, [field]: 'Solo PDF, JPG o PNG' })
      return
    }

    // Validar tamaño (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, [field]: 'Máximo 10MB' })
      return
    }

    updateData({ [field]: file })

    // Limpiar error
    const newErrors = { ...errors }
    delete newErrors[field]
    setErrors(newErrors)
  }

  const removeFile = (field, ref) => {
    updateData({ [field]: null })
    if (ref.current) {
      ref.current.value = ''
    }
  }

  const renderFileUpload = (field, label, required, ref, description) => {
    const file = data[field]
    const error = errors[field]

    return (
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {label} {required && <span style={{ color: '#AE3F21' }}>*</span>}
        </label>
        
        {description && (
          <p className="text-xs mb-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
            {description}
          </p>
        )}

        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(field, e, ref)}
          className="hidden"
          id={`file-${field}`}
        />

        {file ? (
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <div className="flex items-center gap-3 flex-1">
              <FileText size={24} style={{ color: '#10b981' }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(field, ref)}
              className="p-2 rounded-lg transition-all hover:bg-red-500/20"
              style={{ color: '#ef4444' }}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <label
            htmlFor={`file-${field}`}
            className="flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{
              background: 'rgba(156, 122, 94, 0.1)',
              border: error ? '2px dashed #ef4444' : '2px dashed rgba(156, 122, 94, 0.5)'
            }}>
            <Upload size={32} style={{ color: error ? '#ef4444' : '#B39A72' }} className="mb-2" />
            <p className="font-medium text-sm mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Click para subir archivo
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
              PDF, JPG o PNG (Máx. 10MB)
            </p>
          </label>
        )}

        {error && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Documentos Legales
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Sube los documentos requeridos para tu registro
        </p>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
        <AlertCircle size={20} style={{ color: '#AE3F21' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
            Documentos obligatorios
          </p>
          <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            INE (ambos lados) y comprobante de domicilio son obligatorios para completar tu registro.
          </p>
        </div>
      </div>

      {/* Documentos Obligatorios */}
      <div className="p-6 rounded-xl space-y-6" style={{ background: 'rgba(174, 63, 33, 0.05)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={24} style={{ color: '#AE3F21' }} />
          <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Documentos Obligatorios
          </h3>
        </div>

        {renderFileUpload('ine_frente', 'INE o Identificación Oficial (Frente)', true, ineFrenteRef, 'Sube una foto clara del frente de tu INE')}
        {renderFileUpload('ine_reverso', 'INE o Identificación Oficial (Reverso)', true, ineReversoRef, 'Sube una foto clara del reverso de tu INE')}
        {renderFileUpload('comprobante_domicilio', 'Comprobante de Domicilio', true, comprobanteDomicilioRef, 'No mayor a 3 meses (luz, agua, teléfono, estado de cuenta)')}
      </div>

      {/* Progress */}
      {(data.ine_frente || data.ine_reverso || data.comprobante_domicilio) && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} style={{ color: '#10b981' }} />
            <p className="text-sm font-medium" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              Progreso de documentos
            </p>
          </div>
          <div className="space-y-1">
            {data.ine_frente && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ INE (Frente) subida
              </p>
            )}
            {data.ine_reverso && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ INE (Reverso) subida
              </p>
            )}
            {data.comprobante_domicilio && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ Comprobante de domicilio subido
              </p>
            )}
          </div>
        </div>
      )}

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