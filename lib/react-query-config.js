/**
 * Configuración centralizada de React Query
 * Define constantes y lógica de retry inteligente
 */

// Tiempos de caché (en milisegundos)
export const QUERY_STALE_TIME = {
  DEFAULT: 5 * 60 * 1000,        // 5 minutos - datos normales
  SHORT: 1 * 60 * 1000,          // 1 minuto - datos que cambian frecuentemente
  LONG: 10 * 60 * 1000,          // 10 minutos - datos estables
  REALTIME: 0,                   // 0 - datos en tiempo real
}

export const QUERY_GC_TIME = {
  DEFAULT: 10 * 60 * 1000,       // 10 minutos - caché normal
  SHORT: 5 * 60 * 1000,          // 5 minutos - limpiar rápido
  LONG: 30 * 60 * 1000,          // 30 minutos - mantener más tiempo
}

// Retry logic inteligente
export const retryQuery = (failureCount, error) => {
  // No reintentar errores de autenticación
  if (error?.message?.includes('JWT') || 
      error?.message?.includes('auth') ||
      error?.code === 'PGRST301') {
    return false
  }

  // No reintentar errores 400 (bad request)
  if (error?.code?.startsWith('4')) {
    return false
  }

  // Reintentar errores de red/servidor hasta 3 veces
  if (error?.code?.startsWith('5') || 
      error?.message?.includes('network') ||
      error?.message?.includes('fetch')) {
    return failureCount < 3
  }

  // Default: 1 reintento
  return failureCount < 1
}

// Delay exponencial para reintentos (ms)
export const retryDelay = (attemptIndex) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000) // Max 30 segundos
}

// Configuración por defecto para todas las queries
export const defaultQueryOptions = {
  staleTime: QUERY_STALE_TIME.DEFAULT,
  gcTime: QUERY_GC_TIME.DEFAULT,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: retryQuery,
  retryDelay: retryDelay,
}

// Configuración para queries de datos en tiempo real
export const realtimeQueryOptions = {
  staleTime: QUERY_STALE_TIME.REALTIME,
  gcTime: QUERY_GC_TIME.SHORT,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchInterval: 30000, // Cada 30 segundos
  retry: 2,
}

// Configuración para datos estables (coaches, tipos de clase, etc)
export const stableQueryOptions = {
  staleTime: QUERY_STALE_TIME.LONG,
  gcTime: QUERY_GC_TIME.LONG,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
}