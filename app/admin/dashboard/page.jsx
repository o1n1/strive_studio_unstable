'use client'

import { Shield, LogOut, Building2, Bike, Users, Calendar, Package, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthLayout from '@/components/layouts/AuthLayout'
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
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
              <Shield size={32} style={{ color: '#AE3F21' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Panel de Administración
              </h2>
              <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Bienvenido al dashboard de administrador
              </p>
            </div>
          </div>
        </Card>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((modulo, index) => {
            const Icono = modulo.icono
            
            if (modulo.disponible) {
              return (
                <Link key={index} href={modulo.href}>
                  <Card>
                    <div className="space-y-4 transition-all hover:opacity-80 cursor-pointer">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(174, 63, 33, 0.2)' }}>
                        <Icono size={24} style={{ color: '#AE3F21' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                          {modulo.titulo}
                        </h3>
                        <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                          {modulo.descripcion}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            } else {
              return (
                <Card key={index}>
                  <div className="space-y-4 opacity-50 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(156, 122, 94, 0.2)' }}>
                      <Icono size={24} style={{ color: '#9C7A5E' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                        {modulo.titulo}
                      </h3>
                      <p className="text-sm opacity-70" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
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
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut size={18} />
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  )
}
