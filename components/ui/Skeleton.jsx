'use client'

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  circle = false,
  className = '' 
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '8px',
        background: 'linear-gradient(90deg, rgba(156, 122, 94, 0.1) 25%, rgba(174, 63, 33, 0.1) 50%, rgba(156, 122, 94, 0.1) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  )
}

// Agregar al globals.css:
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }