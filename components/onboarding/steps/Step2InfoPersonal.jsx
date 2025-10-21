'use client'

import { useState, useRef } from 'react'
import { User, Phone, Calendar, MapPin, FileText, Users, Upload, X, AlertCircle, Camera } from 'lucide-react'
import Image from 'next/image'

export default function Step2InfoPersonal({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const validateForm = () => {
    const newErrors = {}

    if (!data.nombre?.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!data.apellidos?.trim()) newErrors.apellidos = 'Los apellidos son requeridos'
    
    if (!data.telefono?.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(data.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'Debe ser un teléfono válido de 10 dígitos'
    }

    if (!data.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida'
    } else {
      const fechaNac = new Date(data.fecha_nacimiento)
      const edad = Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000))
      if (edad < 18) {
        newErrors.fecha_nacimiento = 'Debes ser mayor de 18 años'
      }
    }

    if (!data.direccion?.trim()) newErrors.direccion = 'La dirección es requerida'
    
    if (!data.rfc?.trim()) {
      newErrors.rfc = 'El RFC es requerido'
    } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(data.rfc.toUpperCase())) {
      newErrors.rfc = 'RFC inválido (Ej: ABCD123456XXX)'
    }

    if (!data.contacto_emergencia_nombre?.trim()) {
      newErrors.contacto_emergencia_nombre = 'El nombre del contacto es requerido'
    }

    if (!data.contacto_emergencia_telefono?.trim()) {
      newErrors.contacto_emergencia_telefono = 'El teléfono del contacto es requerido'
    } else if (!/^\d{10}$/.test(data.contacto_emergencia_telefono.replace(/\s/g, ''))) {
      newErrors.contacto_emergencia_telefono = 'Debe ser un teléfono válido de 10 dígitos'
    }

    if (!data.foto_perfil) {
      newErrors.foto_perfil = 'La foto de perfil es requerida'
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, foto_perfil: 'Solo se permiten imágenes' })
      return
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, foto_perfil: 'La imagen no debe superar 5MB' })
      return
    }

    updateData({ foto_perfil: file })

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    // Limpiar error
    const newErrors = { ...errors }
    delete newErrors.foto_perfil
    setErrors(newErrors)
  }

  const removePhoto = () => {
    updateData({ foto_perfil: null })
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
    }
    return numbers.slice(0, 10)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Información Personal
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Completa tu perfil con tus datos personales
        </p>
      </div>

      {/* Foto de Perfil */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Foto de Perfil *
        </label>
        
        <div className="flex items-center gap-6">
          {/* Preview */}
          <div className="relative">
            {previewUrl ? (
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: '#AE3F21' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'rgba(156, 122, 94, 0.2)', border: errors.foto_perfil ? '2px dashed #ef4444' : '2px dashed rgba(156, 122, 94, 0.5)' }}
                onClick={() => fileInputRef.current?.click()}>
                <Camera size={32} style={{ color: '#B39A72' }} />
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 flex items-center gap-2"
              style={{ background: '#B39A72', color: '#1a1a1a', fontFamily: 'Montserrat, sans-serif' }}>
              <Upload size={20} />
              {previewUrl ? 'Cambiar Foto' : 'Subir Foto'}
            </button>
            <p className="text-xs mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
              JPG, PNG o GIF. Máximo 5MB.
            </p>
            {errors.foto_perfil && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <AlertCircle size={14} /> {errors.foto_perfil}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nombre y Apellidos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Nombre(s) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={20} style={{ color: '#B39A72' }} />
            </div>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => updateData({ nombre: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.nombre ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Juan"
            />
          </div>
          {errors.nombre && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle size={14} /> {errors.nombre}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Apellidos *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={20} style={{ color: '#B39A72' }} />
            </div>
            <input
              type="text"
              value={data.apellidos}
              onChange={(e) => updateData({ apellidos: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.apellidos ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Pérez García"
            />
          </div>
          {errors.apellidos && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle size={14} /> {errors.apellidos}
            </p>
          )}
        </div>
      </div>

      {/* Teléfono y Fecha Nacimiento */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Teléfono *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone size={20} style={{ color: '#B39A72' }} />
            </div>
            <input
              type="tel"
              value={data.telefono}
              onChange={(e) => updateData({ telefono: formatPhone(e.target.value) })}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.telefono ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="5551234567"
              maxLength="10"
            />
          </div>
          {errors.telefono && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle size={14} /> {errors.telefono}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Fecha de Nacimiento *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar size={20} style={{ color: '#B39A72' }} />
            </div>
            <input
              type="date"
              value={data.fecha_nacimiento}
              onChange={(e) => updateData({ fecha_nacimiento: e.target.value })}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.fecha_nacimiento ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>
          {errors.fecha_nacimiento && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle size={14} /> {errors.fecha_nacimiento}
            </p>
          )}
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Dirección Completa *
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin size={20} style={{ color: '#B39A72' }} />
          </div>
          <textarea
            value={data.direccion}
            onChange={(e) => updateData({ direccion: e.target.value })}
            rows="3"
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm resize-none"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.direccion ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="Calle, Número, Colonia, CP, Ciudad, Estado"
          />
        </div>
        {errors.direccion && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.direccion}
          </p>
        )}
      </div>

      {/* RFC */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          RFC (Para facturación) *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FileText size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type="text"
            value={data.rfc}
            onChange={(e) => updateData({ rfc: e.target.value.toUpperCase() })}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm uppercase"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.rfc ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="ABCD123456XXX"
            maxLength="13"
          />
        </div>
        {errors.rfc && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.rfc}
          </p>
        )}
      </div>

      {/* Contacto de Emergencia */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users size={24} style={{ color: '#AE3F21' }} />
          <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Contacto de Emergencia
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              value={data.contacto_emergencia_nombre}
              onChange={(e) => updateData({ contacto_emergencia_nombre: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.contacto_emergencia_nombre ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="María Pérez"
            />
            {errors.contacto_emergencia_nombre && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <AlertCircle size={14} /> {errors.contacto_emergencia_nombre}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Teléfono *
            </label>
            <input
              type="tel"
              value={data.contacto_emergencia_telefono}
              onChange={(e) => updateData({ contacto_emergencia_telefono: formatPhone(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                border: errors.contacto_emergencia_telefono ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="5551234567"
              maxLength="10"
            />
            {errors.contacto_emergencia_telefono && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
                <AlertCircle size={14} /> {errors.contacto_emergencia_telefono}
              </p>
            )}
          </div>
        </div>
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
