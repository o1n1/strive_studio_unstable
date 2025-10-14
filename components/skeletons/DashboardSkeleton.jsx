'use client'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Card from '@/components/ui/Card'
import Skeleton, { SkeletonCircle, SkeletonText, SkeletonButton } from '@/components/ui/Skeleton'

export default function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <Card>
        <div className="text-center space-y-6">
          <SkeletonCircle size="md" className="mx-auto" />
          
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          <div className="pt-4 p-6 rounded-xl" 
            style={{ 
              background: 'rgba(174, 63, 33, 0.1)', 
              border: '1px solid rgba(174, 63, 33, 0.3)' 
            }}>
            <SkeletonText lines={2} />
          </div>
        </div>
      </Card>
    </DashboardLayout>
  )
}
