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
import { supabase } from '@/lib/supabase/client'

export default function CoachDashboardPage() {
  const router = useRouter()
  const { isAuthorized, loading: authLoading } = useProtectedRoute('coach')
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    clasesEstesMes: 0,
    proximasClases: 0,
    ratingPromedio: 0,
    totalClientes: 0
  })
  const [coach, setCoach] = useState(null)

  useEffect(() => {
    if (isAuthorized) {
      cargarDatosCoach()
    }
  }, [isAuthorized])

  const cargarDatosCoach = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Cargar datos del coach
      const { data: coachData } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setCoach(coachData)

      // Aquí puedes agregar más queries para estadísticas
      // Por ahora valores de ejemplo
      setStats({
        clasesEstesMes: coachData?.total_clases || 0,
        proximasClases: 5,
        ratingPromedio: coachData?.rating_promedio || 0,
        totalClientes: 0
      })

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con Botón de Editar Perfil */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" 
              style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
              ¡Hola, {coach?.nombre}! 👋
            </h1>
            <p className="text-sm mt-1" 
              style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              Listo para inspirar hoy
            </p>
          </div>

          {/* BOTÓN DE EDITAR PERFIL */}
          <Link href="/coach/editar-perfil">
            <button
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90 flex items-center gap-2"
              style={{ 
                background: '#AE3F21', 
                color: '#FFFCF3', 
                fontFamily: 'Montserrat, sans-serif' 
              }}
            >
              <Edit size={18} />
              Editar Mi Perfil
            </button>
          </Link>
        </div>

        {/* Alerta si el coach está pendiente */}
        {coach?.estado === 'pendiente' && (
          <Card>
            <div className="flex items-start gap-3 p-4"
              style={{ 
                background: 'rgba(251, 191, 36, 0.1)', 
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '12px'
              }}>
              <Clock size={24} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div>
                <p className="font-bold mb-1" 
                  style={{ color: '#fbbf24', fontFamily: 'Montserrat, sans-serif' }}>
                  Tu perfil está en revisión
                </p>
                <p className="text-sm" 
                  style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                  El equipo está revisando tu solicitud. Te notificaremos cuando sea aprobada.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-2">
                <Calendar size={32} style={{ color: '#AE3F21' }} />
              </div>
              <p className="text-3xl font-bold mb-1" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                {stats.clasesEstesMes}
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
                {stats.proximasClases}
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
                {stats.ratingPromedio.toFixed(1)}
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
                {stats.totalClientes}
              </p>
              <p className="text-sm" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Clientes Únicos
              </p>
            </div>
          </Card>
        </div>

        {/* Acciones Rápidas */}
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
                style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
                <Edit size={24} style={{ color: '#B39A72' }} className="mb-2" />
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

            <div className="p-4 rounded-lg transition-all hover:opacity-80 cursor-pointer"
              style={{ background: 'rgba(156, 122, 94, 0.1)', border: '1px solid rgba(156, 122, 94, 0.2)' }}>
              <Award size={24} style={{ color: '#B39A72' }} className="mb-2" />
              <p className="font-semibold" 
                style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
                Mis Estadísticas
              </p>
              <p className="text-xs mt-1" 
                style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
                Performance y métricas
              </p>
            </div>
          </div>
        </Card>

        {/* Próximas Clases */}
        <Card>
          <h2 className="text-xl font-bold mb-4" 
            style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
            Próximas Clases
          </h2>
          <div className="text-center py-8">
            <p style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}>
              No tienes clases programadas próximamente
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
