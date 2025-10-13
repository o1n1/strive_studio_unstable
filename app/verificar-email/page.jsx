'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { resendVerificationEmail } from '@/lib/supabase/auth'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function VerificarEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleResend = async () => {
    const result = await resendVerificationEmail(email)
    if (result.success) {
      alert('Email reenviado correctamente')
    } else {
      alert('Error: ' + result.error)
    }
  }

  return (
    <AuthLayout>
      <Card>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
            style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
            <Mail size={32} style={{ color: '#AE3F21' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Verifica tu correo
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Te hemos enviado un email de confirmación a:
            </p>
            <p className="text-sm font-semibold" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
              {email}
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-xs opacity-60" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Revisa tu bandeja de entrada. Si no lo encuentras, revisa spam.
            </p>

            <button onClick={handleResend} className="text-sm font-semibold hover:underline"
              style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
              Reenviar email
            </button>
          </div>

          <Link href="/">
            <Button style={{ background: 'rgba(156, 122, 94, 0.3)' }}>
              <ArrowLeft size={18} />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VerificarEmailContent />
    </Suspense>
  )
}