'use client'

import { useState, useRef } from 'react'
import { Building2, CreditCard, User, AlertCircle, CheckCircle } from 'lucide-react'

const BANCOS_MEXICO = [
  'Banamex',
  'BBVA',
  'Santander',
  'Banorte',
  'HSBC',
  'Scotiabank',
  'Inbursa',
  'Azteca',
  'Afirme',
  'BanBajío',
  'BanRegio',
  'Invex',
  'Mifel',
  'Ve por Más',
  'Otro'
]

export default function Step7InfoBancaria({ data, updateData, nextStep, prevStep }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const estadoCuentaRef = useRef(null)

  const validateForm = () => {
    const newErrors = {}

    // Solo validar si se llenó algún campo
    const hasAnyBankData = data.banco || data.clabe || data.titular_cuenta || data.estado_cuenta

    if (hasAnyBankData) {
      if (!data.banco) {
        newErrors.banco = 'Selecciona un banco'
      }
      if (!data.clabe) {
        newErrors.clabe = 'La CLABE es requerida'
      } else if (!/^\d{18}$/.test(data.clabe)) {
        newErrors.clabe = 'La CLABE debe tener exactamente 18 dígitos'
      }
      if (!data.titular_cuenta?.trim()) {
        newErrors.titular_cuenta = 'El titular es requerido'
      }
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

  const handleSkip = () => {
    updateData({ 
      banco: '', 
      clabe: '', 
      titular_cuenta: '',
      estado_cuenta: null
    })
    nextStep()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, estado_cuenta: 'Solo PDF, JPG o PNG' })
      return
    }

    // Validar tamaño (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, estado_cuenta: 'Máximo 10MB' })
      return
    }

    updateData({ estado_cuenta: file })

    // Limpiar error
    const newErrors = { ...errors }
    delete newErrors.estado_cuenta
    setErrors(newErrors)
  }

  const removeFile = () => {
    updateData({ estado_cuenta: null })
    if (estadoCuentaRef.current) {
      estadoCuentaRef.current.value = ''
    }
  }

  const formatCLABE = (value) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 18)
  }

  const hasAnyValue = data.banco || data.clabe || data.titular_cuenta || data.estado_cuenta

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Información Bancaria
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Configura tu cuenta para recibir pagos
        </p>
        <p className="text-sm mt-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          💡 Este paso es opcional. Puedes configurarlo más tarde si lo prefieres.
        </p>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
        <AlertCircle size={20} style={{ color: '#AE3F21' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
            Información segura
          </p>
          <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Tu información bancaria se encripta y protege. Solo el administrador puede acceder a ella para procesar pagos. Puedes omitir este paso y agregarlo después.
          </p>
        </div>
      </div>

      {/* Banco */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Banco
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Building2 size={20} style={{ color: '#B39A72' }} />
          </div>
          <select
            value={data.banco || ''}
            onChange={(e) => {
              updateData({ banco: e.target.value })
              if (errors.banco) {
                const newErrors = { ...errors }
                delete newErrors.banco
                setErrors(newErrors)
              }
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.banco ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: data.banco ? '#FFFCF3' : '#666',
              fontFamily: 'Montserrat, sans-serif'
            }}>
            <option value="">Selecciona tu banco</option>
            {BANCOS_MEXICO.map(banco => (
              <option key={banco} value={banco}>{banco}</option>
            ))}
          </select>
        </div>
        {errors.banco && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.banco}
          </p>
        )}
      </div>

      {/* CLABE */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          CLABE Interbancaria
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <CreditCard size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type="text"
            value={data.clabe || ''}
            onChange={(e) => {
              const formatted = formatCLABE(e.target.value)
              updateData({ clabe: formatted })
              if (errors.clabe) {
                const newErrors = { ...errors }
                delete newErrors.clabe
                setErrors(newErrors)
              }
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.clabe ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="012345678901234567"
            maxLength="18"
          />
        </div>
        {errors.clabe ? (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.clabe}
          </p>
        ) : (
          <p className="text-xs mt-1" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
            18 dígitos - La encuentras en tu estado de cuenta
          </p>
        )}
      </div>

      {/* Titular */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Titular de la Cuenta
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User size={20} style={{ color: '#B39A72' }} />
          </div>
          <input
            type="text"
            value={data.titular_cuenta || ''}
            onChange={(e) => {
              updateData({ titular_cuenta: e.target.value })
              if (errors.titular_cuenta) {
                const newErrors = { ...errors }
                delete newErrors.titular_cuenta
                setErrors(newErrors)
              }
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(42, 42, 42, 0.8)',
              border: errors.titular_cuenta ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)',
              color: '#FFFCF3',
              fontFamily: 'Montserrat, sans-serif'
            }}
            placeholder="Nombre completo como aparece en la cuenta"
          />
        </div>
        {errors.titular_cuenta && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.titular_cuenta}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          Debe coincidir con el nombre registrado en el banco
        </p>
      </div>

      {/* Estado de Cuenta */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Estado de Cuenta <span className="text-xs font-normal" style={{ color: '#666' }}>(Opcional)</span>
        </label>
        
        <p className="text-xs mb-2" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
          Para verificar tu CLABE interbancaria
        </p>

        <input
          ref={estadoCuentaRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
          id="file-estado-cuenta"
        />

        {data.estado_cuenta ? (
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <div className="flex items-center gap-3 flex-1">
              <FileText size={24} style={{ color: '#10b981' }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                  {data.estado_cuenta.name}
                </p>
                <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
                  {(data.estado_cuenta.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-2 rounded-lg transition-all hover:bg-red-500/20"
              style={{ color: '#ef4444' }}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <label
            htmlFor="file-estado-cuenta"
            className="flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{
              background: 'rgba(156, 122, 94, 0.1)',
              border: errors.estado_cuenta ? '2px dashed #ef4444' : '2px dashed rgba(156, 122, 94, 0.5)'
            }}>
            <Upload size={32} style={{ color: errors.estado_cuenta ? '#ef4444' : '#B39A72' }} className="mb-2" />
            <p className="font-medium text-sm mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Click para subir estado de cuenta
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
              PDF, JPG o PNG (Máx. 10MB)
            </p>
          </label>
        )}

        {errors.estado_cuenta && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.estado_cuenta}
          </p>
        )}
      </div>

      {/* Confirmación */}
      {hasAnyValue && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} style={{ color: '#10b981' }} />
            <p className="text-sm font-medium" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              Información bancaria configurada
            </p>
          </div>
          <div className="space-y-1">
            {data.banco && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ Banco: {data.banco}
              </p>
            )}
            {data.clabe && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ CLABE: {data.clabe}
              </p>
            )}
            {data.titular_cuenta && (
              <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                ✓ Titular: {data.titular_cuenta}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: 'rgba(156, 122, 94, 0.3)', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Omitir
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            {loading ? 'Guardando...' : 'Continuar →'}
          </button>
        </div>
      </div>
    </form>
  )
}