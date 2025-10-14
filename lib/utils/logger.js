// 🛡️ LOGGER SEGURO - Previene exposición de datos sensibles en producción
// Fuente única de verdad para logs en toda la aplicación

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

// Mostrar logs si está en desarrollo O si debug mode está activo
const shouldLog = isDevelopment || isDebugMode

// 🧪 VERIFICACIÓN: Mostrar entorno actual
if (typeof window !== 'undefined') {
  console.log('🔧 ENTORNO:', process.env.NODE_ENV)
  console.log('🐛 DEBUG MODE:', isDebugMode ? 'ACTIVO' : 'INACTIVO')
  console.log('📊 LOGS:', shouldLog ? 'VISIBLES' : 'OCULTOS')
}

/**
 * Sistema de logging que solo muestra información en desarrollo
 * En producción, los logs sensibles se ocultan automáticamente
 * EXCEPCIÓN: Si NEXT_PUBLIC_DEBUG_MODE=true, los logs se muestran
 */
export const logger = {
  /**
   * Log general - solo visible en desarrollo o debug mode
   */
  log: (...args) => {
    if (shouldLog) {
      console.log(...args)
    }
  },

  /**
   * Log de errores - siempre visible pero sanitizado en producción normal
   */
  error: (...args) => {
    if (shouldLog) {
      console.error(...args)
    } else {
      // En producción sin debug, solo log genérico sin detalles sensibles
      console.error('❌ Error en la aplicación')
      // Aquí se puede integrar Sentry, LogRocket, etc en el futuro
    }
  },

  /**
   * Log de advertencias - solo visible en desarrollo o debug mode
   */
  warn: (...args) => {
    if (shouldLog) {
      console.warn(...args)
    }
  },

  /**
   * Log de información - solo visible en desarrollo o debug mode
   */
  info: (...args) => {
    if (shouldLog) {
      console.info(...args)
    }
  },

  /**
   * Log de éxito - solo visible en desarrollo o debug mode
   */
  success: (...args) => {
    if (shouldLog) {
      console.log('✅', ...args)
    }
  }
}