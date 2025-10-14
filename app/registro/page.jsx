'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Lock, AlertCircle, Heart, FileText, ArrowRight, ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import { registerUser } from '@/lib/supabase/auth'
import { useDebounce } from '@/hooks/useDebounce'
import { postJSON } from '@/lib/utils/fetchWithTimeout'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    emergenciaNombre: '',
    emergenciaTelefono: '',
    alergias: '',
    lesiones: '',
    aceptaDeslinde: false
  })
  const [loading, setLoading] = useState(false)
  
  // Estado para verificación de disponibilidad
  const [availability, setAvailability] = useState({
    email: { checking: false, available: null, message: '' },
    telefono: { checking: false, available: null, message: '' }
  })

  // Debounce para no verificar en cada tecla
  const debouncedEmail = useDebounce(formData.email, 800)
  const debouncedTelefono = useDebounce(formData.telefono, 800)

  // Validaciones
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^\d{10}$/.test(phone.replace(/\D/g, ''))
  const validatePassword = (pass) => pass.length >= 8
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

  // Formatear teléfono
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10)
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  const handlePhoneChange = (field, value) => {
    setFormData({ ...formData, [field]: formatPhone(value) })
  }

  // Verificar disponibilidad de email
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (!debouncedEmail || !validateEmail(debouncedEmail)) {
        setAvailability(prev => ({ ...prev, email: { checking: false, available: null, message: '' }}))
        return
      }

      setAvailability(prev => ({ ...prev, email: { checking: true, available: null, message: '' }}))

      try {
        const result = await postJSON('/api/check-availability', { email: debouncedEmail })
        
        if (result.success && result.email) {
          setAvailability(prev => ({ 
            ...prev, 
            email: { 
              checking: false, 
              available: result.email.available,
              message: result.email.reason || ''
            }
          }))
        }
      } catch (error) {
        console.error('Error verificando email:', error)
        setAvailability(prev => ({ ...prev, email: { checking: false, available: null, message: '' }}))
      }
    }

    checkEmailAvailability()
  }, [debouncedEmail])

  // Verificar disponibilidad de teléfono
  useEffect(() => {
    const checkPhoneAvailability = async () => {
      if (!debouncedTelefono || !validatePhone(debouncedTelefono)) {
        setAvailability(prev => ({ ...prev, telefono: { checking: false, available: null, message: '' }}))
        return
      }

      setAvailability(prev => ({ ...prev, telefono: { checking: true, available: null, message: '' }}))

      try {
        const result = await postJSON('/api/check-availability', { telefono: debouncedTelefono })
        
        if (result.success && result.telefono) {
          setAvailability(prev => ({ 
            ...prev, 
            telefono: { 
              checking: false, 
              available: result.telefono.available,
              message: result.telefono.reason || ''
            }
          }))
        }
      } catch (error) {
        console.error('Error verificando teléfono:', error)
        setAvailability(prev => ({ ...prev, telefono: { checking: false, available: null, message: '' }}))
      }
    }

    checkPhoneAvailability()
  }, [debouncedTelefono])

  const canContinueStep1 = 
    formData.nombre.trim() !== '' &&
    formData.apellidos.trim() !== '' &&
    validateEmail(formData.email) &&
    validatePhone(formData.telefono) &&
    validatePassword(formData.password) &&
    passwordsMatch &&
    availability.email.available === true &&
    availability.telefono.available === true

  const canContinueStep2 = 
    formData.emergenciaNombre.trim() !== '' &&
    validatePhone(formData.emergenciaTelefono)

  const handleSubmit = async () => {
    if (!formData.aceptaDeslinde) {
      alert('Debes aceptar la carta de deslinde de responsabilidad')
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        emergenciaNombre: formData.emergenciaNombre,
        emergenciaTelefono: formData.emergenciaTelefono,
        alergias: formData.alergias,
        lesiones: formData.lesiones
      })

      if (result.success) {
        router.push(`/verificar-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Helper para obtener icono de validación
  const getValidationIcon = (field) => {
    const status = availability[field]
    if (status.checking) return <Loader2 size={18} className="animate-spin" style={{ color: '#9C7A5E' }} />
    if (status.available === true) return <Check size={18} style={{ color: '#4CAF50' }} />
    if (status.available === false) return <X size={18} style={{ color: '#AE3F21' }} />
    return null
  }

  const steps = [
    { number: 1, title: 'Datos', icon: User },
    { number: 2, title: 'Salud', icon: Heart },
    { number: 3, title: 'Legal', icon: FileText }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
      style={{ 
        background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)',
        fontFamily: 'Montserrat, sans-serif' 
      }}>
      
      <div className="w-full max-w-2xl">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2" 
            style={{ color: '#FFFCF3' }}>
            STRIVE
          </h1>
          <p className="text-sm opacity-70" style={{ color: '#B39A72' }}>
            Cycling Studio
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    background: step >= s.number ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3'
                  }}
                >
                  {step > s.number ? <Check size={20} /> : <s.icon size={20} />}
                </div>
                <span className="text-xs opacity-70 hidden sm:block text-center" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="h-0.5 flex-1 mx-2" 
                  style={{ background: step > s.number ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card de formulario */}
        <div className="backdrop-blur-xl rounded-3xl p-7 md:p-10 shadow-2xl"
          style={{ 
            background: 'rgba(53, 53, 53, 0.6)',
            border: '1px solid rgba(156, 122, 94, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
          
          <div className="space-y-5">
            
            {/* PASO 1: Datos Personales */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-8" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Personal
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Nombre"
                    icon={User}
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre"
                  />
                  
                  <Input
                    label="Apellidos"
                    icon={User}
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Tus apellidos"
                  />
                </div>

                {/* Email con verificación */}
                <div className="relative">
                  <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@email.com"
                    error={
                      formData.email && !validateEmail(formData.email) 
                        ? 'Email inválido' 
                        : availability.email.available === false 
                        ? availability.email.message 
                        : ''
                    }
                  />
                  {formData.email && (
                    <div className="absolute right-3 top-[42px]">
                      {getValidationIcon('email')}
                    </div>
                  )}
                </div>

                {/* Teléfono con verificación */}
                <div className="relative">
                  <Input
                    label="Teléfono"
                    icon={Phone}
                    required
                    value={formData.telefono}
                    onChange={(e) => handlePhoneChange('telefono', e.target.value)}
                    placeholder="555-555-5555"
                    error={
                      formData.telefono && !validatePhone(formData.telefono) 
                        ? 'Teléfono inválido (10 dígitos)' 
                        : availability.telefono.available === false 
                        ? availability.telefono.message 
                        : ''
                    }
                  />
                  {formData.telefono && (
                    <div className="absolute right-3 top-[42px]">
                      {getValidationIcon('telefono')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Contraseña"
                    icon={Lock}
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    error={formData.password && !validatePassword(formData.password) ? 'Mínimo 8 caracteres' : ''}
                  />

                  <Input
                    label="Confirmar"
                    icon={Lock}
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repite la contraseña"
                    error={formData.confirmPassword && !passwordsMatch ? 'No coinciden' : ''}
                  />
                </div>
              </div>
            )}

            {/* PASO 2: Salud y Emergencia */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-8" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información de Salud y Emergencia
                </h2>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                    <AlertCircle size={18} /> Contacto de Emergencia
                  </h3>
                  
                  <div className="space-y-4">
                    <Input
                      label="Nombre Completo"
                      required
                      value={formData.emergenciaNombre}
                      onChange={(e) => setFormData({ ...formData, emergenciaNombre: e.target.value })}
                      placeholder="Nombre del contacto"
                    />

                    <Input
                      label="Teléfono"
                      icon={Phone}
                      required
                      value={formData.emergenciaTelefono}
                      onChange={(e) => handlePhoneChange('emergenciaTelefono', e.target.value)}
                      placeholder="555-555-5555"
                      error={formData.emergenciaTelefono && !validatePhone(formData.emergenciaTelefono) ? 'Teléfono inválido (10 dígitos)' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Alergias (opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      borderColor: 'rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    rows="3"
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                    placeholder="Describe cualquier alergia relevante..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Lesiones o Condiciones (opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      borderColor: 'rgba(156, 122, 94, 0.3)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                    rows="3"
                    value={formData.lesiones}
                    onChange={(e) => setFormData({ ...formData, lesiones: e.target.value })}
                    placeholder="Describe lesiones previas o condiciones médicas..."
                  />
                </div>
              </div>
            )}

            {/* PASO 3: Legal */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-8" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Carta de Deslinde de Responsabilidad
                </h2>

                <div className="p-6 rounded-xl max-h-96 overflow-y-auto" 
                  style={{ 
                    background: 'rgba(255, 252, 243, 0.05)',
                    border: '1px solid rgba(156, 122, 94, 0.3)'
                  }}>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    Al participar en las clases de cycling y actividades físicas en STRIVE Cycling Studio, 
                    reconozco y acepto que:
                  </p>
                  <ul className="space-y-2 text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                    <li>• Soy consciente de los riesgos inherentes a la actividad física intensa.</li>
                    <li>• He consultado con un médico y estoy en condiciones de realizar ejercicio físico.</li>
                    <li>• Eximo a STRIVE y su personal de cualquier responsabilidad por lesiones.</li>
                    <li>• Notificaré cualquier condición médica relevante antes de la clase.</li>
                    <li>• Seguiré las indicaciones del instructor en todo momento.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.aceptaDeslinde}
                    onChange={(e) => setFormData({ ...formData, aceptaDeslinde: e.target.checked })}
                    className="mt-1 rounded"
                    style={{ accentColor: '#AE3F21' }}
                  />
                  <span className="text-sm" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                    Acepto la carta de deslinde de responsabilidad. 
                    Comprendo los riesgos asociados con la actividad física y libero a STRIVE de toda responsabilidad.
                  </span>
                </label>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(156, 122, 94, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  <ArrowLeft size={20} />
                  Anterior
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    background: (step === 1 && canContinueStep1) || (step === 2 && canContinueStep2) ? '#AE3F21' : 'rgba(174, 63, 33, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Continuar
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!formData.aceptaDeslinde || loading}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    background: formData.aceptaDeslinde ? '#AE3F21' : 'rgba(174, 63, 33, 0.3)',
                    color: '#FFFCF3',
                    fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Link para iniciar sesión */}
        <p className="text-center mt-8 text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          ¿Ya tienes cuenta?{' '}
          <a 
            href="/" 
            className="transition-colors hover:underline opacity-90 hover:opacity-100 font-semibold" 
            style={{ color: '#AE3F21' }}
          >
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  )
}