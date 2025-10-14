'use client'

import { Loader2 } from 'lucide-react'

export default function Button({ 
  children, 
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props 
}) {
  const baseStyles = 'w-full py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-sm sm:text-base'
  
  const variants = {
    primary: {
      background: '#AE3F21',
      color: '#FFFCF3'
    },
    secondary: {
      background: 'rgba(156, 122, 94, 0.2)',
      color: '#B39A72'
    }
  }

  const style = variants[variant]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${className}`}
      style={{
        background: style.background,
        color: style.color,
        fontFamily: 'Montserrat, sans-serif'
      }}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}
