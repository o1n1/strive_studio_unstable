'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload, FileText, AlertCircle, Award, Calendar, X, CheckCircle } from 'lucide-react'

export default function Step4Certificaciones({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const certificaciones = data.certificaciones || []

  const validateForm = () => {
    const newErrors = {}

    if (certificaciones.length === 0) {
      return true
    }

    let hasErrors = false
    certificaciones.forEach((cert, index) => {
      if (!cert.nombre?.trim()) {
        newErrors[`cert_${index}_nombre`] = 'El nombre es requerido'
        hasErrors = true
      }
      if (!cert.institucion?.trim()) {
        newErrors[`cert_${index}_institucion`] = 'La institución es requerida'
        hasErrors = true
      }
      if (!cert.fecha_obtencion) {
        newErrors[`cert_${index}_fecha`] = 'La fecha es requerida'
        hasErrors = true
      }
      if (!cert.archivo) {
        newErrors[`cert_${index}_archivo`] = 'El archivo es requerido'
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
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

  const agregarCertificacion = () => {
    const nuevasCertificaciones = [
      ...certificaciones,
      {
        id: Date.now(),
        nombre: '',
        institucion: '',
        fecha_obtencion: '',
        fecha_vigencia: '',
        archivo: null
      }
    ]
    updateData({ certificaciones: nuevasCertificaciones })
  }

  const eliminarCertificacion = (index) => {
    const nuevasCertificaciones = certificaciones.filter((_, i) => i !== index)
    updateData({ certificaciones: nuevasCertificaciones })
    
    const newErrors = { ...errors }
    delete newErrors[`cert_${index}_nombre`]
    delete newErrors[`cert_${index}_institucion`]
    delete newErrors[`cert_${index}_fecha`]
    delete newErrors[`cert_${index}_archivo`]
    setErrors(newErrors)
  }

  const actualizarCertificacion = (index, campo, valor) => {
    const nuevasCertificaciones = [...certificaciones]
    nuevasCertificaciones[index][campo] = valor
    updateData({ certificaciones: nuevasCertificaciones })

    const errorKey = `cert_${index}_${campo === 'fecha_obtencion' ? 'fecha' : campo}`
    if (errors[errorKey]) {
      const newErrors = { ...errors }
      delete newErrors[errorKey]
      setErrors(newErrors)
    }
  }

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      const newErrors = { ...errors }
      newErrors[`cert_${index}_archivo`] = 'Solo PDF, JPG o PNG'
      setErrors(newErrors)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      const newErrors = { ...errors }
      newErrors[`cert_${index}_archivo`] = 'Máximo 5MB'
      setErrors(newErrors)
      return
    }

    // ✅ CAMBIO CRÍTICO: Convertir a base64 antes de guardar
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      actualizarCertificacion(index, 'archivo', base64String)  // ✅ Guardar base64
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (index) => {
    actualizarCertificacion(index, 'archivo', null)
  }

  const getFileName = (archivo) => {
    if (!archivo) return null
    if (typeof archivo === 'string' && archivo.startsWith('data:')) {
      const match = archivo.match(/data:([^;]+);/)
      if (match) {
        const mimeType = match[1]
        if (mimeType.includes('pdf')) return 'Certificado PDF'
        if (mimeType.includes('image')) return 'Certificado (Imagen)'
      }
    }
    return 'Certificado subido'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Certificaciones
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Agrega tus certificaciones y credenciales profesionales
        </p>
      </div>

      {certificaciones.length === 0 && (
        <div className="p-6 rounded-xl text-center" style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px dashed rgba(156, 122, 94, 0.5)' }}>
          <Award size={48} style={{ color: '#B39A72' }} className="mx-auto mb-3" />
          <p className="text-sm mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            No has agregado certificaciones. Son opcionales pero recomendadas.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {certificaciones.map((cert, index) => (
          <div
            key={cert.id}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={24} style={{ color: '#AE3F21' }} />
                <h3 className="font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Certificación #{index + 1}
                </h3>
              </div>
              
              {certificaciones.length > 1 && (
                <button
                  type="button"
                  onClick={() => eliminarCertificacion(index)}
                  className="p-2 rounded-lg hover:opacity-80 transition-all"
                  style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <Trash2 size={18} style={{ color: '#ef4444' }} />
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Nombre de la Certificación *
                </label>
                <input
                  type="text"
                  value={cert.nombre}
                  onChange={(e) => actualizarCertificacion(index, 'nombre', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: errors[`cert_${index}_nombre`] ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  placeholder="Ej: Certificación de Spinning"
                />
                {errors[`cert_${index}_nombre`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_nombre`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Institución *
                </label>
                <input
                  type="text"
                  value={cert.institucion}
                  onChange={(e) => actualizarCertificacion(index, 'institucion', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: errors[`cert_${index}_institucion`] ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                  placeholder="Ej: AFAA, ACE, NASM"
                />
                {errors[`cert_${index}_institucion`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_institucion`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Fecha de Obtención *
                </label>
                <input
                  type="date"
                  value={cert.fecha_obtencion}
                  onChange={(e) => actualizarCertificacion(index, 'fecha_obtencion', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: errors[`cert_${index}_fecha`] ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
                {errors[`cert_${index}_fecha`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_fecha`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Fecha de Vigencia (Opcional)
                </label>
                <input
                  type="date"
                  value={cert.fecha_vigencia}
                  onChange={(e) => actualizarCertificacion(index, 'fecha_vigencia', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Archivo del Certificado *
              </label>
              
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(index, e)}
                className="hidden"
                id={`cert-file-${index}`}
              />

              {cert.archivo ? (
                <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {getFileName(cert.archivo)}
                      </p>
                      <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        Archivo cargado correctamente
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-2 rounded-lg hover:opacity-80 transition-all"
                    style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                    <X size={18} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`cert-file-${index}`}
                  className="flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: errors[`cert_${index}_archivo`] ? '2px dashed #ef4444' : '2px dashed rgba(156, 122, 94, 0.5)'
                  }}>
                  <Upload size={28} style={{ color: errors[`cert_${index}_archivo`] ? '#ef4444' : '#B39A72' }} className="mb-2" />
                  <p className="font-medium text-sm mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Click para subir certificado
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                    PDF, JPG o PNG (Máx. 5MB)
                  </p>
                </label>
              )}

              {errors[`cert_${index}_archivo`] && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                  <AlertCircle size={14} /> {errors[`cert_${index}_archivo`]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {certificaciones.length < 10 && (
        <button
          type="button"
          onClick={agregarCertificacion}
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: 'rgba(156, 122, 94, 0.2)', border: '2px dashed rgba(156, 122, 94, 0.5)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          <Plus size={20} />
          Agregar Otra Certificación
        </button>
      )}

      {errors.submit && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            {errors.submit}
          </p>
        </div>
      )}

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
