'use client'

export default function Card({ children, className = '' }) {
  return (
    <div 
      className={`
        backdrop-blur-xl 
        rounded-2xl md:rounded-3xl 
        p-6 md:p-8 lg:p-10 
        shadow-2xl 
        ${className}
      `}
      style={{ 
        background: 'rgba(53, 53, 53, 0.6)',
        border: '1px solid rgba(156, 122, 94, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {children}
    </div>
  )
}