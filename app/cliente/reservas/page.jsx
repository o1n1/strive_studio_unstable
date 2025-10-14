'use client'

import { Calendar, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { logoutUser } from '@/lib/supabase/auth'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function ClienteReservasPage() {
  const router = useRouter()
  const { isAuthorized, loading } = useProtectedRoute('cliente')

  const handleLogout = async () => {
    const result = await logoutUser()
    if (result.success) {
      router.push('/')
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AuthLayout>
      <Card>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
            style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
            <Calendar size={32} style={{ color: '#AE3F21' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Mis Reservas
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Reserva tus clases y gestiona tu actividad
            </p>
          </div>

          <div className="pt-4 p-6 rounded-xl" 
            style={{ 
              background: 'rgba(174, 63, 33, 0.1)', 
              border: '1px solid rgba(174, 63, 33, 0.3)' 
            }}>
            <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Esta página está en construcción. Aquí podrás explorar clases, hacer reservas, comprar paquetes y ver tu historial.
            </p>
          </div>

          <div className="pt-4">
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut size={18} />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </Card>
    </AuthLayout>
  )
}