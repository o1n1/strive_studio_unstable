'use client'

import { Shield, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { logoutUser } from '@/lib/supabase/auth'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAuthorized, loading } = useProtectedRoute('admin')

  const handleLogout = async () => {
    const result = await logoutUser()
    if (result.success) {
      router.push('/')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <Card>
          <div className="text-center py-8">
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Cargando...
            </p>
          </div>
        </Card>
      </AuthLayout>
    )
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
            <Shield size={32} style={{ color: '#AE3F21' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Panel de Administración
            </h2>
            <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Bienvenido al dashboard de administrador
            </p>
          </div>

          <div className="pt-4 p-6 rounded-xl" 
            style={{ 
              background: 'rgba(174, 63, 33, 0.1)', 
              border: '1px solid rgba(174, 63, 33, 0.3)' 
            }}>
            <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Esta página está en construcción. Aquí podrás gestionar usuarios, clases, configuración y reportes del estudio.
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