'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  FileText, Award, CreditCard, FileCheck, Send, Eye, Download
} from 'lucide-react'
import Image from 'next/image'

export default function ChecklistAprobacion({ coach, onSuccess }) {
  const [checklist, setChecklist] = useState({
    documentos_completos: false,
    documentos_verificados: false,
    certificaciones_validas: false, // Ahora es opcional
    info_bancaria_completa: false,
    contrato_firmado: false,
    perfil_completo: false
  })
  
  const [documentos, setDocumentos] = useState([])
  const [certificaciones, setCertificaciones] = useState([])
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [procesando, setProcesando] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [showCorreccionesModal, setShowCorreccionesModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [correcciones, setCorrecciones] = useState([])

  useEffect(() => {
    if (coach) {
      verificarChecklist()
      cargarDocumentos()
      cargarCertificaciones()
    }
  }, [coach])

  const cargarDocumentos = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', coach.id)
        .order('fecha_subida', { ascending: false })

      if (error) throw error
      setDocumentos(data || [])
    } catch (error) {
      console.error('Error cargando documentos:', error)
    }
  }

  const cargarCertificaciones = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', coach.id)

      if (error) throw error
      setCertificaciones(data || [])
    } catch (error) {
      console.error('Error cargando certificaciones:', error)
    }
  }

  const verificarDocumento = async (documentoId, verificado) => {
    setProcesando(documentoId)
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      const { error } = await supabase
        .from('coach_documents')
        .update({
          verificado: verificado,
          verificado_por: verificado ? session.user.id : null,
          fecha_verificacion: verificado ? new Date().toISOString() : null
        })
        .eq('id', documentoId)

      if (error) throw error

      await cargarDocumentos()
      await verificarChecklist()

      alert(verificado ? '✅ Documento verificado' : '⚠️ Documento marcado como no verificado')

    } catch (error) {
      console.error('Error verificando documento:', error)
      alert('Error al verificar documento')
    } finally {
      setProcesando(null)
    }
  }

  const verificarChecklist = async () => {
    try {
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
      const todosDocsVerificados = docsRequeridos.every(req => {
        const doc = documentos?.find(d => d.tipo === req)
        return doc?.verificado === true
      })

      // Certificaciones: ahora son opcionales, pero si existen deben ser válidas
      const { data: certificaciones } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', coach.id)

      const tieneCertificaciones = (certificaciones?.length || 0) > 0
      const certVigentes = !tieneCertificaciones || certificaciones?.every(cert => {
        if (!cert.fecha_vigencia) return true
        return new Date(cert.fecha_vigencia) > new Date()
      })

      const infoBancariaCompleta = !!(
        coach.banco && 
        coach.clabe_encriptada && 
        coach.titular_cuenta
      )

      const { data: contratos } = await supabase
        .from('coach_contracts')
        .select('firmado, vigente')
        .eq('coach_id', coach.id)
        .eq('vigente', true)

      const contratoFirmado = contratos?.some(c => c.firmado) || false

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
        certificaciones_validas: certVigentes, // Siempre true si no hay certs
        info_bancaria_completa: infoBancariaCompleta,
        contrato_firmado: contratoFirmado,
        perfil_completo: perfilCompleto
      })

    } catch (error) {
      console.error('Error verificando checklist:', error)
    }
  }

  const handleAprobar = async () => {
    // Solo verificar items obligatorios (certificaciones son opcionales)
    const itemsObligatorios = {
      documentos_completos: checklist.documentos_completos,
      documentos_verificados: checklist.documentos_verificados,
      info_bancaria_completa: checklist.info_bancaria_completa,
      contrato_firmado: checklist.contrato_firmado,
      perfil_completo: checklist.perfil_completo
    }
    
    const todosVerificados = Object.values(itemsObligatorios).every(v => v === true)
    
    if (!todosVerificados) {
      alert('⚠️ No se puede aprobar. Los items obligatorios deben estar verificados.\n\nNota: Las certificaciones son opcionales.')
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
        console.log('✅ Email de bienvenida enviado')
      }

      alert('✅ Coach aprobado. Se le ha enviado un email de bienvenida.')
      
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
      alert('⚠️ Debes especificar el motivo del rechazo')
      return
    }

    if (!confirm('¿Confirmas que quieres RECHAZAR a este coach?\n\nEsta acción no se puede deshacer.')) {
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
      
      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('❌ Error enviando correcciones:', error)
      alert('Error al enviar correcciones: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getIcono = (estado) => {
    if (estado === true) {
      return <CheckCircle size={20} style={{ color: '#22c55e' }} />
    }
    if (estado === false) {
      return <XCircle size={20} style={{ color: '#ef4444' }} />
    }
    return <Clock size={20} style={{ color: '#eab308' }} />
  }

  const tiposDocumento = {
    'ine_frente': 'INE - Frente',
    'ine_reverso': 'INE - Reverso',
    'comprobante_domicilio': 'Comprobante de Domicilio'
  }

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <div className="p-6 rounded-xl space-y-4" style={{ background: 'rgba(174, 63, 33, 0.05)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <FileCheck size={24} style={{ color: '#AE3F21' }} />
          <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Checklist de Aprobación
          </h3>
        </div>

        {/* Perfil Completo */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
          <div className="flex items-center gap-3">
            {getIcono(checklist.perfil_completo)}
            <div>
              <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Perfil Completo
              </p>
              <p className="text-xs" style={{ color: '#B39A72' }}>
                Información personal y profesional completa
              </p>
            </div>
          </div>
        </div>

        {/* Documentos Completos */}
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

        {/* Documentos Verificados - CON BOTÓN */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
          <div className="flex items-center justify-between mb-3">
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
            <button
              onClick={() => setMostrarDocumentos(!mostrarDocumentos)}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
              style={{
                background: '#AE3F21',
                color: '#FFFCF3',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <Eye size={16} />
              {mostrarDocumentos ? 'Ocultar' : 'Verificar'}
            </button>
          </div>

          {/* Panel de Verificación de Documentos */}
          {mostrarDocumentos && (
            <div className="mt-4 space-y-3 pl-8">
              {documentos.length === 0 ? (
                <p className="text-sm" style={{ color: '#B39A72' }}>
                  No hay documentos subidos
                </p>
              ) : (
                documentos.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255, 252, 243, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: '#B39A72' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {tiposDocumento[doc.tipo] || doc.nombre_archivo}
                        </p>
                        <p className="text-xs" style={{ color: '#B39A72' }}>
                          Subido: {new Date(doc.fecha_subida).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      {doc.verificado && (
                        <CheckCircle size={16} style={{ color: '#22c55e' }} />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVistaPrevia(doc.archivo_url)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(156, 122, 94, 0.2)' }}
                        title="Ver documento"
                      >
                        <Eye size={16} style={{ color: '#B39A72' }} />
                      </button>
                      
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(156, 122, 94, 0.2)' }}
                        title="Descargar documento"
                      >
                        <Download size={16} style={{ color: '#B39A72' }} />
                      </a>
                      
                      <button
                        onClick={() => verificarDocumento(doc.id, !doc.verificado)}
                        disabled={procesando === doc.id}
                        className="px-3 py-1 rounded-lg text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{
                          background: doc.verificado ? '#ef4444' : '#22c55e',
                          color: '#FFFCF3',
                          fontFamily: 'Montserrat, sans-serif'
                        }}
                      >
                        {procesando === doc.id ? '...' : (doc.verificado ? 'Rechazar' : 'Aprobar')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Certificaciones - AHORA OPCIONAL */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
          <div className="flex items-center gap-3">
            {getIcono(checklist.certificaciones_validas)}
            <div>
              <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Certificaciones Válidas
                <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}>
                  Opcional
                </span>
              </p>
              <p className="text-xs" style={{ color: '#B39A72' }}>
                {certificaciones.length > 0 
                  ? `${certificaciones.length} certificación(es) - todas válidas`
                  : 'Sin certificaciones (puedes aprobar sin ellas)'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Bancaria */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
          <div className="flex items-center gap-3">
            {getIcono(checklist.info_bancaria_completa)}
            <div>
              <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Información Bancaria Completa
              </p>
              <p className="text-xs" style={{ color: '#B39A72' }}>
                Banco, CLABE y titular configurados
              </p>
            </div>
          </div>
        </div>

        {/* Contrato */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
          <div className="flex items-center gap-3">
            {getIcono(checklist.contrato_firmado)}
            <div>
              <p className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Contrato Firmado
              </p>
              <p className="text-xs" style={{ color: '#B39A72' }}>
                Contrato digital firmado y vigente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCorreccionesModal(true)}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'rgba(234, 179, 8, 0.2)',
            border: '1px solid #eab308',
            color: '#eab308',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <Send size={18} />
          Solicitar Correcciones
        </button>

        <button
          onClick={() => setShowRechazarModal(true)}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <XCircle size={18} />
          Rechazar
        </button>

        <button
          onClick={handleAprobar}
          disabled={loading}
          className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: '#22c55e',
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
      </div>

      {/* Modal Rechazar */}
      {showRechazarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRechazarModal(false)}>
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={24} style={{ color: '#ef4444' }} />
              <h3 className="text-xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Rechazar Solicitud
              </h3>
            </div>

            <p className="text-sm mb-4" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Especifica el motivo del rechazo. Se enviará por email al coach.
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

      {/* Modal Correcciones */}
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

            {/* Lista de correcciones */}
            <div className="space-y-3 mb-4">
              {correcciones.map((corr, index) => (
                <div key={index} className="p-3 rounded-lg flex items-start justify-between" style={{ background: 'rgba(255, 252, 243, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {corr.campo}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {corr.mensaje}
                    </p>
                  </div>
                  <button
                    onClick={() => setCorrecciones(correcciones.filter((_, i) => i !== index))}
                    className="ml-2 p-1 rounded hover:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Formulario para agregar corrección */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                id="campo"
                placeholder="Campo a corregir (ej: Foto de perfil)"
                className="w-full p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 252, 243, 0.05)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              <textarea
                id="mensaje"
                placeholder="Descripción de la corrección necesaria"
                rows={2}
                className="w-full p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 252, 243, 0.05)',
                  border: '1px solid rgba(156, 122, 94, 0.2)',
                  color: '#FFFCF3',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              />
              <button
                onClick={() => {
                  const campo = document.getElementById('campo').value
                  const mensaje = document.getElementById('mensaje').value
                  if (campo.trim() && mensaje.trim()) {
                    setCorrecciones([...correcciones, { campo, mensaje }])
                    document.getElementById('campo').value = ''
                    document.getElementById('mensaje').value = ''
                  }
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(174, 63, 33, 0.2)',
                  border: '1px solid #AE3F21',
                  color: '#AE3F21',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                + Agregar Corrección
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCorreccionesModal(false)
                  setCorrecciones([])
                }}
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

      {/* Modal Vista Previa Documento */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setVistaPrevia(null)}>
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto bg-white rounded-lg">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-bold">Vista Previa del Documento</h3>
              <button
                onClick={() => setVistaPrevia(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-4">
              {vistaPrevia.endsWith('.pdf') ? (
                <iframe
                  src={vistaPrevia}
                  className="w-full h-[70vh]"
                  title="Vista previa PDF"
                />
              ) : (
                <Image
                  src={vistaPrevia}
                  alt="Documento"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
