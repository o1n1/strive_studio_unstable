// 🛡️ RATE LIMITING - Protección centralizada contra spam y fuerza bruta
// Fuente única de verdad para rate limiting en toda la aplicación

const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutos

// Limpiar registros viejos cada hora para no consumir memoria
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 60 * 1000)

/**
 * Verifica si una solicitud excede el límite de rate limiting
 * @param {string} key - Identificador único (IP, email, o combinación)
 * @param {number} maxAttempts - Número máximo de intentos permitidos
 * @returns {Object} { allowed: boolean, remaining: number }
 */
export function checkRateLimit(key, maxAttempts) {
  const now = Date.now()
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  const keyData = rateLimitMap.get(key)
  
  // Si pasó la ventana de tiempo, reiniciar contador
  if (now - keyData.firstAttempt >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  // Incrementar contador
  keyData.count++
  const remaining = maxAttempts - keyData.count
  
  // Verificar si excede el límite
  if (keyData.count > maxAttempts) {
    return { allowed: false, remaining: 0 }
  }
  
  return { allowed: true, remaining: Math.max(0, remaining) }
}

/**
 * Limpia el rate limit para una key específica (útil después de login exitoso)
 * @param {string} key - Identificador único
 */
export function clearRateLimit(key) {
  rateLimitMap.delete(key)
}

/**
 * Obtiene la IP del cliente desde los headers de la request
 * @param {Request} request - Request object de Next.js
 * @returns {string} IP del cliente
 */
export function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}