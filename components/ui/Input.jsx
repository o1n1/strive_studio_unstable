'use client'

export default function Input({ 
  label, 
  icon: Icon, 
  error, 
  type = 'text',
  required = false,
  disabled = false,
  ...props 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs sm:text-sm font-semibold" style={{ color: '#FFFCF3', fontFamily: 'Montserrat, sans-serif' }}>
          {label} {required && <span style={{ color: '#AE3F21' }}>*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          disabled={disabled}
          className="w-full px-3 sm:px-4 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{
            background: disabled ? 'rgba(255, 252, 243, 0.02)' : 'rgba(255, 252, 243, 0.05)',
            borderColor: error ? '#AE3F21' : 'rgba(156, 122, 94, 0.3)',
            color: '#FFFCF3',
            fontFamily: 'Montserrat, sans-serif'
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs mt-1 animate-fadeIn" style={{ color: '#AE3F21', fontFamily: 'Montserrat, sans-serif' }}>
          {error}
        </p>
      )}
    </div>
  )
}
