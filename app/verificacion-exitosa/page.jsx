'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function VerificacionExitosaPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <AuthLayout>
      <Card>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-scaleIn"
            style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
            <Check size={32} style={{ color: '#AE3F21' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              ¡Email Verificado!
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Tu cuenta ha sido verificada exitosamente.
            </p>
            <p className="text-xs opacity-60" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Redirigiendo al inicio de sesión en 3 segundos...
            </p>
          </div>

          <Link href="/">
            <Button>
              Iniciar Sesión Ahora
            </Button>
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}