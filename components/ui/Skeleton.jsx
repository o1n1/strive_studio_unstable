'use client'

export default function Skeleton({ className = '', variant = 'default' }) {
  const baseStyles = "animate-pulse rounded-lg"
  
  const variants = {
    default: "bg-gray-700/30",
    light: "bg-gray-600/20",
    card: "bg-gray-700/20"
  }

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  )
}

// Skeleton específico para texto
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

// Skeleton para inputs
export function SkeletonInput({ className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton className="h-4 w-20" /> {/* Label */}
      <Skeleton className="h-12 w-full rounded-xl" /> {/* Input */}
    </div>
  )
}

// Skeleton para botones
export function SkeletonButton({ className = '' }) {
  return (
    <Skeleton className={`h-12 w-full rounded-xl ${className}`} />
  )
}

// Skeleton para avatar/icono circular
export function SkeletonCircle({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }
  
  return (
    <Skeleton className={`${sizes[size]} rounded-full ${className}`} />
  )
}