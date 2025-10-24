'use client'

import { useState } from 'react'
import { 
  User, Phone, Calendar, MapPin, FileText, 
  Briefcase, Instagram, Facebook, Music, Save,
  AlertCircle
} from 'lucide-react'

/**
 * Formulario de edición de perfil por secciones
 * Maneja campos editables vs protegidos según estado del coach
 */
export default function EditarPerfilForm({ 
  initialData, 
  onSubmit, 
  loading, 
  esCoachPendiente = true,
  esAdmin = false 
}) {
  const [formData, setFormData] = useState({
    // Información Personal
    nombre: initialData?.nombre || '',
    apellidos: initialData?.apellidos || '',
    telefono: initialData?.telefono || '',
    fecha_nacimiento: initialData?.fecha_nacimiento || '',
    direccion: initialData?.direccion || '',
    rfc: initialData?.rfc || '',
    
    // Contacto de Emergencia
    contacto_emergencia: initialData?.contacto_emergencia || {
      nombre: '',
      telefono: '',
      relacion: ''
    },
    
    // Información Profesional
    bio: initialData?.bio || '',
    años_experiencia: initialData?.años_experiencia || 0,
    
    // Redes Sociales
    instagram: initialData?.instagram || '',
    facebook: initialData?.facebook || '',
    tiktok: initialData?.tiktok || ''
  })

  const [errors, setErrors] = useState({})
  const [seccionActiva, setSeccionActiva] = useState('personal')

  // Determinar si un campo es editable
  const esEditable = (campo) => {
    if (esAdmin) return true
    if (esCoachPendiente) return true
    
    // Coach activo solo puede editar estos campos
    const camposEditablesActivo = [
      'bio', 'instagram', 'facebook', 'tiktok', 
      'telefono', 'direccion', 'contacto_emergencia'
    ]
    
    return camposEditablesActivo.includes(campo)
  }

  // Determinar si un campo es protegido (requiere solicitud de cambio)
  const esProtegido = (campo) => {
    if (esAdmin || esCoachPendiente) return false
    
    const camposProtegidos = [
      'nombre', 'apellidos', 'fecha_nacimiento', 'rfc', 'años_experiencia'
    ]
    
    return camposProtegidos.includes(campo)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleContactoEmergenciaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contacto_emergencia: {
        ...prev.contacto_emergencia,
        [field]: value
      }
    }))
  }

  const validarFormulario = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos'
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'Teléfono debe tener 10 dígitos'
    }

    if (!formData.bio.trim() || formData.bio.length < 50) {
      newErrors.bio = 'La bio debe tener al menos 50 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      setSeccionActiva('personal') // Ir a la primera sección con errores
      return
    }
    
    onSubmit(formData)
  }

  const secciones = [
    { id: 'personal', nombre: 'Personal', icono: User },
    { id: 'profesional', nombre: 'Profesional', icono: Briefcase },
    { id: 'redes', nombre: 'Redes Sociales', icono: Instagram }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs de Secciones */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {secciones.map(seccion => {
          const Icono = seccion.icono
          return (
            <button
              key={seccion.id}
              type="button"
              onClick={() => setSeccionActiva(seccion.id)}
              className="px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2"
              style={{
                background: seccionActiva === seccion.id ? '#AE3F21' : 'rgba(179, 154, 114, 0.1)',
                color: seccionActiva === seccion.id ? '#FFFCF3' : '#B39A72',
                fontFamily: 'Montserrat, sans-serif'
              }}>
              <Icono size={18} />
              {seccion.nombre}
            </button>
          )
        })}
      </div>

      {/* Sección: Información Personal */}
      {seccionActiva === 'personal' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <User size={20} style={{ color: '#AE3F21' }} />
            Información Personal
          </h3>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Nombre *
              {esProtegido('nombre') && (
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                  Cambio requiere aprobación
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              disabled={loading || !esEditable('nombre')}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: errors.nombre ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif',
                opacity: !esEditable('nombre') ? 0.6 : 1
              }}
            />
            {errors.nombre && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nombre}</p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Apellidos *
              {esProtegido('apellidos') && (
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                  Cambio requiere aprobación
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.apellidos}
              onChange={(e) => handleChange('apellidos', e.target.value)}
              disabled={loading || !esEditable('apellidos')}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: errors.apellidos ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif',
                opacity: !esEditable('apellidos') ? 0.6 : 1
              }}
            />
            {errors.apellidos && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.apellidos}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Phone size={16} className="inline mr-2" />
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              disabled={loading}
              placeholder="5512345678"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: errors.telefono ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
            {errors.telefono && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.telefono}</p>
            )}
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Calendar size={16} className="inline mr-2" />
              Fecha de Nacimiento *
              {esProtegido('fecha_nacimiento') && (
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                  Cambio requiere aprobación
                </span>
              )}
            </label>
            <input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              disabled={loading || !esEditable('fecha_nacimiento')}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif',
                opacity: !esEditable('fecha_nacimiento') ? 0.6 : 1
              }}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <MapPin size={16} className="inline mr-2" />
              Dirección *
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              disabled={loading}
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>

          {/* RFC */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <FileText size={16} className="inline mr-2" />
              RFC *
              {esProtegido('rfc') && (
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                  Cambio requiere aprobación
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.rfc}
              onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
              disabled={loading || !esEditable('rfc')}
              className="w-full px-4 py-3 rounded-xl text-sm uppercase"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif',
                opacity: !esEditable('rfc') ? 0.6 : 1
              }}
            />
          </div>

          {/* Contacto de Emergencia */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(174, 63, 33, 0.05)', border: '1px solid rgba(174, 63, 33, 0.1)' }}>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <AlertCircle size={16} style={{ color: '#AE3F21' }} />
              Contacto de Emergencia
            </h4>
            
            <div className="space-y-3">
              <input
                type="text"
                value={formData.contacto_emergencia.nombre}
                onChange={(e) => handleContactoEmergenciaChange('nombre', e.target.value)}
                disabled={loading}
                placeholder="Nombre completo"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              
              <input
                type="tel"
                value={formData.contacto_emergencia.telefono}
                onChange={(e) => handleContactoEmergenciaChange('telefono', e.target.value)}
                disabled={loading}
                placeholder="Teléfono"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              
              <input
                type="text"
                value={formData.contacto_emergencia.relacion}
                onChange={(e) => handleContactoEmergenciaChange('relacion', e.target.value)}
                disabled={loading}
                placeholder="Relación (ej: Esposa, Hermano, Madre)"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sección: Información Profesional */}
      {seccionActiva === 'profesional' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <Briefcase size={20} style={{ color: '#AE3F21' }} />
            Información Profesional
          </h3>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Bio / Descripción *
              <span className="ml-2 text-xs opacity-70">({formData.bio.length}/500 caracteres)</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              disabled={loading}
              maxLength={500}
              rows={5}
              placeholder="Cuéntanos sobre tu experiencia, especialidades y pasión por el fitness..."
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: errors.bio ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
            {errors.bio && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.bio}</p>
            )}
          </div>

          {/* Años de Experiencia */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Años de Experiencia *
              {esProtegido('años_experiencia') && (
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                  Cambio requiere aprobación
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.años_experiencia}
              onChange={(e) => handleChange('años_experiencia', parseInt(e.target.value) || 0)}
              disabled={loading || !esEditable('años_experiencia')}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif',
                opacity: !esEditable('años_experiencia') ? 0.6 : 1
              }}
            />
          </div>
        </div>
      )}

      {/* Sección: Redes Sociales */}
      {seccionActiva === 'redes' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4"
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            <Instagram size={20} style={{ color: '#AE3F21' }} />
            Redes Sociales
          </h3>

          <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Agrega tus redes sociales (opcional)
          </p>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Instagram size={16} className="inline mr-2" />
              Instagram
            </label>
            <div className="flex items-center gap-2">
              <span style={{ color: '#B39A72' }}>@</span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value.replace('@', ''))}
                disabled={loading}
                placeholder="usuario"
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Facebook size={16} className="inline mr-2" />
              Facebook
            </label>
            <input
              type="text"
              value={formData.facebook}
              onChange={(e) => handleChange('facebook', e.target.value)}
              disabled={loading}
              placeholder="facebook.com/usuario"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(156, 122, 94, 0.1)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>

          {/* TikTok */}
          <div>
            <label className="block text-sm font-semibold mb-2"
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Music size={16} className="inline mr-2" />
              TikTok
            </label>
            <div className="flex items-center gap-2">
              <span style={{ color: '#B39A72' }}>@</span>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => handleChange('tiktok', e.target.value.replace('@', ''))}
                disabled={loading}
                placeholder="usuario"
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(156, 122, 94, 0.1)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="pt-4 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 rounded-xl font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(179, 154, 114, 0.3)' : '#AE3F21',
            color: '#FFFCF3',
            fontFamily: 'Montserrat, sans-serif',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          <Save size={20} />
          {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
