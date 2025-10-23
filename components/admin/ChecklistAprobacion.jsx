'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  FileText, Award, CreditCard, FileCheck, Send 
} from 'lucide-react'

export default function ChecklistAprobacion({ coach, onSuccess }) {
  const [checklist, setChecklist] = useState({
    documentos_completos: false,
    documentos_verificados: false,
    certificaciones_validas: false,
    info_bancaria_completa: false,
    contrato_firmado: false,
    perfil_completo: false
  })
  
  const [loading, setLoading] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [showCorreccionesModal, setShowCorreccionesModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [correcciones, setCorrecciones] = useState([])

  useEffect(() => {
    if (coach) {
      verificarChecklist()
    }
  }, [coach])

  const verificarChecklist = async () => {
    try {
      // Verificar documentos completos y verificados
      const docsRequeridos = ['ine_frente', 'ine_reverso', 'comprobante_domicilio']
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: documentos } = await supabase
        .from('coach_documents')
        .select('tipo, verificado')
        .eq('coach_id', coach.id)

      const docsSubidos = documentos?.map(d => d.tipo) || []
      const todosDocsSubidos = docsRequeridos.every(req => docsSubidos.includes(req))
      const todosDocsVerificados = documentos?.every(d => d.verificado) || false

      // Verificar certificaciones
      const { data: certificaciones } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', coach.id)

      const tieneCertificaciones = (certificaciones?.length || 0) > 0
      const certVigentes = certificaciones?.every(cert => {
        if (!cert.fecha_vigencia) return true
        return new Date(cert.fecha_vigencia) > new Date()
      }) || false

      // Verificar info bancaria
      const infoBancariaCompleta = !!(
        coach.banco && 
        coach.clabe_encriptada && 
        coach.titular_cuenta
      )

      // Verificar contrato firmado
      const { data: contratos } = await supabase
        .from('coach_contracts')
        .select('firmado, vigente')
        .eq('coach_id', coach.id)
        .eq('vigente', true)

      const contratoFirmado = contratos?.some(c => c.firmado) || false

      // Verificar perfil completo
      const perfilCompleto = !!(
        coach.nombre &&
        coach.apellidos &&
        coach.email &&
        coach.telefono &&
        coach.bio &&
        coach.años_experiencia &&
        coach.especialidades?.length > 0
      )

      setChecklist({
        documentos_completos: todosDocsSubidos,
        documentos_verificados: todosDocsVerificados,
        certificaciones_validas: tieneCertificaciones && certVigentes,
        info_bancaria_completa: infoBancariaCompleta,
        contrato_firmado: contratoFirmado,
        perfil_completo: perfilCompleto
      })

    } catch (error) {
      console.error('Error verificando checklist:', error)
    }
  }

  const handleAprobar = async () => {
    // Verificar que todo esté completo
    const todosVerificados = Object.values(checklist).every(v => v === true)
    
    if (!todosVerificados) {
      alert('⚠️ No se puede aprobar. Todos los items deben estar verificados.')
      return
    }

    if (!confirm('¿Confirmas que quieres APROBAR a este coach?\n\nSe le enviará un email de bienvenida.')) {
      return
    }

    setLoading(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // 1. Aprobar coach en la base de datos
      const approveResponse = await fetch('/api/coaches/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ coachId: coach.id })
      })

      if (!approveResponse.ok) {
        const error = await approveResponse.json()
        throw new Error(error.error || 'Error al aprobar coach')
      }

      console.log('✅ Coach aprobado en BD')

      // 2. Enviar email de aprobación
      const notifyResponse = await fetch('/api/coaches/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: 'aprobacion',
          coachId: coach.id
        })
      })

      if (!notifyResponse.ok) {
        console.warn('⚠️ Coach aprobado pero email falló')
      } else {
        console.log('✅ Email de aprobación enviado')
      }

      alert('✅ Coach aprobado exitosamente. Se le ha enviado un email de bienvenida.')
      
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('❌ Error aprobando coach:', error)
      alert('Error al aprobar coach: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      alert('⚠️ Debes proporcionar un motivo del rechazo')
      return
    }

    if (!confirm('¿Confirmas que quieres RECHAZAR a este coach?\n\nSe le enviará un email con el motivo.')) {
      return
    }

    setLoading(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // 1. Rechazar coach en la base de datos
      const rejectResponse = await fetch('/api/coaches/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          coachId: coach.id,
          motivo: motivoRechazo 
        })
      })

      if (!rejectResponse.ok) {
        const error = await rejectResponse.json()
        throw new Error(error.error || 'Error al rechazar coach')
      }

      console.log('✅ Coach rechazado en BD')

      // 2. Enviar email de rechazo
      const notifyResponse = await fetch('/api/coaches/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: 'rechazo',
          coachId: coach.id,
          motivo: motivoRechazo
        })
      })

      if (!notifyResponse.ok) {
        console.warn('⚠️ Coach rechazado pero email falló')
      } else {
        console.log('✅ Email de rechazo enviado')
      }

      alert('✅ Coach rechazado. Se le ha enviado un email con el motivo.')
      setShowRechazarModal(false)
      
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('❌ Error rechazando coach:', error)
      alert('Error al rechazar coach: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitarCorrecciones = async () => {
    if (correcciones.length === 0) {
      alert('⚠️ Debes agregar al menos una corrección')
      return
    }

    if (!confirm('¿Enviar solicitud de correcciones al coach?')) {
      return
    }

    setLoading(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // Enviar email de correcciones
      const notifyResponse = await fetch('/api/coaches/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo: 'correcciones',
          coachId: coach.id,
          correcciones: correcciones
        })
      })

      if (!notifyResponse.ok) {
        const error = await notifyResponse.json()
        throw new Error(error.error || 'Error al enviar correcciones')
      }

      console.log('✅ Email de correcciones enviado')
      alert('✅ Solicitud de correcciones enviada exitosamente.')
      setShowCorreccionesModal(false)
      setCorrecciones([])

    } catch (error) {
      console.error('❌ Error enviando correcciones:', error)
      alert('Error al enviar correcciones: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const agregarCorreccion = () => {
    setCorrecciones([...correcciones, { campo: '', mensaje: '' }])
  }

  const actualizarCorreccion = (index, field, value) => {
    const nuevas = [...correcciones]
    nuevas[index][field] = value
    setCorrecciones(nuevas)
  }

  const eliminarCorreccion = (index) => {
    setCorrecciones(correcciones.filter((_, i) => i !== index))
  }

  const getIcono = (verificado) => {
    return verificado ? (
      <CheckCircle size={20} style={{ color: '#10b981' }} />
    ) : (
      <XCircle size={20} style={{ color: '#ef4444' }} />
    )
  }

  const todosVerificados = Object.values(checklist).every(v => v === true)

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <div 
        className="rounded-lg p-6" 
        style={{ 
          background: 'rgba(156, 122, 94, 0.1)',
          border: '1px solid rgba(156, 122, 94, 0.2)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="text-lg font-bold flex items-center gap-2" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            <FileCheck size={20} style={{ color: '#AE3F21' }} />
            Checklist de Aprobación
          </h3>
          {todosVerificados ? (
            <span 
              className="text-sm px-3 py-1 rounded-full" 
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
            >
              ✓ Listo para aprobar
            </span>
          ) : (
            <span 
              className="text-sm px-3 py-1 rounded-full" 
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            >
              ⚠ Verificación pendiente
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.perfil_completo)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Perfil Completo
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  Nombre, bio, experiencia, especialidades
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.documentos_completos)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Documentos Completos
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  INE (frente y reverso), comprobante de domicilio
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.documentos_verificados)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Documentos Verificados
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  Todos los documentos revisados y aprobados
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.certificaciones_validas)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Certificaciones Válidas
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  Al menos una certificación vigente
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.info_bancaria_completa)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Bancaria
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  Banco, CLABE y titular completos
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
            <div className="flex items-center gap-3">
              {getIcono(checklist.contrato_firmado)}
              <div>
                <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Contrato Firmado
                </p>
                <p className="text-xs" style={{ color: '#B39A72' }}>
                  Contrato vigente con firma digital
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3">
        <button
          onClick={handleAprobar}
          disabled={loading || !todosVerificados}
          className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ 
            background: '#10b981',
            color: '#FFFCF3',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          {loading ? (
            <>
              <Clock size={18} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Aprobar Coach
            </>
          )}
        </button>

        <button
          onClick={() => setShowCorreccionesModal(true)}
          disabled={loading}
          className="px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
          style={{ 
            background: 'rgba(174, 63, 33, 0.2)',
            color: '#AE3F21',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <Send size={18} />
          Solicitar Correcciones
        </button>

        <button
          onClick={() => setShowRechazarModal(true)}
          disabled={loading}
          className="px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
          style={{ 
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <XCircle size={18} />
          Rechazar
        </button>
      </div>

      {/* Modal de Rechazo */}
      {showRechazarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRechazarModal(false)}>
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Rechazar Coach
              </h3>
            </div>

            <p className="text-sm mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Proporciona un motivo claro para el rechazo. Se enviará por email al coach.
            </p>

            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ejemplo: Las certificaciones están vencidas y no cumplen con los requisitos mínimos..."
              rows={4}
              className="w-full p-3 rounded-lg mb-4"
              style={{
                background: 'rgba(255, 252, 243, 0.05)',
                border: '1px solid rgba(156, 122, 94, 0.2)',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRechazarModal(false)}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(156, 122, 94, 0.2)',
                  color: '#B39A72',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading || !motivoRechazo.trim()}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: '#ef4444',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                {loading ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Correcciones */}
      {showCorreccionesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowCorreccionesModal(false)}>
          <div 
            className="rounded-lg p-6 max-w-2xl w-full mx-4 my-8"
            style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Send size={24} style={{ color: '#AE3F21' }} />
              <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Solicitar Correcciones
              </h3>
            </div>

            <p className="text-sm mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Especifica qué debe corregir el coach. Se le enviará un email con los detalles.
            </p>

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {correcciones.map((corr, index) => (
                <div key={index} className="p-3 rounded-lg" style={{ background: 'rgba(174, 63, 33, 0.1)' }}>
                  <input
                    type="text"
                    value={corr.campo}
                    onChange={(e) => actualizarCorreccion(index, 'campo', e.target.value)}
                    placeholder="Campo (ej: Certificación, INE, etc.)"
                    className="w-full p-2 rounded mb-2"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  <textarea
                    value={corr.mensaje}
                    onChange={(e) => actualizarCorreccion(index, 'mensaje', e.target.value)}
                    placeholder="Descripción de la corrección necesaria..."
                    rows={2}
                    className="w-full p-2 rounded mb-2"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => eliminarCorreccion(index)}
                    className="text-sm px-3 py-1 rounded transition-all hover:opacity-80"
                    style={{ color: '#ef4444' }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={agregarCorreccion}
              className="w-full py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80 mb-4"
              style={{
                background: 'rgba(174, 63, 33, 0.2)',
                color: '#AE3F21',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              + Agregar Corrección
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCorreccionesModal(false)}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(156, 122, 94, 0.2)',
                  color: '#B39A72',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarCorrecciones}
                disabled={loading || correcciones.length === 0}
                className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: '#AE3F21',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar Correcciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
