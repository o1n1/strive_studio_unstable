'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, Calendar, MapPin, Award, 
  Instagram, Facebook, Share2, Building, CreditCard,
  FileText, Save, ArrowLeft, Edit2
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase/client'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function CoachPerfilPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('coach')
  
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
    rfc: '',
    bio: '',
    años_experiencia: 0,
    especialidades: [],
    instagram: '',
    facebook: '',
    tiktok: '',
    banco: '',
    titular_cuenta: ''
  })

  useEffect(() => {
    if (isAuthorized) {
      cargarDatosCoach()
    }
  }, [isAuthorized])

  const cargarDatosCoach = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: coachData, error: coachError } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', user.id)
        .single()

      if (coachError) throw coachError

      setCoach(coachData)
      setFormData({
        nombre: coachData.nombre || '',
        apellidos: coachData.apellidos || '',
        telefono: coachData.telefono || '',
        fecha_nacimiento: coachData.fecha_nacimiento || '',
        direccion: coachData.direccion || '',
        rfc: coachData.rfc || '',
        bio: coachData.bio || '',
        años_experiencia: coachData.años_experiencia || 0,
        especialidades: coachData.especialidades || [],
        instagram: coachData.instagram || '',
        facebook: coachData.facebook || '',
        tiktok: coachData.tiktok || '',
        banco: coachData.banco || '',
        titular_cuenta: coachData.titular_cuenta || ''
      })

      setLoading(false)
    } catch (error) {
      console.error('❌ Error cargando perfil:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      // Actualizar profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Actualizar coaches
      const { error: coachError } = await supabase
        .from('coaches')
        .update({
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento,
          direccion: formData.direccion,
          rfc: formData.rfc,
          bio: formData.bio,
          años_experiencia: parseInt(formData.años_experiencia),
          especialidades: formData.especialidades,
          instagram: formData.instagram,
          facebook: formData.facebook,
          tiktok: formData.tiktok,
          banco: formData.banco,
          titular_cuenta: formData.titular_cuenta,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (coachError) throw coachError

      alert('✅ Perfil actualizado exitosamente')
      setEditMode(false)
      cargarDatosCoach()

    } catch (error) {
      console.error('❌ Error guardando perfil:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAgregarEspecialidad = () => {
    const nuevaEsp = prompt('Especialidad a agregar:')
    if (nuevaEsp && nuevaEsp.trim()) {
      setFormData({
        ...formData,
        especialidades: [...formData.especialidades, nuevaEsp.trim()]
      })
    }
  }

  const handleEliminarEspecialidad = (index) => {
    setFormData({
      ...formData,
      especialidades: formData.especialidades.filter((_, i) => i !== index)
    })
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error al cargar perfil</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={cargarDatosCoach}
              className="px-6 py-2 rounded-lg"
              style={{ background: '#AE3F21', color: '#FFFCF3' }}
            >
              Reintentar
            </button>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  if (!coach) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-12">
            <p style={{ color: '#B39A72' }}>Perfil no encontrado</p>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Mi Perfil
            </h1>
            <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Estado: <span style={{ 
                color: coach.estado === 'activo' ? '#10b981' : '#fbbf24',
                fontWeight: 'bold'
              }}>
                {coach.estado === 'activo' ? '🟢 Activo' : '🟡 Pendiente de Aprobación'}
              </span>
            </p>
          </div>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2"
              style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
            >
              <Edit2 size={18} />
              Editar Perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditMode(false)
                  cargarDatosCoach()
                }}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(156, 122, 94, 0.2)', color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-50"
                style={{ background: '#10b981', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              >
                {saving ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Alerta si está pendiente */}
        {coach.estado === 'pendiente' && (
          <Card>
            <div 
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}
            >
              <FileText size={20} style={{ color: '#fbbf24' }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' }}>
                  Tu perfil está en revisión
                </p>
                <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Nuestro equipo está revisando tu solicitud. Te notificaremos por email cuando sea aprobada.
                  Mientras tanto, puedes actualizar tu información si es necesario.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Grid de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Personal
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Nombre *
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.nombre}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Apellidos *
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.apellidos}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Email
                </label>
                <p style={{ color: '#FFFCF3' }}>{coach.email}</p>
                <p className="text-xs mt-1" style={{ color: '#9C7A5E' }}>
                  El email no se puede modificar
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Teléfono *
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.telefono}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Fecha de Nacimiento
                </label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>
                    {formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toLocaleDateString('es-MX') : 'No especificada'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Dirección
                </label>
                {editMode ? (
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    rows={2}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.direccion || 'No especificada'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  RFC
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.rfc || 'No especificado'}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Información Profesional */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Profesional
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Bio / Descripción
                </label>
                {editMode ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.bio || 'No especificada'}</p>
                )}
                <p className="text-xs mt-1" style={{ color: '#9C7A5E' }}>
                  {formData.bio?.length || 0}/500 caracteres
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Años de Experiencia
                </label>
                {editMode ? (
                  <input
                    type="number"
                    min="0"
                    value={formData.años_experiencia}
                    onChange={(e) => setFormData({ ...formData, años_experiencia: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.años_experiencia} años</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Especialidades
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.especialidades.map((esp, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                    >
                      {esp}
                      {editMode && (
                        <button
                          onClick={() => handleEliminarEspecialidad(idx)}
                          className="hover:opacity-70"
                          style={{ color: '#ef4444' }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editMode && (
                  <button
                    onClick={handleAgregarEspecialidad}
                    className="text-sm px-3 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'rgba(174, 63, 33, 0.2)', color: '#AE3F21' }}
                  >
                    + Agregar Especialidad
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Instagram
                </label>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#B39A72' }}>@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                      placeholder="usuario"
                      className="flex-1 p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 252, 243, 0.05)',
                        border: '1px solid rgba(156, 122, 94, 0.2)',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ color: '#FFFCF3' }}>
                    {formData.instagram ? `@${formData.instagram}` : 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Facebook
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="Usuario o URL"
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.facebook || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  TikTok
                </label>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#B39A72' }}>@</span>
                    <input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value.replace('@', '') })}
                      placeholder="usuario"
                      className="flex-1 p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 252, 243, 0.05)',
                        border: '1px solid rgba(156, 122, 94, 0.2)',
                        color: '#FFFCF3',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ color: '#FFFCF3' }}>
                    {formData.tiktok ? `@${formData.tiktok}` : 'No especificado'}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Información Bancaria */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Información Bancaria
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Banco
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.banco || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  CLABE
                </label>
                <p style={{ color: '#FFFCF3' }}>
                  {coach.clabe_encriptada ? `****${coach.clabe_encriptada.slice(-4)}` : 'No especificada'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9C7A5E' }}>
                  Por seguridad, la CLABE no se puede modificar aquí. Contacta al administrador si necesitas cambiarla.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#B39A72' }}>
                  Titular de la Cuenta
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.titular_cuenta}
                    onChange={(e) => setFormData({ ...formData, titular_cuenta: e.target.value })}
                    className="w-full p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 252, 243, 0.05)',
                      border: '1px solid rgba(156, 122, 94, 0.2)',
                      color: '#FFFCF3',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFCF3' }}>{formData.titular_cuenta || 'No especificado'}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
