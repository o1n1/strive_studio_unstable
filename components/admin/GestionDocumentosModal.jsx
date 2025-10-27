'use client'

import { useState } from 'react'
import { X, CheckCircle, XCircle, Eye, Upload, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function GestionDocumentosModal({ isOpen, onClose, coach, documentos, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null)
  const [mostrarImagen, setMostrarImagen] = useState(false)
  const [accionDocumento, setAccionDocumento] = useState({}) // { [docId]: 'aprobar' | 'rechazar' }
  const [motivosRechazo, setMotivosRechazo] = useState({}) // { [docId]: 'motivo' }

  if (!isOpen) return null

  const getTipoLabel = (tipo) => {
    const labels = {
      'ine_frente': 'INE Frente',
      'ine_reverso': 'INE Reverso',
      'comprobante_domicilio': 'Comprobante de Domicilio',
      'titulo_cedula': 'Título/Cédula',
      'antecedentes_penales': 'Antecedentes No Penales',
      'estado_cuenta': 'Estado de Cuenta',
      'otro': 'Otro'
    }
    return labels[tipo] || tipo
  }

  const handleVerDocumento = (doc) => {
    setDocumentoSeleccionado(doc)
    setMostrarImagen(true)
  }

  const handleAccionDocumento = (docId, accion) => {
    setAccionDocumento(prev => ({
      ...prev,
      [docId]: accion
    }))
  }

  const handleGuardarValidaciones = async () => {
    if (Object.keys(accionDocumento).length === 0) {
      alert('⚠️ Debes validar al menos un documento')
      return
    }

    // Verificar que documentos rechazados tengan motivo
    const rechazadosSinMotivo = Object.entries(accionDocumento)
      .filter(([id, accion]) => accion === 'rechazar' && !motivosRechazo[id])
    
    if (rechazadosSinMotivo.length > 0) {
      alert('⚠️ Debes especificar el motivo de rechazo para cada documento')
      return
    }

    if (!confirm('¿Confirmar validación de documentos?')) return

    setLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión')

      // Actualizar cada documento
      for (const [docId, accion] of Object.entries(accionDocumento)) {
        const update = {
          verificado: accion === 'aprobar',
          verificado_por: session.user.id,
          fecha_verificacion: new Date().toISOString()
        }

        if (accion === 'rechazar') {
          update.notas = motivosRechazo[docId]
        }

        await supabase
          .from('coach_documents')
          .update(update)
          .eq('id', docId)
      }

      // Si hay rechazos, crear notificación para el coach
      const rechazados = Object.entries(accionDocumento)
        .filter(([_, accion]) => accion === 'rechazar')

      if (rechazados.length > 0) {
        const listaRechazados = rechazados.map(([id]) => {
          const doc = documentos.find(d => d.id === id)
          return `• ${getTipoLabel(doc.tipo)}: ${motivosRechazo[id]}`
        }).join('\n')

        // Crear notificación
        await supabase.from('notifications').insert({
          user_id: coach.id,
          tipo: 'sistema',
          titulo: 'Documentos Rechazados',
          mensaje: `Algunos documentos requieren corrección:\n\n${listaRechazados}`,
          leido: false,
          metadata: { tipo_notificacion: 'documentos_rechazados' }
        })

        // Enviar email
        await fetch('/api/coaches/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            tipo: 'correcciones',
            coachId: coach.id,
            correcciones: rechazados.map(([id]) => {
              const doc = documentos.find(d => d.id === id)
              return {
                campo: getTipoLabel(doc.tipo),
                motivo: motivosRechazo[id]
              }
            })
          })
        })
      }

      alert('✅ Documentos validados correctamente')
      if (onSuccess) onSuccess()
      onClose()

    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al validar documentos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const documentosPendientes = documentos.filter(d => !d.verificado)
  const documentosAprobados = documentos.filter(d => d.verificado)

  return (
    <>
      {/* Modal Principal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl"
          style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
            style={{ background: '#0A0A0A', borderColor: 'rgba(156, 122, 94, 0.2)' }}
          >
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Gestión de Documentos
              </h2>
              <p className="text-sm mt-1" style={{ color: '#B39A72' }}>
                {coach.nombre} {coach.apellidos}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ background: 'rgba(156, 122, 94, 0.2)' }}
            >
              <X size={24} style={{ color: '#B39A72' }} />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'rgba(255, 252, 243, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}
              >
                <p className="text-sm mb-1" style={{ color: '#B39A72' }}>Total Documentos</p>
                <p className="text-2xl font-bold" style={{ color: '#FFFCF3' }}>{documentos.length}</p>
              </div>
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                <p className="text-sm mb-1" style={{ color: '#10b981' }}>Aprobados</p>
                <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{documentosAprobados.length}</p>
              </div>
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)' }}
              >
                <p className="text-sm mb-1" style={{ color: '#fbbf24' }}>Pendientes</p>
                <p className="text-2xl font-bold" style={{ color: '#fbbf24' }}>{documentosPendientes.length}</p>
              </div>
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Documentos Subidos
              </h3>

              {documentos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#B39A72' }} />
                  <p style={{ color: '#B39A72' }}>No hay documentos subidos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentos.map(doc => (
                    <div 
                      key={doc.id}
                      className="p-4 rounded-xl border"
                      style={{ 
                        background: 'rgba(255, 252, 243, 0.02)',
                        borderColor: doc.verificado 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : accionDocumento[doc.id] === 'rechazar'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(156, 122, 94, 0.2)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info Documento */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold" style={{ color: '#FFFCF3' }}>
                              {getTipoLabel(doc.tipo)}
                            </h4>
                            {doc.verificado && (
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                              >
                                <CheckCircle size={12} />
                                Verificado
                              </span>
                            )}
                            {accionDocumento[doc.id] === 'rechazar' && (
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                              >
                                <XCircle size={12} />
                                Rechazado
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm mb-2" style={{ color: '#B39A72' }}>
                            Subido el {new Date(doc.fecha_subida).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>

                          {/* Campo motivo rechazo */}
                          {accionDocumento[doc.id] === 'rechazar' && (
                            <div className="mt-3">
                              <label className="text-sm mb-1 block" style={{ color: '#B39A72' }}>
                                Motivo del rechazo
                              </label>
                              <textarea
                                value={motivosRechazo[doc.id] || ''}
                                onChange={(e) => setMotivosRechazo(prev => ({
                                  ...prev,
                                  [doc.id]: e.target.value
                                }))}
                                placeholder="Ej: La imagen está borrosa, no se lee el nombre completo..."
                                rows={2}
                                className="w-full p-2 rounded-lg text-sm"
                                style={{
                                  background: 'rgba(255, 252, 243, 0.05)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#FFFCF3'
                                }}
                              />
                            </div>
                          )}

                          {/* Notas anteriores */}
                          {doc.notas && (
                            <div 
                              className="mt-3 p-2 rounded text-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            >
                              <strong>Motivo rechazo anterior:</strong> {doc.notas}
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleVerDocumento(doc)}
                            className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 text-sm"
                            style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                          >
                            <Eye size={16} />
                            Ver
                          </button>

                          {!doc.verificado && (
                            <>
                              <button
                                onClick={() => handleAccionDocumento(doc.id, 'aprobar')}
                                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 text-sm ${
                                  accionDocumento[doc.id] === 'aprobar' ? 'ring-2' : ''
                                }`}
                                style={{ 
                                  background: accionDocumento[doc.id] === 'aprobar' 
                                    ? '#10b981' 
                                    : 'rgba(16, 185, 129, 0.2)', 
                                  color: accionDocumento[doc.id] === 'aprobar' ? '#fff' : '#10b981',
                                  ringColor: '#10b981'
                                }}
                              >
                                <CheckCircle size={16} />
                                Aprobar
                              </button>

                              <button
                                onClick={() => handleAccionDocumento(doc.id, 'rechazar')}
                                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 text-sm ${
                                  accionDocumento[doc.id] === 'rechazar' ? 'ring-2' : ''
                                }`}
                                style={{ 
                                  background: accionDocumento[doc.id] === 'rechazar' 
                                    ? '#ef4444' 
                                    : 'rgba(239, 68, 68, 0.2)', 
                                  color: accionDocumento[doc.id] === 'rechazar' ? '#fff' : '#ef4444',
                                  ringColor: '#ef4444'
                                }}
                              >
                                <XCircle size={16} />
                                Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div 
            className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t"
            style={{ background: '#0A0A0A', borderColor: 'rgba(156, 122, 94, 0.2)' }}
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarValidaciones}
              disabled={loading || Object.keys(accionDocumento).length === 0}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-50"
              style={{ background: '#AE3F21', color: '#FFFCF3' }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Guardar Validaciones
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Ver Imagen */}
      {mostrarImagen && documentoSeleccionado && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
          onClick={() => setMostrarImagen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setMostrarImagen(false)}
              className="absolute -top-12 right-0 p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ background: 'rgba(156, 122, 94, 0.3)' }}
            >
              <X size={24} style={{ color: '#FFFCF3' }} />
            </button>
            <img 
              src={documentoSeleccionado.archivo_url} 
              alt={getTipoLabel(documentoSeleccionado.tipo)}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <p 
              className="text-center mt-4 text-lg font-semibold"
              style={{ color: '#FFFCF3' }}
            >
              {getTipoLabel(documentoSeleccionado.tipo)}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
