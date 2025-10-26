'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, Users, TrendingUp, Edit, 
  Award, Clock, Star, Activity
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { useUser } from '@/hooks/useUser'
import { useCoachById, useCoachStats, useCoachClasses } from '@/hooks/useCoaches'
import { useTimezone } from '@/hooks/useTimezone'
import { formatTimeInTimezone, formatDateInTimezone } from '@/lib/utils/timezoneUtils'

export default function CoachDashboardPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('coach')
  const { user } = useUser()
  const { timezone } = useTimezone()
  
  const { coach, loading: coachLoading } = useCoachById(user?.id)
  const { stats, loading: statsLoading } = useCoachStats(user?.id)
  
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  
  const { classes: clasesDelMes, loading: clasesLoading } = useCoachClasses(user?.id, {
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth
  })

  const loading = authLoading || coachLoading || statsLoading

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" 
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              ¡Hola, {coach?.nombre}!
            </h1>
            <p className="text-lg mt-1" 
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Dashboard de Coach
            </p>
          </div>
          <Link href="/coach/editar-perfil">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: '#AE3F21', color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              <Edit size={18} />
              Editar Perfil
            </button>
          </Link>
        </div>

        {coach?.estado === 'pendiente' && (
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                <Clock size={24} style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Solicitud en Revisión
                </h3>
                <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Tu solicitud está siendo revisada por el equipo. Te notificaremos cuando sea aprobada.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-2">
                <Calendar size={32} style={{ color: '#AE3F21' }} />
              </div>
              <p className="text-3xl font-bold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {clasesDelMes?.length || 0}
              </p>
              <p className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Clases Este Mes
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-2">
                <Activity size={32} style={{ color: '#AE3F21' }} />
              </div>
              <p className="text-3xl font-bold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {stats?.proximas_clases || 0}
              </p>
              <p className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Próximas Clases
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-2">
                <Star size={32} style={{ color: '#AE3F21' }} />
              </div>
              <p className="text-3xl font-bold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {coach?.rating_promedio?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Rating Promedio
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-2">
                <Users size={32} style={{ color: '#AE3F21' }} />
              </div>
              <p className="text-3xl font-bold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {stats?.total_clientes || 0}
              </p>
              <p className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Clientes Únicos
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold mb-4" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/coach/clases">
              <div className="p-4 rounded-lg transition-all hover:opacity-80 cursor-pointer"
                style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
                <Calendar size={24} style={{ color: '#AE3F21' }} className="mb-2" />
                <p className="font-semibold" 
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Ver Mis Clases
                </p>
                <p className="text-xs mt-1" 
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Calendario y horarios
                </p>
              </div>
            </Link>

            <Link href="/coach/editar-perfil">
              <div className="p-4 rounded-lg transition-all hover:opacity-80 cursor-pointer"
                style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
                <Edit size={24} style={{ color: '#AE3F21' }} className="mb-2" />
                <p className="font-semibold" 
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Editar Perfil
                </p>
                <p className="text-xs mt-1" 
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Actualiza tu información
                </p>
              </div>
            </Link>

            <Link href="/coach/estadisticas">
              <div className="p-4 rounded-lg transition-all hover:opacity-80 cursor-pointer"
                style={{ background: 'rgba(174, 63, 33, 0.1)', border: '1px solid rgba(174, 63, 33, 0.2)' }}>
                <TrendingUp size={24} style={{ color: '#AE3F21' }} className="mb-2" />
                <p className="font-semibold" 
                  style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                  Mis Estadísticas
                </p>
                <p className="text-xs mt-1" 
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  Rendimiento y métricas
                </p>
              </div>
            </Link>
          </div>
        </Card>

        {clasesDelMes && clasesDelMes.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4" 
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              Mis Próximas Clases
            </h2>
            <div className="space-y-3">
              {clasesDelMes.slice(0, 5).map((clase) => (
                <div key={clase.id} 
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ background: 'rgba(42, 42, 42, 0.6)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {clase.tipo_nombre || 'Clase'}
                    </p>
                    <p className="text-sm" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      {formatDateInTimezone(clase.fecha, timezone)} • {formatTimeInTimezone(clase.hora_inicio, timezone)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                      {clase.reservas_actuales}/{clase.capacidad}
                    </p>
                    <p className="text-xs" style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                      Reservas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}