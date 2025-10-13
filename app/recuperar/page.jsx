'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('El email es requerido')
      return
    }
    
    if (!validateEmail(email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    setError('')

    // Simular envío de email (después se conectará con Supabase)
    setTimeout(() => {
      setLoading(false)
      setEmailSent(true)
    }, 1500)
  }

  if (emailSent) {
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
                Revisa tu correo
              </h2>
              <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Te hemos enviado instrucciones para restablecer tu contraseña a:
              </p>
              <p className="text-sm font-semibold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
                {email}
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-xs opacity-60" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
              </p>
              
              <Link href="/">
                <Button variant="secondary" type="button">
                  <ArrowLeft size={20} />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Recuperar Contraseña
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="tu@email.com"
              error={error}
            />

            <Button type="submit" loading={loading}>
              Enviar instrucciones
            </Button>

            <Link href="/">
              <Button variant="secondary" type="button">
                <ArrowLeft size={20} />
                Volver al inicio
              </Button>
            </Link>
          </form>
        </div>
      </Card>
    </AuthLayout>
  )
}