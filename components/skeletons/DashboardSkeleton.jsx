'use client'

import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Skeleton, { SkeletonCircle, SkeletonText, SkeletonButton } from '@/components/ui/Skeleton'

// Skeleton para dashboards (admin, coach, cliente, staff)
export default function DashboardSkeleton() {
  return (
    <AuthLayout>
      <Card>
        <div className="text-center space-y-6">
          {/* Icono circular */}
          <SkeletonCircle size="md" className="mx-auto" />
          
          {/* Título y descripción */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          {/* Card de información */}
          <div className="pt-4 p-6 rounded-xl" 
            style={{ 
              background: 'rgba(174, 63, 33, 0.1)', 
              border: '1px solid rgba(174, 63, 33, 0.3)' 
            }}>
            <SkeletonText lines={2} />
          </div>
          
          {/* Botón */}
          <div className="pt-4">
            <SkeletonButton />
          </div>
        </div>
      </Card>
    </AuthLayout>
  )
}