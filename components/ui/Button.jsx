'use client'
import { Children, cloneElement } from 'react'

export default function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  fullWidth = true,
  ...props 
}) {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #AE3F21 0%, #8d3319 100%)',
      color: '#FFFCF3',
      border: 'none',
      hoverShadow: '0 6px 30px rgba(174, 63, 33, 0.6)',
      defaultShadow: '0 4px 20px rgba(174, 63, 33, 0.4)'
    },
    secondary: {
      background: 'transparent',
      color: '#AE3F21',
      border: '1px solid #AE3F21',
      hoverBg: 'rgba(174, 63, 33, 0.1)',
      defaultShadow: 'none'
    }
  }

  const style = variants[variant]

  // Detectar si children contiene iconos (lucide-react)
  const hasIcon = Children.toArray(children).some(
    child => child?.type?.displayName || child?.type?.name
  )

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${fullWidth ? 'w-full' : ''} 
        font-semibold 
        py-3 md:py-4 
        px-5 md:px-6 
        rounded-xl 
        transition-all 
        transform 
        hover:scale-[1.02] 
        active:scale-[0.98] 
        disabled:opacity-50 
        disabled:cursor-not-allowed 
        disabled:hover:scale-100 
        text-sm md:text-base
        ${hasIcon ? 'flex items-center justify-center gap-2' : ''}
      `}
      style={{ 
        background: style.background,
        color: style.color,
        border: style.border,
        fontFamily: 'Montserrat, sans-serif',
        boxShadow: style.defaultShadow
      }}
      onMouseEnter={(e) => {
        if (!loading && !props.disabled) {
          if (variant === 'primary') {
            e.target.style.boxShadow = style.hoverShadow
          } else {
            e.target.style.backgroundColor = style.hoverBg
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!loading && !props.disabled) {
          if (variant === 'primary') {
            e.target.style.boxShadow = style.defaultShadow
          } else {
            e.target.style.backgroundColor = 'transparent'
          }
        }
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando...
        </span>
      ) : children}
    </button>
  )
}