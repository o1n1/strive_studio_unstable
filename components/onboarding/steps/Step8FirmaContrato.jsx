'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, PenTool, CheckCircle, AlertCircle } from 'lucide-react'

export default function Step8FirmaContrato({ data, updateData, prevStep, invitacion, token }) {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingPlantilla, setLoadingPlantilla] = useState(true)
  const [contratoTexto, setContratoTexto] = useState('')
  const [templateId, setTemplateId] = useState(null)
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    cargarPlantillaContrato()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#FFFCF3'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (data.firma_digital) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        setHasSignature(true)
      }
      img.src = data.firma_digital
    }
  }, [])

  const cargarPlantillaContrato = async () => {
    setLoadingPlantilla(true)
    try {
      console.log('🔍 [ONBOARDING] Cargando template activo...')
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: template, error } = await supabase
        .from('contract_templates')
        .select('id, contenido, nombre')
        .eq('tipo_contrato', 'por_clase')
        .eq('vigente', true)
        .eq('es_default', true)
        .single()

      if (error) {
        console.error('❌ [ONBOARDING] Error cargando template:', error)
        console.log('📄 [ONBOARDING] Usando contrato fallback')
        setContratoTexto(getContratoFallback())
        setTemplateId(null)
      } else if (!template) {
        console.warn('⚠️ [ONBOARDING] No se encontró template activo')
        console.log('📄 [ONBOARDING] Usando contrato fallback')
        setContratoTexto(getContratoFallback())
        setTemplateId(null)
      } else {
        console.log('✅ [ONBOARDING] Template cargado:', template.nombre)
        console.log('📝 [ONBOARDING] Template ID:', template.id)
        setTemplateId(template.id)
        const textoPersonalizado = reemplazarVariables(template.contenido)
        setContratoTexto(textoPersonalizado)
        console.log('✅ [ONBOARDING] Variables reemplazadas correctamente')
      }
    } catch (error) {
      console.error('❌ [ONBOARDING] Error general:', error)
      setContratoTexto(getContratoFallback())
      setTemplateId(null)
    } finally {
      setLoadingPlantilla(false)
    }
  }

  const reemplazarVariables = (plantilla) => {
    const nombre = data.nombre || '[Nombre]'
    const apellidos = data.apellidos || '[Apellidos]'
    const fechaInicio = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const tipoContrato = 'Por Clase'

    console.log('🔄 [ONBOARDING] Reemplazando variables:')
    console.log('  - {nombre}:', nombre)
    console.log('  - {apellidos}:', apellidos)
    console.log('  - {fecha_inicio}:', fechaInicio)
    console.log('  - {tipo_contrato}:', tipoContrato)

    return plantilla
      .replace(/\{nombre\}/g, nombre)
      .replace(/\{apellidos\}/g, apellidos)
      .replace(/\{fecha_inicio\}/g, fechaInicio)
      .replace(/\{tipo_contrato\}/g, tipoContrato)
  }

  const getContratoFallback = () => {
    const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim() || '[Nombre del Coach]'
    const fechaInicio = new Date().toLocaleDateString('es-MX')
    const categoria = invitacion?.categoria || 'No especificada'

    return `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Entre STRIVE STUDIO (en adelante "EL ESTUDIO") y ${nombreCompleto} (en adelante "EL INSTRUCTOR/COACH"), se celebra el presente contrato bajo los siguientes términos:

I. OBJETO DEL CONTRATO
EL INSTRUCTOR/COACH prestará servicios profesionales de coaching deportivo en las instalaciones de EL ESTUDIO, impartiendo clases de ${categoria} según el horario acordado.

II. OBLIGACIONES DEL INSTRUCTOR/COACH
1. Impartir clases con profesionalismo, puntualidad y calidad excepcional.
2. Mantener vigentes todas las certificaciones profesionales requeridas.
3. Cumplir con los protocolos de seguridad e higiene del estudio.
4. Respetar la confidencialidad de información sensible de clientes y operaciones.

III. OBLIGACIONES DEL ESTUDIO
1. Proporcionar instalaciones adecuadas y equipamiento necesario.
2. Realizar pagos según lo acordado en tiempo y forma.
3. Cubrir seguros de responsabilidad civil durante las clases.

IV. COMPENSACIÓN
El pago se realizará según el esquema establecido (por clase, hora o mensual) acordado con la administración.

V. TERMINACIÓN
Cualquiera de las partes puede terminar este contrato con 15 días de anticipación mediante aviso por escrito.

VI. CONFIDENCIALIDAD
EL INSTRUCTOR/COACH se compromete a mantener confidencialidad sobre información sensible del negocio, clientes y operaciones del estudio.

VII. ACEPTACIÓN
Al firmar este contrato, EL INSTRUCTOR/COACH acepta haber leído, comprendido y estar de acuerdo con todos los términos establecidos.

Fecha de inicio: ${fechaInicio}
Categoría: ${categoria}
Tipo de compensación: Por Clase`
  }

  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    if (e.type.includes('touch')) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e, canvas)
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(e, canvas)
    
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = (e) => {
    e.preventDefault()
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

    if (hasSignature && !data.firma_digital) {
      guardarFirma()
    }

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)

    try {
      console.log('📤 [ONBOARDING] Enviando formulario...')
      console.log('📝 [ONBOARDING] Template ID:', templateId)
      
      const response = await fetch('/api/coaches/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          formData: {
            ...data,
            template_id: templateId
          },
          invitacionId: invitacion.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al completar registro')
      }

      console.log('✅ [ONBOARDING] Registro completado exitosamente')
      window.location.href = '/onboarding/exito'
      
    } catch (error) {
      console.error('❌ [ONBOARDING] Error:', error)
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

        {loadingPlantilla ? (
          <div 
            className="p-6 rounded-xl h-96 flex items-center justify-center"
            style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.3)' }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#AE3F21' }}></div>
              <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Cargando contrato...
              </p>
            </div>
          </div>
        ) : (
          <div
            className="p-6 rounded-xl h-96 overflow-y-auto"
            style={{ background: 'rgba(42, 42, 42, 0.8)', border: '1px solid rgba(156, 122, 94, 0.3)' }}
          >
            <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              {contratoTexto}
            </pre>
          </div>
        )}
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
        <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'Montserrat, sans-serif' }}>
              {errors.submit}
            </p>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ 
            background: 'rgba(156, 122, 94, 0.2)', 
            color: '#B39A72',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Anterior
        </button>
        
        <button
          type="submit"
          disabled={loading || loadingPlantilla}
          className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: '#AE3F21',
            color: '#FFFCF3',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enviando...
            </span>
          ) : (
            'Enviar Solicitud'
          )}
        </button>
      </div>
    </form>
  )
}