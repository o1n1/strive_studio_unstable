/**
 * Sistema de Rate Limiting en memoria
 * Protege contra ataques de fuerza bruta y spam
 */

const rateLimitStore = new Map()

/**
 * Limpia entradas expiradas cada 5 minutos
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Verifica si una IP/clave ha excedido el límite
 * @param {string} identifier - IP o clave única
 * @param {number} maxAttempts - Intentos máximos permitidos
 * @param {number} windowMs - Ventana de tiempo en ms (default 15 min)
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function checkRateLimit(identifier, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (record.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }

  record.attempts++
  return { allowed: true, remaining: maxAttempts - record.attempts }
}

/**
 * Limpia el rate limit de una clave específica
 */
export function clearRateLimit(identifier) {
  rateLimitStore.delete(identifier)
}

/**
 * Obtiene la IP del cliente desde headers
 */
export function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
