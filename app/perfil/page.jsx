'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Camera, Save, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || '',
        apellidos: profile.apellidos || '',
        telefono: profile.telefono || '',
        email: profile.email || ''
      })
      setAvatarPreview(profile.avatar_url)
    }
  }, [profile])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'La imagen no debe superar 5MB' })
        return
      }

      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setErrors({ ...errors, avatar: '' })
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !profile) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicURL.publicUrl
    } catch (error) {
      console.error('Error al subir avatar:', error)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setErrors({})

    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      setErrors({ general: 'Error al actualizar el perfil' })
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <DashboardLayout>
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: '#AE3F21' }} />
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  if (!profile) {
    router.push('/')
    return null
  }

  const getRolLabel = (rol) => {
    const labels = {
      admin: 'Administrador',
      coach: 'Coach',
      cliente: 'Cliente',
      staff: 'Staff'
    }
    return labels[rol] || 'Usuario'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Mi Perfil
          </h1>
          <p className="text-xs sm:text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
            Administra tu información personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Avatar */}
          <Card>
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div 
                  className="w-32 h-32 mx-auto rounded-full overflow-hidden flex items-center justify-center"
                  style={{ 
                    background: avatarPreview ? 'transparent' : 'rgba(174, 63, 33, 0.2)',
                    border: '2px solid rgba(174, 63, 33, 0.3)'
                  }}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} style={{ color: '#AE3F21' }} />
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                  style={{ background: '#AE3F21', color: '#FFFCF3' }}
                >
                  <Camera size={20} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {errors.avatar && (
                <p className="text-xs" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                  {errors.avatar}
                </p>
              )}

              <div>
                <h3 className="font-bold text-lg" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {profile.nombre} {profile.apellidos}
                </h3>
                <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  {getRolLabel(profile.rol)}
                </p>
              </div>

              <div className="pt-4 p-4 rounded-xl" 
                style={{ 
                  background: 'rgba(174, 63, 33, 0.1)', 
                  border: '1px solid rgba(174, 63, 33, 0.3)' 
                }}>
                <p className="text-xs opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Miembro desde
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  {new Date(profile.created_at).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Formulario de Edición */}
          <Card className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Información Personal
                </h2>

                {success && (
                  <div className="mb-6 p-4 rounded-xl animate-fadeIn" 
                    style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#22c55e', fontFamily: 'Montserrat, sans-serif' }}>
                      ✓ Perfil actualizado exitosamente
                    </p>
                  </div>
                )}

                {errors.general && (
                  <div className="mb-6 p-4 rounded-xl" 
                    style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.3)' }}>
                    <p className="text-sm" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                      {errors.general}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Nombre"
                    icon={User}
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre"
                    disabled={loading}
                  />

                  <Input
                    label="Apellidos"
                    icon={User}
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Tus apellidos"
                    disabled={loading}
                  />
                </div>

                <Input
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={formData.email}
                  disabled
                  placeholder="tu@email.com"
                />

                <Input
                  label="Teléfono"
                  icon={Phone}
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="555-555-5555"
                  disabled={loading}
                />

                <div className="pt-4">
                  <Button type="submit" loading={loading} className="w-full sm:w-auto">
                    <Save size={18} />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
