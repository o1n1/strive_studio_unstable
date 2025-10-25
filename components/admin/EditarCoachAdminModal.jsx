// components/admin/EditarCoachAdminModal.jsx
'use client'

import { useState, useEffect } from 'react'
import { 
  X, Save, AlertTriangle, CheckCircle, User, Mail, 
  Phone, Calendar, MapPin, Building, CreditCard, 
  Award, Instagram, Facebook, Hash, FileText, Crown,
  Loader2, Star, Users
} from 'lucide-react'

/**
 * ==========================================
 * COMPONENTE: EditarCoachAdminModal
 * ==========================================
 * 
 * Modal completo para que ADMINISTRADOR edite información de coaches
 * 
 * CARACTERÍSTICAS:
 * - Edición de todos los campos del coach
 * - Designación de Head Coach
 * - Cambio de categoría (cycling/funcional/ambos)
 * - Cambio de estado (activo/inactivo/etc)
 * - Validaciones en tiempo real
 * - Confirmaciones para cambios críticos
 * - Información bancaria segura
 * - Redes sociales y especialidades
 * - UI profesional y responsive
 * 
 * PROPS:
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {object} coach - Objeto completo del coach a editar
 * @param {function} onSuccess - Callback al guardar exitosamente
 */
export default function EditarCoachAdminModal({ isOpen, onClose, coach, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({})
  const [showConfirmacion, setShowConfirmacion] = useState(false)
  const [cambiosCriticos, setCambiosCriticos] = useState([])
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('')

  // Inicializar formulario cuando cambia el coach
  useEffect(() => {
    if (coach && isOpen) {
      setFormData({
        nombre: coach.nombre || '',
        apellidos: coach.apellidos || '',
        email: coach.email || '',
        telefono: coach.telefono || '',
        fecha_nacimiento: coach.fecha_nacimiento || '',
        rfc: coach.rfc || '',
        direccion: coach.direccion || '',
        bio: coach.bio || '',
        años_experiencia: coach.años_experiencia || 0,
        categoria: coach.categoria || 'cycling',
        estado: coach.estado || 'activo',
        is_head_coach: coach.is_head_coach || false,
        banco: coach.banco || '',
        clabe: '', // No mostramos CLABE actual por seguridad
        titular_cuenta: coach.titular_cuenta || '',
        instagram: coach.instagram || '',
        facebook: coach.facebook || '',
        tiktok: coach.tiktok || '',
        especialidades: coach.especialidades || [],
        notas_admin: coach.notas_admin || ''
      })
      setErrors({})
    }
  }, [coach, isOpen])

  // Validación en tiempo real
  const validateField = (field, value) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'nombre':
      case 'apellidos':
        if (!value || value.trim().length < 2) {
          newErrors[field] = 'Debe tener al menos 2 caracteres'
        } else {
          delete newErrors[field]
        }
        break

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value || !emailRegex.test(value)) {
          newErrors.email = 'Email inválido'
        } else {
          delete newErrors.email
        }
        break

      case 'telefono':
        if (value) {
          const telefonoLimpio = value.replace(/\s/g, '')
          if (!/^\d{10}$/.test(telefonoLimpio)) {
            newErrors.telefono = 'Debe tener 10 dígitos'
          } else {
            delete newErrors.telefono
          }
        } else {
          delete newErrors.telefono
        }
        break

      case 'rfc':
        if (value) {
          const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/
          if (!rfcRegex.test(value.toUpperCase())) {
            newErrors.rfc = 'RFC inválido'
          } else {
            delete newErrors.rfc
          }
        } else {
          delete newErrors.rfc
        }
        break

      case 'clabe':
        if (value && (value.length !== 18 || !/^\d{18}$/.test(value))) {
          newErrors.clabe = 'La CLABE debe tener 18 dígitos'
        } else {
          delete newErrors.clabe
        }
        break

      case 'años_experiencia':
        const exp = parseInt(value)
        if (isNaN(exp) || exp < 0 || exp > 50) {
          newErrors.años_experiencia = 'Debe estar entre 0 y 50'
        } else {
          delete newErrors.años_experiencia
        }
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    validateField(field, value)
  }

  const handleAgregarEspecialidad = () => {
    if (nuevaEspecialidad.trim() && !formData.especialidades.includes(nuevaEspecialidad.trim())) {
      setFormData({
        ...formData,
        especialidades: [...formData.especialidades, nuevaEspecialidad.trim()]
      })
      setNuevaEspecialidad('')
    }
  }

  const handleEliminarEspecialidad = (index) => {
    const nuevasEspecialidades = formData.especialidades.filter((_, i) => i !== index)
    setFormData({ ...formData, especialidades: nuevasEspecialidades })
  }

  // Detectar cambios críticos
  const detectarCambiosCriticos = () => {
    const criticos = []

    if (formData.email !== coach.email) {
      criticos.push('Email (afecta inicio de sesión)')
    }

    if (formData.estado !== coach.estado) {
      criticos.push(`Estado (${coach.estado} → ${formData.estado})`)
    }

    if (formData.categoria !== coach.categoria) {
      criticos.push(`Categoría (${coach.categoria} → ${formData.categoria})`)
    }

    if (formData.is_head_coach !== coach.is_head_coach) {
      criticos.push(formData.is_head_coach ? 'Designar como Head Coach' : 'Remover como Head Coach')
    }

    if (formData.clabe && formData.clabe.length > 0) {
      criticos.push('CLABE bancaria (información sensible)')
    }

    return criticos
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar todos los campos
    let tieneErrores = false
    Object.keys(formData).forEach(field => {
      if (!validateField(field, formData[field])) {
        tieneErrores = true
      }
    })

    if (tieneErrores) {
      alert('⚠️ Por favor corrige los errores antes de guardar')
      return
    }

    // Detectar cambios críticos
    const criticos = detectarCambiosCriticos()
    if (criticos.length > 0) {
      setCambiosCriticos(criticos)
      setShowConfirmacion(true)
      return
    }

    // Si no hay cambios críticos, guardar directamente
    await guardarCambios()
  }

  const guardarCambios = async () => {
    setLoading(true)
    setShowConfirmacion(false)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // Preparar payload (solo enviar campos que cambiaron)
      const payload = {}
      Object.keys(formData).forEach(key => {
        if (key === 'clabe') {
          // Solo enviar CLABE si se modificó
          if (formData.clabe && formData.clabe.length > 0) {
            payload.clabe = formData.clabe
          }
        } else if (JSON.stringify(formData[key]) !== JSON.stringify(coach[key])) {
          payload[key] = formData[key]
        }
      })

      console.log('📤 [MODAL] Enviando cambios:', payload)

      const response = await fetch(`/api/coaches/${coach.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar coach')
      }

      console.log('✅ [MODAL] Coach actualizado:', result)
      
      alert(`✅ Coach actualizado exitosamente\n${result.cambios?.length || 0} cambio(s) aplicado(s)`)
      
      if (onSuccess) onSuccess()
      onClose()

    } catch (error) {
      console.error('❌ [MODAL] Error:', error)
      alert('Error al guardar cambios: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !coach) return null

  return (
    <>
      {/* Modal Principal */}
      <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-4xl backdrop-blur-xl rounded-2xl shadow-2xl my-8"
          style={{ 
            background: 'rgba(53, 53, 53, 0.95)',
            border: '1px solid rgba(156, 122, 94, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
            style={{ 
              background: 'rgba(53, 53, 53, 0.98)',
              borderColor: 'rgba(156, 122, 94, 0.3)' 
            }}>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <User size={24} style={{ color: '#AE3F21' }} />
                Editar Coach
              </h2>
              <p className="text-sm mt-1" style={{ color: '#B39A72' }}>
                {coach.nombre} {coach.apellidos}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: '#B39A72' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* SECCIÓN: Información Personal */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <User size={20} style={{ color: '#AE3F21' }} />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: errors.nombre ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  />
                  {errors.nombre && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nombre}</p>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleChange('apellidos', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: errors.apellidos ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  />
                  {errors.apellidos && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.apellidos}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Email * 
                    <span className="text-xs ml-2" style={{ color: '#f59e0b' }}>
                      (Afecta inicio de sesión)
                    </span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: errors.email ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="10 dígitos"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: errors.telefono ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                  {errors.telefono && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.telefono}</p>
                  )}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                </div>

                {/* RFC */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    RFC
                  </label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="text"
                      value={formData.rfc}
                      onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm uppercase"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: errors.rfc ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                  {errors.rfc && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.rfc}</p>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                  Dirección
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3" style={{ color: '#B39A72' }} />
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    rows={2}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm resize-none"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN: Categoría y Estado */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <Award size={20} style={{ color: '#AE3F21' }} />
                Categoría y Estado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  >
                    <option value="cycling">Cycling</option>
                    <option value="funcional">Funcional</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                {/* Años de Experiencia */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Años de Experiencia
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.años_experiencia}
                    onChange={(e) => handleChange('años_experiencia', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: errors.años_experiencia ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  />
                  {errors.años_experiencia && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.años_experiencia}</p>
                  )}
                </div>
              </div>

              {/* Head Coach */}
              <div className="mt-4 p-4 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
                <div className="flex items-center gap-3">
                  <Crown size={24} style={{ color: '#AE3F21' }} />
                  <div>
                    <p className="font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      Head Coach
                    </p>
                    <p className="text-xs" style={{ color: '#B39A72' }}>
                      Designar como instructor principal
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_head_coach}
                    onChange={(e) => handleChange('is_head_coach', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{ background: formData.is_head_coach ? '#AE3F21' : '#4B5563' }}
                  />
                </label>
              </div>
            </div>

            {/* SECCIÓN: Información Bancaria */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <Building size={20} style={{ color: '#AE3F21' }} />
                Información Bancaria
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Banco */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Banco
                  </label>
                  <select
                    value={formData.banco}
                    onChange={(e) => handleChange('banco', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  >
                    <option value="">Seleccionar banco</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Santander">Santander</option>
                    <option value="Banorte">Banorte</option>
                    <option value="HSBC">HSBC</option>
                    <option value="Citibanamex">Citibanamex</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Inbursa">Inbursa</option>
                    <option value="Afirme">Afirme</option>
                    <option value="BanBajío">BanBajío</option>
                    <option value="Banregio">Banregio</option>
                  </select>
                </div>

                {/* Titular de Cuenta */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Titular de la Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.titular_cuenta}
                    onChange={(e) => handleChange('titular_cuenta', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(42, 42, 42, 0.8)',
                      border: '1px solid rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3'
                    }}
                  />
                </div>

                {/* CLABE */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    CLABE Interbancaria
                    <span className="text-xs ml-2" style={{ color: '#f59e0b' }}>
                      (Solo ingresa si deseas cambiarla)
                    </span>
                  </label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="text"
                      value={formData.clabe}
                      onChange={(e) => handleChange('clabe', e.target.value)}
                      placeholder="18 dígitos (déjalo vacío para mantener la actual)"
                      maxLength={18}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: errors.clabe ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                  {errors.clabe && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.clabe}</p>
                  )}
                  {coach.clabe_encriptada && (
                    <p className="text-xs mt-1" style={{ color: '#22c55e' }}>
                      ✓ Ya tiene CLABE registrada (encriptada)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN: Biografía y Redes Sociales */}
            <div>
              <h3 className="text-lg font-bold mb-4" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Biografía y Redes Sociales
              </h3>
              
              {/* Bio */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                  Biografía
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={3}
                  placeholder="Cuéntanos sobre tu experiencia..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Instagram */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => handleChange('instagram', e.target.value)}
                      placeholder="@usuario"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    Facebook
                  </label>
                  <div className="relative">
                    <Facebook size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => handleChange('facebook', e.target.value)}
                      placeholder="Usuario de Facebook"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3' }}>
                    TikTok
                  </label>
                  <div className="relative">
                    <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B39A72' }} />
                    <input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => handleChange('tiktok', e.target.value)}
                      placeholder="@usuario"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(42, 42, 42, 0.8)',
                        border: '1px solid rgba(156, 122, 94, 0.3)',
                        color: '#FFFCF3'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN: Especialidades */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <Star size={20} style={{ color: '#AE3F21' }} />
                Especialidades
              </h3>
              
              {/* Lista de especialidades actuales */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.especialidades.map((esp, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#FFFCF3' }}
                  >
                    {esp}
                    <button
                      type="button"
                      onClick={() => handleEliminarEspecialidad(index)}
                      className="hover:opacity-70"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Agregar nueva especialidad */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaEspecialidad}
                  onChange={(e) => setNuevaEspecialidad(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarEspecialidad())}
                  placeholder="Nueva especialidad"
                  className="flex-1 px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: 'rgba(42, 42, 42, 0.8)',
                    border: '1px solid rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAgregarEspecialidad}
                  className="px-4 py-2 rounded-xl font-semibold hover:opacity-90"
                  style={{ background: '#AE3F21', color: '#FFFCF3' }}
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* SECCIÓN: Notas del Admin */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                <FileText size={20} style={{ color: '#AE3F21' }} />
                Notas Administrativas
              </h3>
              <textarea
                value={formData.notas_admin}
                onChange={(e) => handleChange('notas_admin', e.target.value)}
                rows={3}
                placeholder="Notas internas visibles solo para administradores..."
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'rgba(42, 42, 42, 0.8)',
                  border: '1px solid rgba(156, 122, 94, 0.3)',
                  color: '#FFFCF3'
                }}
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.3)' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                style={{ 
                  background: 'rgba(156, 122, 94, 0.2)', 
                  color: '#B39A72',
                  border: '1px solid rgba(156, 122, 94, 0.3)'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ 
                  background: loading || Object.keys(errors).length > 0 ? '#6B7280' : '#AE3F21', 
                  color: '#FFFCF3',
                  opacity: loading || Object.keys(errors).length > 0 ? 0.5 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación para Cambios Críticos */}
      {showConfirmacion && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]">
          <div 
            className="w-full max-w-md backdrop-blur-xl rounded-2xl p-6"
            style={{ 
              background: 'rgba(53, 53, 53, 0.98)',
              border: '2px solid #f59e0b'
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle size={32} style={{ color: '#f59e0b' }} className="flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Confirmar Cambios Críticos
                </h3>
                <p className="text-sm" style={{ color: '#B39A72' }}>
                  Los siguientes cambios pueden afectar el funcionamiento del sistema:
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {cambiosCriticos.map((cambio, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-2 text-sm p-2 rounded"
                  style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#FFFCF3' }}
                >
                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                  {cambio}
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmacion(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl font-semibold"
                style={{ 
                  background: 'rgba(156, 122, 94, 0.2)', 
                  color: '#B39A72',
                  border: '1px solid rgba(156, 122, 94, 0.3)'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ background: '#f59e0b', color: '#0A0A0A' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirmar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}