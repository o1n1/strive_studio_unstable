'use client'

export default function DashboardLayout({ children }) {
  return (
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}
    >
      {/* Decoración de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 md:w-96 md:h-96 rounded-full opacity-10 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #AE3F21 0%, transparent 70%)',
            animationDuration: '4s'
          }} 
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 md:w-[28rem] md:h-[28rem] rounded-full opacity-10 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #9C7A5E 0%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '1s'
          }} 
        />
      </div>

      {/* Container con ancho máximo responsive */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}
