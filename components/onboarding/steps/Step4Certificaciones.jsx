'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload, FileText, AlertCircle, Award, Calendar } from 'lucide-react'

export default function Step4Certificaciones({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const certificaciones = data.certificaciones || []

  const validateForm = () => {
    const newErrors = {}

    // Si no hay certificaciones, está bien (opcional)
    if (certificaciones.length === 0) {
      return true
    }

    // Si hay certificaciones, validar cada una
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
    
    // Limpiar errores de esta certificación
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

    // Limpiar error de este campo
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

    // Validar tipo (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      const newErrors = { ...errors }
      newErrors[`cert_${index}_archivo`] = 'Solo PDF, JPG o PNG'
      setErrors(newErrors)
      return
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const newErrors = { ...errors }
      newErrors[`cert_${index}_archivo`] = 'Máximo 5MB'
      setErrors(newErrors)
      return
    }

    actualizarCertificacion(index, 'archivo', file)
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

      {/* Lista de Certificaciones */}
      <div className="space-y-4">
        {certificaciones.map((cert, index) => (
          <div
            key={cert.id}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
            
            {/* Header */}
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
                  className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                  style={{ color: '#ef4444' }}>
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Campos */}
            <div className="space-y-4">
              {/* Nombre */}
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
                  placeholder="Ej: Instructor de Spinning Certificado"
                />
                {errors[`cert_${index}_nombre`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_nombre`]}
                  </p>
                )}
              </div>

              {/* Institución */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Institución Emisora *
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
                  placeholder="Ej: AFAA, ACE, NASM, etc."
                />
                {errors[`cert_${index}_institucion`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_institucion`]}
                  </p>
                )}
              </div>

              {/* Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Fecha de Obtención *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar size={20} style={{ color: '#B39A72' }} />
                    </div>
                    <input
                      type="date"
                      value={cert.fecha_obtencion}
                      onChange={(e) => actualizarCertificacion(index, 'fecha_obtencion', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: errors[`cert_${index}_fecha`] ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                  </div>
                  {errors[`cert_${index}_fecha`] && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                      <AlertCircle size={14} /> {errors[`cert_${index}_fecha`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Fecha de Vigencia <span className="text-xs font-normal" style={{ color: '#666' }}>(Opcional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar size={20} style={{ color: '#B39A72' }} />
                    </div>
                    <input
                      type="date"
                      value={cert.fecha_vigencia}
                      onChange={(e) => actualizarCertificacion(index, 'fecha_vigencia', e.target.value)}
                      min={cert.fecha_obtencion || undefined}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Archivo de Certificado *
                </label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(index, e)}
                    className="hidden"
                    id={`file-cert-${index}`}
                  />
                  
                  <label
                    htmlFor={`file-cert-${index}`}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:opacity-80"
                    style={{
                      background: cert.archivo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 122, 94, 0.1)',
                      border: errors[`cert_${index}_archivo`] ? '2px dashed #ef4444' : cert.archivo ? '2px solid #10b981' : '2px dashed rgba(156, 122, 94, 0.5)'
                    }}>
                    {cert.archivo ? (
                      <>
                        <FileText size={24} style={{ color: '#10b981' }} />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                            {cert.archivo.name}
                          </p>
                          <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                            {(cert.archivo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={24} style={{ color: '#B39A72' }} />
                        <div className="text-center">
                          <p className="font-medium text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                            Click para subir archivo
                          </p>
                          <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                            PDF, JPG o PNG (Máx. 5MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {errors[`cert_${index}_archivo`] && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={14} /> {errors[`cert_${index}_archivo`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón Agregar Certificación */}
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

      {/* Error general */}
      {errors.certificaciones && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <p className="text-sm flex items-center gap-2" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={16} /> {errors.certificaciones}
          </p>
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