// 🛡️ FETCH CON TIMEOUT - Previene peticiones colgadas indefinidamente
// Fuente única de verdad para peticiones HTTP con timeout

const DEFAULT_TIMEOUT = 10000 // 10 segundos

/**
 * Realiza una petición fetch con timeout automático
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch (method, headers, body, etc)
 * @param {number} timeout - Timeout en milisegundos (default: 10000ms)
 * @returns {Promise<Response>} Response de fetch
 * @throws {Error} Si el timeout se excede o hay error de red
 */
export async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  // Crear AbortController para cancelar la petición si tarda mucho
  const controller = new AbortController()
  
  // Configurar timeout
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    // Hacer fetch con signal de abort
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    // Limpiar timeout si la petición fue exitosa
    clearTimeout(timeoutId)
    
    return response
  } catch (error) {
    // Limpiar timeout
    clearTimeout(timeoutId)

    // Detectar tipo de error y lanzar con mensaje apropiado
    if (error.name === 'AbortError') {
      const timeoutError = new Error('La solicitud tardó demasiado. Verifica tu conexión a internet.')
      timeoutError.isTimeout = true
      throw timeoutError
    }

    // Detectar error de red
    if (error instanceof TypeError) {
      const networkError = new Error('Error de conexión. Verifica tu internet.')
      networkError.isNetworkError = true
      throw networkError
    }

    // Otro tipo de error
    throw error
  }
}

/**
 * Wrapper para peticiones POST JSON con timeout
 * @param {string} url - URL del endpoint
 * @param {object} data - Datos a enviar en el body
 * @param {number} timeout - Timeout en milisegundos
 * @returns {Promise<object>} Response parseado como JSON
 */
export async function postJSON(url, data, timeout = DEFAULT_TIMEOUT) {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    timeout
  )

  // Parsear respuesta como JSON
  return await response.json()
}