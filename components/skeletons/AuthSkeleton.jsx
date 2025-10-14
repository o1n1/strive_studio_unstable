'use client'

import AuthLayout from '@/components/layouts/AuthLayout'
import Card from '@/components/ui/Card'
import Skeleton, { SkeletonInput, SkeletonButton, SkeletonText } from '@/components/ui/Skeleton'

// Skeleton para página de Login
export function LoginSkeleton() {
  return (
    <AuthLayout>
      <Card>
        <div className="space-y-6">
          {/* Inputs */}
          <SkeletonInput />
          <SkeletonInput />
          
          {/* Recordarme y olvidaste contraseña */}
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Botón principal */}
          <div className="pt-3">
            <SkeletonButton />
          </div>
          
          {/* Divider */}
          <div className="relative my-8">
            <Skeleton className="h-px w-full" />
          </div>
          
          {/* Botón secundario */}
          <SkeletonButton />
        </div>
      </Card>
    </AuthLayout>
  )
}

// Skeleton para verificación de sesión
export function SessionCheckSkeleton() {
  return (
    <AuthLayout>
      <Card>
        <div className="text-center py-8 space-y-4">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </Card>
    </AuthLayout>
  )
}