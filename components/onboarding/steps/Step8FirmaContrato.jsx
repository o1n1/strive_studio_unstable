'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, PenTool, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

const CONTRATO_TEXTO = `
CONTRATO DE PRESTACIÓN DE SERVICIOS COMO INSTRUCTOR/COACH

Entre STRIVE STUDIO y el INSTRUCTOR/COACH, se celebra el presente contrato bajo los siguientes términos:

I. OBJETO DEL CONTRATO
El INSTRUCTOR/COACH prestará servicios de instrucción de clases de fitness (cycling, funcional u otros) según la especialidad y categoría asignada.

II. OBLIGACIONES DEL INSTRUCTOR/COACH
1. Impartir las clases asignadas con puntualidad y profesionalismo
2. Mantener certificaciones vigentes requeridas por el estudio
3. Seguir los estándares de calidad y protocolos del estudio
4. Tratar a los clientes con respeto y profesionalismo
5. Usar el equipo e instalaciones de manera adecuada
6. Informar con anticipación sobre cualquier ausencia o cambio de horario
7. Mantener confidencialidad sobre información del estudio y clientes

III. OBLIGACIONES DE STRIVE STUDIO
1. Proporcionar instalaciones y equipo adecuado
2. Realizar pagos según el esquema acordado
3. Brindar soporte administrativo
4. Mantener un ambiente de trabajo seguro

IV. COMPENSACIÓN
El pago se realizará según el esquema establecido (por clase, hora o mensual) acordado con la administración.

V. TERMINACIÓN
Cualquiera de las partes puede terminar este contrato con 15 días de anticipación mediante aviso por escrito.

VI. CONFIDENCIALIDAD
El INSTRUCTOR/COACH se compromete a mantener confidencialidad sobre información sensible del negocio, clientes y operaciones del estudio.

VII. ACEPTACIÓN
Al firmar este contrato, el INSTRUCTOR/COACH acepta haber leído, comprendido y estar de acuerdo con todos los términos establecidos.
`

export default function Step8FirmaContrato({ data, updateData, prevStep, invitacion, token }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#FFFCF3'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Si ya hay firma guardada, dibujarla
    if (data.firma_digital) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        setHasSignature(true)
      }
      img.src = data.firma_digital
    }
  }, [])

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const x = e.type.includes('mouse') ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.type.includes('mouse') ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const x = e.type.includes('mouse') ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.type.includes('mouse') ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    updateData({ firma_digital: '', aceptar_terminos: false })
    
    const newErrors = { ...errors }
    delete newErrors.firma_digital
    delete newErrors.aceptar_terminos
    setErrors(newErrors)
  }

  const guardarFirma = () => {
    if (!hasSignature) return
    
    const canvas = canvasRef.current
    const firmaDataURL = canvas.toDataURL('image/png')
    updateData({ firma_digital: firmaDataURL })
    setIsSigning(false)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!data.aceptar_terminos) {
      newErrors.aceptar_terminos = 'Debes aceptar los términos y condiciones'
    }

    if (!hasSignature || !data.firma_digital) {
      newErrors.firma_digital = 'Debes firmar el contrato'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Guardar firma antes de validar
    if (hasSignature && !data.firma_digital) {
      guardarFirma()
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)

    try {
      // Aquí se guardará todo en la BD
      const response = await fetch('/api/coaches/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          formData: data,
          invitacionId: invitacion.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al completar registro')
      }

      // Redirigir a página de éxito
      window.location.href = '/onboarding/exito'
      
    } catch (error) {
      console.error('Error:', error)
      setErrors({ submit: error.message || 'Error al guardar. Intenta de nuevo.' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          Firma de Contrato
        </h2>
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          Lee y firma el contrato para completar tu registro
        </p>
      </div>

      {/* Contrato */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={24} style={{ color: '#AE3F21' }} />
          <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Contrato de Prestación de Servicios
          </h3>
        </div>

        <div
          className="p-6 rounded-xl h-96 overflow-y-auto"
          style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.3)' }}>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            {CONTRATO_TEXTO}
          </pre>
        </div>
      </div>

      {/* Checkbox Aceptar */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all hover:bg-white/5"
          style={{ border: errors.aceptar_terminos ? '1px solid #ef4444' : '1px solid rgba(156, 122, 94, 0.3)' }}>
          <input
            type="checkbox"
            checked={data.aceptar_terminos || false}
            onChange={(e) => {
              updateData({ aceptar_terminos: e.target.checked })
              if (errors.aceptar_terminos) {
                const newErrors = { ...errors }
                delete newErrors.aceptar_terminos
                setErrors(newErrors)
              }
            }}
            className="mt-1 w-5 h-5 rounded cursor-pointer"
            style={{ accentColor: '#AE3F21' }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              He leído y acepto los términos del contrato
            </p>
            <p className="text-xs mt-1" style={{ color: '#666', fontFamily: 'Montserrat, sans-serif' }}>
              Al marcar esta casilla y firmar, aceptas cumplir con todas las obligaciones establecidas en el contrato.
            </p>
          </div>
        </label>
        {errors.aceptar_terminos && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.aceptar_terminos}
          </p>
        )}
      </div>

      {/* Firma Digital */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PenTool size={24} style={{ color: '#AE3F21' }} />
            <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Firma Digital
            </h3>
          </div>
          {hasSignature && (
            <button
              type="button"
              onClick={limpiarFirma}
              className="text-sm px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              Limpiar
            </button>
          )}
        </div>

        <div
          className="rounded-xl p-4"
          style={{ 
            background: 'rgba(42, 42, 42, 0.8)', 
            border: errors.firma_digital ? '2px solid #ef4444' : '2px solid rgba(156, 122, 94, 0.3)' 
          }}>
          <p className="text-xs mb-3 text-center" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Firma con tu dedo o mouse en el recuadro
          </p>
          
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full border-2 border-dashed rounded-lg cursor-crosshair touch-none"
            style={{ 
              borderColor: 'rgba(156, 122, 94, 0.5)',
              background: 'rgba(255, 252, 243, 0.05)'
            }}
          />

          {hasSignature && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <CheckCircle size={16} style={{ color: '#10b981' }} />
              <p className="text-xs" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
                Firma capturada correctamente
              </p>
            </div>
          )}
        </div>

        {errors.firma_digital && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
            <AlertCircle size={14} /> {errors.firma_digital}
          </p>
        )}
      </div>

      {/* Resumen */}
      {data.aceptar_terminos && hasSignature && (
        <div className="p-6 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={20} style={{ color: '#10b981' }} />
            <p className="font-bold" style={{ color: '#10b981', fontFamily: 'Montserrat, sans-serif' }}>
              ¡Listo para finalizar!
            </p>
          </div>
          <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Has completado todos los pasos requeridos. Al enviar, tu solicitud será revisada por el equipo administrativo.
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
          disabled={loading}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#B39A72', color: '#1a1a1a', fontFamily: 'Montserrat, sans-serif' }}>
          ← Anterior
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Enviando Solicitud...
            </>
          ) : (
            'Enviar Solicitud ✓'
          )}
        </button>
      </div>
    </form>
  )
}