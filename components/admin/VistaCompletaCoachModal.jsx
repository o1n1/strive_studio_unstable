'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Eye, Edit2, AlertTriangle, FileText, Loader2, User, Mail, Phone, Calendar, Building, CreditCard } from 'lucide-react'
import Image from 'next/image'

export default function VistaCompletaCoachModal({ isOpen, onClose, coachId, onSuccess }) {
  const [coach, setCoach] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [certificaciones, setCertificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState('perfil') // perfil | documentos | certificaciones | bancaria
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [vistaDocumento, setVistaDocumento] = useState(null)

  useEffect(() => {
    if (isOpen && coachId) {
      cargarDatosCompletos()
    }
  }, [isOpen, coachId])

  const cargarDatosCompletos = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Cargar datos del coach completos
      const { data: coachData } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', coachId)
        .single()

      setCoach(coachData)

      // Cargar documentos
      const { data: docs } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', coachId)
        .order('fecha_subida', { ascending: false })

      setDocumentos(docs || [])

      // Cargar certificaciones
      const { data: certs } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', coachId)
        .order('fecha_obtencion', { ascending: false })

      setCertificaciones(certs || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActualizarCampo = async (campo, valor) => {
    setGuardando(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      // Determinar tabla a actualizar
      let tabla = campo === 'nombre' || campo === 'apellidos' || campo === 'email' || campo === 'telefono_profile' 
        ? 'profiles' 
        : 'coaches'

      const { error } = await supabase
        .from(tabla)
        .update({ [campo]: valor, updated_at: new Date().toISOString() })
        .eq('id', coachId)

      if (error) throw error

      alert(`✅ ${campo} actualizado correctamente`)
      setEditando(null)
      cargarDatosCompletos()

    } catch (error) {
      console.error('Error actualizando:', error)
      alert('❌ Error al actualizar: ' + error.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleVerificarDocumento = async (documentoId, verificado) => {
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
          verificado,
          verificado_por: verificado ? session.user.id : null,
          fecha_verificacion: verificado ? new Date().toISOString() : null
        })
        .eq('id', documentoId)

      if (error) throw error

      alert(verificado ? '✅ Documento verificado' : '⚠️ Verificación removida')
      cargarDatosCompletos()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al verificar documento')
    }
  }

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

  if (!isOpen) return null

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      >
        <Loader2 size={48} className="animate-spin" style={{ color: '#AE3F21' }} />
      </div>
    )
  }

  return (
    <>
      {/* Modal Principal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.9)' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl flex flex-col"
          style={{ background: '#0A0A0A', border: '1px solid rgba(156, 122, 94, 0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
          >
            <div className="flex items-center gap-4">
              {coach?.avatar_url ? (
                <img 
                  src={coach.avatar_url} 
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                >
                  {coach?.nombre?.[0] || 'C'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {coach?.nombre} {coach?.apellidos}
                </h2>
                <p className="text-sm" style={{ color: '#B39A72' }}>
                  Vista Completa de Onboarding
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ background: 'rgba(156, 122, 94, 0.2)' }}
            >
              <X size={24} style={{ color: '#FFFCF3' }} />
            </button>
          </div>

          {/* Pestañas */}
          <div 
            className="flex gap-2 p-4 border-b overflow-x-auto"
            style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
          >
            {[
              { key: 'perfil', label: 'Perfil', icon: User },
              { key: 'documentos', label: 'Documentos', icon: FileText },
              { key: 'certificaciones', label: 'Certificaciones', icon: Award },
              { key: 'bancaria', label: 'Info Bancaria', icon: CreditCard }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSeccionActiva(key)}
                className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                style={{
                  background: seccionActiva === key ? '#AE3F21' : 'rgba(156, 122, 94, 0.1)',
                  color: seccionActiva === key ? '#FFFCF3' : '#B39A72',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Sección Perfil */}
            {seccionActiva === 'perfil' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Personal y Profesional
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold" style={{ color: '#B39A72' }}>Nombre</label>
                      {editando !== 'nombre' && (
                        <button 
                          onClick={() => setEditando('nombre')}
                          className="p-1 rounded hover:opacity-80"
                        >
                          <Edit2 size={16} style={{ color: '#AE3F21' }} />
                        </button>
                      )}
                    </div>
                    {editando === 'nombre' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={coach?.nombre}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleActualizarCampo('nombre', e.target.value)
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg"
                          style={{ background: '#1a1a1a', color: '#FFFCF3', border: '1px solid rgba(156, 122, 94, 0.3)' }}
                        />
                        <button
                          onClick={() => setEditando(null)}
                          className="px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <p className="font-bold" style={{ color: '#FFFCF3' }}>{coach?.nombre || 'No especificado'}</p>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold" style={{ color: '#B39A72' }}>Apellidos</label>
                      {editando !== 'apellidos' && (
                        <button 
                          onClick={() => setEditando('apellidos')}
                          className="p-1 rounded hover:opacity-80"
                        >
                          <Edit2 size={16} style={{ color: '#AE3F21' }} />
                        </button>
                      )}
                    </div>
                    {editando === 'apellidos' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={coach?.apellidos}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleActualizarCampo('apellidos', e.target.value)
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg"
                          style={{ background: '#1a1a1a', color: '#FFFCF3', border: '1px solid rgba(156, 122, 94, 0.3)' }}
                        />
                        <button
                          onClick={() => setEditando(null)}
                          className="px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <p className="font-bold" style={{ color: '#FFFCF3' }}>{coach?.apellidos || 'No especificado'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Email</label>
                    <div className="flex items-center gap-2">
                      <Mail size={16} style={{ color: '#AE3F21' }} />
                      <p style={{ color: '#FFFCF3' }}>{coach?.email || 'No especificado'}</p>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Teléfono</label>
                    <div className="flex items-center gap-2">
                      <Phone size={16} style={{ color: '#AE3F21' }} />
                      <p style={{ color: '#FFFCF3' }}>{coach?.telefono_profile || 'No especificado'}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="col-span-2 p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Biografía</label>
                    <p style={{ color: '#FFFCF3' }}>{coach?.bio || 'No especificado'}</p>
                  </div>

                  {/* Años Experiencia */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Años de Experiencia</label>
                    <p className="text-2xl font-bold" style={{ color: '#AE3F21' }}>{coach?.años_experiencia || '0'}</p>
                  </div>

                  {/* Especialidades */}
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Especialidades</label>
                    <div className="flex flex-wrap gap-2">
                      {coach?.especialidades?.map((esp, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                        >
                          {esp}
                        </span>
                      )) || <p style={{ color: '#666' }}>Sin especialidades</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección Documentos */}
            {seccionActiva === 'documentos' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Documentos Legales
                </h3>

                {documentos.length === 0 ? (
                  <div className="text-center p-8 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                    <FileText size={48} className="mx-auto mb-4" style={{ color: '#B39A72' }} />
                    <p style={{ color: '#B39A72' }}>No hay documentos subidos</p>
                  </div>
                ) : (
                  documentos.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-4 rounded-lg border flex items-center justify-between"
                      style={{ 
                        background: doc.verificado ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderColor: doc.verificado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {doc.verificado ? (
                          <CheckCircle size={24} style={{ color: '#10b981' }} />
                        ) : (
                          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                        )}
                        <div>
                          <p className="font-bold" style={{ color: '#FFFCF3' }}>
                            {getTipoLabel(doc.tipo)}
                          </p>
                          <p className="text-xs" style={{ color: '#B39A72' }}>
                            Subido: {new Date(doc.fecha_subida).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVistaDocumento(doc)}
                          className="px-3 py-2 rounded-lg flex items-center gap-2"
                          style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72' }}
                        >
                          <Eye size={16} />
                          Ver
                        </button>
                        {!doc.verificado ? (
                          <button
                            onClick={() => handleVerificarDocumento(doc.id, true)}
                            className="px-3 py-2 rounded-lg flex items-center gap-2"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                          >
                            <CheckCircle size={16} />
                            Aprobar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerificarDocumento(doc.id, false)}
                            className="px-3 py-2 rounded-lg flex items-center gap-2"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                          >
                            <XCircle size={16} />
                            Desaprobar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sección Certificaciones */}
            {seccionActiva === 'certificaciones' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Certificaciones
                </h3>

                {certificaciones.length === 0 ? (
                  <div className="text-center p-8 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.1)' }}>
                    <Award size={48} className="mx-auto mb-4" style={{ color: '#B39A72' }} />
                    <p style={{ color: '#B39A72' }}>No hay certificaciones registradas</p>
                  </div>
                ) : (
                  certificaciones.map((cert) => (
                    <div 
                      key={cert.id}
                      className="p-4 rounded-lg border"
                      style={{ background: 'rgba(156, 122, 94, 0.05)', borderColor: 'rgba(156, 122, 94, 0.2)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-lg mb-1" style={{ color: '#FFFCF3' }}>
                            {cert.nombre}
                          </p>
                          <p className="text-sm mb-2" style={{ color: '#B39A72' }}>
                            {cert.institucion}
                          </p>
                          <div className="flex gap-4 text-xs" style={{ color: '#666' }}>
                            <span>Obtenido: {new Date(cert.fecha_obtencion).toLocaleDateString('es-MX')}</span>
                            {cert.fecha_vigencia && (
                              <span>Vence: {new Date(cert.fecha_vigencia).toLocaleDateString('es-MX')}</span>
                            )}
                          </div>
                        </div>
                        {cert.verificado ? (
                          <CheckCircle size={24} style={{ color: '#10b981' }} />
                        ) : (
                          <AlertTriangle size={24} style={{ color: '#fbbf24' }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sección Bancaria */}
            {seccionActiva === 'bancaria' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Bancaria
                </h3>

                <div className="grid gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Banco</label>
                    <div className="flex items-center gap-2">
                      <Building size={16} style={{ color: '#AE3F21' }} />
                      <p className="font-bold" style={{ color: '#FFFCF3' }}>{coach?.banco || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>CLABE Interbancaria</label>
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} style={{ color: '#AE3F21' }} />
                      <p className="font-mono font-bold" style={{ color: '#FFFCF3' }}>
                        {coach?.clabe_encriptada ? '••••••••••••' + coach.clabe_encriptada.slice(-4) : 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'rgba(156, 122, 94, 0.05)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                    <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>Titular de la Cuenta</label>
                    <p className="font-bold" style={{ color: '#FFFCF3' }}>{coach?.titular_cuenta || 'No especificado'}</p>
                  </div>

                  <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
                    <AlertTriangle size={20} style={{ color: '#AE3F21' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#AE3F21' }}>Datos Sensibles</p>
                      <p className="text-xs" style={{ color: '#B39A72' }}>
                        La CLABE está encriptada por seguridad. Solo se muestra parcialmente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="p-4 border-t flex justify-end"
            style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-semibold"
              style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Ver Documento */}
      {vistaDocumento && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
          onClick={() => setVistaDocumento(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setVistaDocumento(null)}
              className="absolute -top-12 right-0 p-2 rounded-lg hover:opacity-80"
              style={{ background: 'rgba(156, 122, 94, 0.3)' }}
            >
              <X size={24} style={{ color: '#FFFCF3' }} />
            </button>
            <img 
              src={vistaDocumento.archivo_url} 
              alt={getTipoLabel(vistaDocumento.tipo)}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <p className="text-center mt-4 text-lg font-semibold" style={{ color: '#FFFCF3' }}>
              {getTipoLabel(vistaDocumento.tipo)}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
