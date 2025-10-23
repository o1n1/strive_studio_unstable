'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Eye, Download, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function DocumentosCoachVerificacion({ coachId, onDocumentosActualizados }) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)

  const tiposDocumento = {
    'ine_frente': 'INE - Frente',
    'ine_reverso': 'INE - Reverso',
    'comprobante_domicilio': 'Comprobante de Domicilio',
    'titulo_cedula': 'Título/Cédula Profesional',
    'antecedentes_penales': 'Antecedentes No Penales',
    'estado_cuenta': 'Estado de Cuenta',
    'otro': 'Otro Documento'
  }

  useEffect(() => {
    if (coachId) {
      cargarDocumentos()
    }
  }, [coachId])

  const cargarDocumentos = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await supabase
        .from('coach_documents')
        .select(`
          *,
          verificado_por_perfil:verificado_por(nombre, apellidos)
        `)
        .eq('coach_id', coachId)
        .order('fecha_subida', { ascending: false })

      if (error) throw error

      setDocumentos(data || [])
    } catch (error) {
      console.error('Error cargando documentos:', error)
      alert('Error al cargar documentos')
    } finally {
      setLoading(false)
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

      // Actualizar el documento
      const { error } = await supabase
        .from('coach_documents')
        .update({
          verificado: verificado,
          verificado_por: verificado ? session.user.id : null,
          fecha_verificacion: verificado ? new Date().toISOString() : null
        })
        .eq('id', documentoId)

      if (error) throw error

      // Recargar documentos
      await cargarDocumentos()
      
      // Notificar al padre que hubo cambios
      if (onDocumentosActualizados) {
        onDocumentosActualizados()
      }

      alert(verificado ? '✅ Documento verificado' : '⚠️ Verificación removida')

    } catch (error) {
      console.error('Error verificando documento:', error)
      alert('Error al verificar documento: ' + error.message)
    } finally {
      setProcesando(null)
    }
  }

  const esImagen = (url) => {
    if (!url) return false
    const extension = url.split('.').pop().toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" size={32} style={{ color: '#AE3F21' }} />
      </div>
    )
  }

  if (documentos.length === 0) {
    return (
      <div className="text-center p-8 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
        <FileText size={48} className="mx-auto mb-4" style={{ color: '#B39A72' }} />
        <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
          No hay documentos subidos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          📄 Documentos del Coach
        </h3>
        <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}>
          {documentos.filter(d => d.verificado).length} de {documentos.length} verificados
        </span>
      </div>

      {documentos.map((doc) => (
        <div 
          key={doc.id}
          className="p-4 rounded-lg border"
          style={{ 
            background: doc.verificado ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            borderColor: doc.verificado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Info del documento */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {doc.verificado ? (
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                ) : (
                  <XCircle size={20} style={{ color: '#ef4444' }} />
                )}
                <h4 className="font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {tiposDocumento[doc.tipo] || doc.tipo}
                </h4>
              </div>
              
              <p className="text-sm mb-1" style={{ color: '#B39A72' }}>
                {doc.nombre_archivo}
              </p>
              
              <p className="text-xs" style={{ color: '#666' }}>
                Subido: {new Date(doc.fecha_subida).toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>

              {doc.verificado && doc.verificado_por_perfil && (
                <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                  ✓ Verificado por {doc.verificado_por_perfil.nombre} {doc.verificado_por_perfil.apellidos}
                  {doc.fecha_verificacion && ` el ${new Date(doc.fecha_verificacion).toLocaleDateString('es-MX')}`}
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setVistaPrevia(doc)}
                className="px-3 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 flex items-center gap-2"
                style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
              >
                <Eye size={16} />
                Ver
              </button>

              <a
                href={doc.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80 flex items-center gap-2 text-center"
                style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
              >
                <Download size={16} />
                Descargar
              </a>

              {!doc.verificado ? (
                <button
                  onClick={() => verificarDocumento(doc.id, true)}
                  disabled={procesando === doc.id}
                  className="px-3 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: '#10b981', color: '#fff' }}
                >
                  {procesando === doc.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Aprobar
                </button>
              ) : (
                <button
                  onClick={() => verificarDocumento(doc.id, false)}
                  disabled={procesando === doc.id}
                  className="px-3 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                >
                  {procesando === doc.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal de Vista Previa */}
      {vistaPrevia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setVistaPrevia(null)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg p-6"
            style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {tiposDocumento[vistaPrevia.tipo] || vistaPrevia.tipo}
              </h3>
              <button
                onClick={() => setVistaPrevia(null)}
                className="p-2 rounded-lg hover:opacity-80"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
              >
                ✕
              </button>
            </div>

            {esImagen(vistaPrevia.archivo_url) ? (
              <div className="relative w-full" style={{ minHeight: '400px' }}>
                <Image
                  src={vistaPrevia.archivo_url}
                  alt={vistaPrevia.nombre_archivo}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <iframe
                src={vistaPrevia.archivo_url}
                className="w-full"
                style={{ height: '70vh' }}
                title={vistaPrevia.nombre_archivo}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
