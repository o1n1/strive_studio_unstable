'use client'

export default function AuthLayout({ children }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #353535 0%, #1a1a1a 100%)' }}
    >
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #AE3F21 0%, transparent 70%)',
            animationDuration: '4s',
            transform: 'translate(50%, -50%)'
          }} 
        />
        <div 
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-5 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #9C7A5E 0%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '1s',
            transform: 'translate(-50%, 50%)'
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
