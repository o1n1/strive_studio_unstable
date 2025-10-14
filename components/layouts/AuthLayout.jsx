'use client'

export default function AuthLayout({ children }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden"
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

      {/* Contenido con mejor ancho responsive */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl relative z-10 animate-scaleIn">
        
        {/* Logo y branding con mejor spacing */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 tracking-tight" 
            style={{ 
              color: '#FFFCF3',
              textShadow: '0 2px 20px rgba(174, 63, 33, 0.3)'
            }}
          >
            STRIVE
          </h1>
          <p 
            className="text-xs sm:text-sm tracking-widest uppercase opacity-70" 
            style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            No Limits, Just Power
          </p>
        </div>

        {children}

        {/* Footer con mejor spacing */}
        <p 
          className="text-center mt-6 sm:mt-8 text-xs sm:text-sm opacity-50" 
          style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
        >
          © 2025 Strive Studio. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
