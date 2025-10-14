'use client'

import Navbar from '@/components/ui/Navbar'

export default function DashboardLayout({ children }) {
  return (
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}
    >
      {/* Decoración de fondo mejorada */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Círculo naranja superior derecha */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 md:w-[32rem] md:h-[32rem] rounded-full opacity-20 animate-float"
          style={{ 
            background: 'radial-gradient(circle, #AE3F21 0%, transparent 70%)',
            filter: 'blur(40px)'
          }} 
        />
        
        {/* Círculo dorado inferior izquierda */}
        <div 
          className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] md:w-[36rem] md:h-[36rem] rounded-full opacity-15 animate-floatReverse"
          style={{ 
            background: 'radial-gradient(circle, #9C7A5E 0%, transparent 70%)',
            filter: 'blur(40px)',
            animationDelay: '2s'
          }} 
        />
      </div>

      {/* Container centrado con ancho máximo */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
