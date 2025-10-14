'use client'

import { Shield, LogOut, Building2, Bike, Users, Calendar, Package, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { logoutUser } from '@/lib/supabase/auth'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

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
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  const modulos = [
    {
      titulo: 'Gestión de Salas',
      descripcion: 'Administra las salas del estudio',
      icono: Building2,
      href: '/admin/salas',
      disponible: true
    },
    {
      titulo: 'Gestión de Bikes',
      descripcion: 'Administra bikes y spots',
      icono: Bike,
      href: '/admin/bikes',
      disponible: false
    },
    {
      titulo: 'Tipos de Clase',
      descripcion: 'Gestiona los tipos de clases',
      icono: Calendar,
      href: '/admin/tipos-clase',
      disponible: false
    },
    {
      titulo: 'Usuarios',
      descripcion: 'Gestiona clientes y coaches',
      icono: Users,
      href: '/admin/usuarios',
      disponible: false
    },
    {
      titulo: 'Paquetes',
      descripcion: 'Administra paquetes y precios',
      icono: Package,
      href: '/admin/paquetes',
      disponible: false
    },
    {
      titulo: 'Configuración',
      descripcion: 'Ajustes generales del estudio',
      icono: Settings,
      href: '/admin/configuracion',
      disponible: false
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <Card>
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
              <Shield size={28} className="sm:w-8 sm:h-8" style={{ color: '#AE3F21' }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Panel de Administración
              </h2>
              <p className="text-xs sm:text-sm opacity-70 mt-1" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Bienvenido al dashboard de administrador
              </p>
            </div>
          </div>
        </Card>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {modulos.map((modulo, index) => {
            const Icono = modulo.icono
            
            if (modulo.disponible) {
              return (
                <Link key={index} href={modulo.href}>
                  <Card className="h-full">
                    <div className="space-y-3 sm:space-y-4 transition-all hover:opacity-80 cursor-pointer">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <Icono size={20} className="sm:w-6 sm:h-6" style={{ color: '#AE3F21' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {modulo.titulo}
                        </h3>
                        <p className="text-xs sm:text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {modulo.descripcion}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            } else {
              return (
                <Card key={index} className="h-full">
                  <div className="space-y-3 sm:space-y-4 opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
                      <Icono size={20} className="sm:w-6 sm:h-6" style={{ color: '#9C7A5E' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {modulo.titulo}
                      </h3>
                      <p className="text-xs sm:text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                        {modulo.descripcion}
                      </p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full" 
                        style={{ 
                          background: 'rgba(156, 122, 94, 0.2)', 
                          color: '#9C7A5E',
                          fontFamily: 'Montserrat, sans-serif'
                        }}>
                        Próximamente
                      </span>
                    </div>
                  </div>
                </Card>
              )
            }
          })}
        </div>

        {/* Botón de Cerrar Sesión */}
        <Card>
          <div className="flex justify-center">
            <Button variant="secondary" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut size={18} />
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
