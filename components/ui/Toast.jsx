'use client'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 5000 
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />
  }

  const colors = {
    success: '#10b981',
    error: '#AE3F21',
    warning: '#f59e0b'
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-slideUp"
      style={{
        maxWidth: '400px',
        minWidth: '300px'
      }}
    >
      <div 
        className="backdrop-blur-xl rounded-xl p-4 shadow-2xl flex items-center gap-3"
        style={{
          background: 'rgba(53, 53, 53, 0.9)',
          border: `1px solid ${colors[type]}`,
          color: '#FFFCF3'
        }}
      >
        <div style={{ color: colors[type] }}>
          {icons[type]}
        </div>
        <p className="flex-1 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {message}
        </p>
        <button 
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: '#B39A72' }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}