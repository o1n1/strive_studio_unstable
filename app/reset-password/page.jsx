'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Lock, Check } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const validatePassword = (pass) => pass.length >= 8
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Mínimo 8 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    // Simular actualización de contraseña (después se conectará con Supabase)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1500)
  }

  if (success) {
    return (
      <AuthLayout>
        <Card>
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
              <Check size={32} style={{ color: '#AE3F21' }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Tu contraseña ha sido restablecida exitosamente.
              </p>
            </div>

            <Link href="/">
              <Button>
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <div className="space-y-7">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Nueva Contraseña
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <Input
              label="Nueva Contraseña"
              icon={Lock}
              type="password"
              required
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setErrors({ ...errors, password: '' })
              }}
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
            />

            <Input
              label="Confirmar Contraseña"
              icon={Lock}
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value })
                setErrors({ ...errors, confirmPassword: '' })
              }}
              placeholder="Repite la contraseña"
              error={errors.confirmPassword}
            />

            <Button type="submit" loading={loading}>
              Restablecer Contraseña
            </Button>
          </form>
        </div>
      </Card>
    </AuthLayout>
  )
}