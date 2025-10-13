'use client'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}>
      
      {/* Decoración de fondo reutilizable */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 md:w-96 md:h-96 rounded-full opacity-20 animate-pulse"
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

      {/* Contenido */}
      <div className="w-full max-w-md lg:max-w-lg relative z-10 animate-scaleIn">
        
        {/* Logo y branding */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-3 tracking-tight" 
            style={{ 
              color: '#FFFCF3',
              textShadow: '0 2px 20px rgba(174, 63, 33, 0.3)'
            }}
          >
            STRIVE
          </h1>
          <p 
            className="text-xs md:text-sm tracking-widest uppercase opacity-70" 
            style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
          >
            No Limits, Just Power
          </p>
        </div>

        {children}

        {/* Footer */}
        <p 
          className="text-center mt-6 md:mt-8 text-xs md:text-sm opacity-50" 
          style={{ color: '#B39A72', fontFamily: 'Montserrat, sans-serif' }}
        >
          © 2025 Strive Studio. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}