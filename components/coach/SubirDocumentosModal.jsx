'use client'

import { useState } from 'react'
import { X, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SubirDocumentosModal({ isOpen, onClose, coachId, documentosExistentes, onSuccess }) {
  const [archivos, setArchivos] = useState({})
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState({})

  if (!isOpen) return null

  const tiposDocumentos = [
    { key: 'ine_frente', label: 'INE Frente', requerido: true },
    { key: 'ine_reverso', label: 'INE Reverso', requerido: true },
    { key: 'comprobante_domicilio', label: 'Comprobante de Domicilio', requerido: true },
    { key: 'titulo_cedula', label: 'Título/Cédula', requerido: false },
    { key: 'antecedentes_penales', label: 'Antecedentes No Penales', requerido: false },
    { key: 'estado_cuenta', label: 'Estado de Cuenta', requerido: false }
  ]

  const comprimirImagen = (file, maxWidth = 1024, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }))
            },
            'image/jpeg',
            quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (tipo, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Comprimir imagen
    const comprimido = await comprimirImagen(file)

    // Convertir a base64
    const reader = new FileReader()
    reader.onload = (e) => {
      setArchivos(prev => ({
        ...prev,
        [tipo]: e.target.result
      }))
      setPreviews(prev => ({
        ...prev,
        [tipo]: e.target.result
      }))
    }
    reader.readAsDataURL(comprimido)
  }

  const handleSubir = async () => {
    if (Object.keys(archivos).length === 0) {
      alert('⚠️ Selecciona al menos un documento')
      return
    }

    if (!confirm('¿Subir documentos seleccionados?')) return

    setUploading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión')

      // Subir cada archivo a storage
      const uploadedFiles = {}
      for (const [tipo, base64] of Object.entries(archivos)) {
        const base64Data = base64.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const ext = 'jpg'
        const fileName = `${coachId}/${tipo}-${Date.now()}.${ext}`

        const { error } = await supabase.storage
          .from('coach-documents')
          .upload(fileName, buffer, {
            contentType: `image/${ext}`,
            upsert: false
          })

        if (error) throw error

        const { data: publicData } = supabase.storage
          .from('coach-documents')
          .getPublicUrl(fileName)

        uploadedFiles[tipo] = publicData.publicUrl
      }

      // Insertar/actualizar registros en BD
      for (const [tipo, url] of Object.entries(uploadedFiles)) {
        // Verificar si existe documento de este tipo
        const { data: existente } = await supabase
          .from('coach_documents')
          .select('id')
          .eq('coach_id', coachId)
          .eq('tipo', tipo)
          .single()

        if (existente) {
          // Actualizar
          await supabase
            .from('coach_documents')
            .update({
              archivo_url: url,
              fecha_subida: new Date().toISOString(),
              verificado: false,
              notas: null,
              verificado_por: null,
              fecha_verificacion: null
            })
            .eq('id', existente.id)
        } else {
          // Insertar nuevo
          await supabase
            .from('coach_documents')
            .insert({
              coach_id: coachId,
              tipo,
              nombre_archivo: tipo.replace('_', ' '),
              archivo_url: url,
              verificado: false
            })
        }
      }

      // Notificar al admin
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('rol', 'admin')

      for (const admin of admins || []) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          tipo: 'sistema',
          titulo: 'Documentos Actualizados',
          mensaje: `Coach subió ${Object.keys(archivos).length} documento(s) nuevo(s)`,
          leido: false,
          metadata: { coach_id: coachId, tipo_notificacion: 'documentos_actualizados' }
        })
      }

      alert('✅ Documentos subidos correctamente')
      if (onSuccess) onSuccess()
      onClose()

    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al subir documentos: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const documentoExistente = (tipo) => {
    return documentosExistentes?.find(d => d.tipo === tipo)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
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
              Subir Documentos
            </h2>
            <p className="text-sm mt-1" style={{ color: '#B39A72' }}>
              Selecciona los documentos que deseas subir o actualizar
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
        <div className="p-6 space-y-4">
          {tiposDocumentos.map(({ key, label, requerido }) => {
            const doc = documentoExistente(key)
            const esRechazado = doc && doc.notas && !doc.verificado

            return (
              <div 
                key={key}
                className="p-4 rounded-xl border"
                style={{ 
                  background: 'rgba(255, 252, 243, 0.02)',
                  borderColor: esRechazado 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : 'rgba(156, 122, 94, 0.2)'
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold" style={{ color: '#FFFCF3' }}>
                        {label}
                      </h4>
                      {requerido && (
                        <span className="text-xs" style={{ color: '#ef4444' }}>*</span>
                      )}
                      {doc?.verificado && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                        >
                          <CheckCircle size={12} />
                          Aprobado
                        </span>
                      )}
                      {esRechazado && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                        >
                          <AlertTriangle size={12} />
                          Rechazado
                        </span>
                      )}
                    </div>
                    
                    {esRechazado && (
                      <p className="text-sm mb-2" style={{ color: '#ef4444' }}>
                        Motivo: {doc.notas}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(key, e)}
                      className="hidden"
                    />
                    <div 
                      className="px-4 py-3 rounded-lg border cursor-pointer transition-all hover:opacity-80 flex items-center justify-center gap-2"
                      style={{ 
                        background: 'rgba(174, 63, 33, 0.1)',
                        borderColor: 'rgba(174, 63, 33, 0.3)',
                        borderStyle: 'dashed'
                      }}
                    >
                      <Upload size={18} style={{ color: '#AE3F21' }} />
                      <span className="text-sm font-medium" style={{ color: '#AE3F21' }}>
                        {archivos[key] ? 'Cambiar archivo' : 'Seleccionar archivo'}
                      </span>
                    </div>
                  </label>

                  {previews[key] && (
                    <img 
                      src={previews[key]} 
                      alt={label}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div 
          className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t"
          style={{ background: '#0A0A0A', borderColor: 'rgba(156, 122, 94, 0.2)' }}
        >
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubir}
            disabled={uploading || Object.keys(archivos).length === 0}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-50"
            style={{ background: '#AE3F21', color: '#FFFCF3' }}
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={20} />
                Subir Documentos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
