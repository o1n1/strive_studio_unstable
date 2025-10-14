import { useState, useEffect } from 'react'

/**
 * Hook para debounce - retrasa la actualización de un valor
 * Útil para no hacer demasiadas peticiones mientras el usuario escribe
 * @param {any} value - Valor a hacer debounce
 * @param {number} delay - Delay en milisegundos (default: 500ms)
 * @returns {any} Valor con debounce aplicado
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Configurar timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpiar timeout si el valor cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}