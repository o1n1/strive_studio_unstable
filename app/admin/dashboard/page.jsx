'use client'

import { Shield, Building2, Bike, Users, Calendar, Package, Settings, UserCog, FileText } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

export default function AdminDashboardPage() {
  const { isAuthorized, loading } = useProtectedRoute('admin')

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  const modulos = [
    {
      titulo: 'Layout del Estudio',
      descripcion: 'Gestiona bicis y disponibilidad',
      icono: Building2,
      href: '/admin/layout-estudio',
      disponible: true
    },
    {
      titulo: 'Gestión de Coaches',
      descripcion: 'Administra coaches e invitaciones',
      icono: UserCog,
      href: '/admin/coaches',
      disponible: true
    },
    {
      titulo: 'Plantillas de Contratos',
      descripcion: 'Edita y gestiona plantillas de contratos',
      icono: FileText,
      href: '/admin/plantillas-contratos',
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
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
          >
            Panel de Administración
          </h1>
          <p 
            className="text-base md:text-lg" 
            style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            Selecciona un módulo para comenzar
          </p>
        </div>

        {/* Módulos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modulos.map((modulo) => {
            const Icono = modulo.icono
            return (
              <Link 
                key={modulo.titulo} 
                href={modulo.disponible ? modulo.href : '#'}
                className={modulo.disponible ? '' : 'pointer-events-none'}
              >
                <Card className={`h-full transition-all duration-300 ${
                  modulo.disponible 
                    ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' 
                    : 'opacity-50'
                }`}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ 
                          background: modulo.disponible 
                            ? 'rgba(174, 63, 33, 0.2)' 
                            : 'rgba(156, 122, 94, 0.2)' 
                        }}
                      >
                        <Icono 
                          size={28} 
                          style={{ 
                            color: modulo.disponible ? '#AE3F21' : '#9C7A5E' 
                          }} 
                        />
                      </div>
                      {!modulo.disponible && (
                        <span 
                          className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{ 
                            background: 'rgba(156, 122, 94, 0.2)', 
                            color: '#9C7A5E' 
                          }}
                        >
                          Próximamente
                        </span>
                      )}
                    </div>

                    <h3 
                      className="text-xl font-bold mb-2" 
                      style={{ 
                        color: '#FFFCF3', 
                        fontFamily: 'Montserrat, sans-serif' 
                      }}
                    >
                      {modulo.titulo}
                    </h3>

                    <p 
                      className="text-sm flex-1" 
                      style={{ 
                        color: '#B39A72', 
                        fontFamily: 'Montserrat, sans-serif' 
                      }}
                    >
                      {modulo.descripcion}
                    </p>

                    {modulo.disponible && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(156, 122, 94, 0.2)' }}>
                        <span 
                          className="text-sm font-semibold flex items-center gap-2"
                          style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}
                        >
                          Acceder
                          <svg 
                            className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5l7 7-7 7" 
                            />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Footer Info */}
        <Card>
          <div className="flex items-center gap-3">
            <Shield size={24} style={{ color: '#AE3F21' }} />
            <div>
              <p 
                className="font-semibold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}
              >
                Acceso Administrativo
              </p>
              <p 
                className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
              >
                Tienes permisos completos para gestionar todos los módulos del sistema
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
