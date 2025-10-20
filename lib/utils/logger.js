/**
 * Sistema de logging para debugging
 */

const isDebug = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

export const logger = {
  log: (...args) => {
    if (isDebug) {
      console.log(...args)
    }
  },
  
  error: (...args) => {
    console.error(...args)
  },
  
  warn: (...args) => {
    if (isDebug) {
      console.warn(...args)
    }
  },

  success: (...args) => {
    if (isDebug) {
      console.log('✅', ...args)
    }
  }
}
