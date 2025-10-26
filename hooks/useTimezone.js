'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Hook para obtener el timezone del estudio con caché inteligente
 * 
 * CARACTERÍSTICAS:
 * - Caché de 24 horas (el timezone rara vez cambia)
 * - Solo 1 query a Supabase por día
 * - Compartido entre todos los componentes
 * - Fallback a 'America/Mexico_City' si falla
 * 
 * USO:
 * const { timezone, loading } = useTimezone()
 */

// Función para obtener timezone desde Supabase
async function fetchTimezone() {
  try {
    const { data, error } = await supabase
      .from('studio_config')
      .select('config_value')
      .eq('config_key', 'timezone')
      .single()

    if (error) {
      console.warn('⚠️ Error obteniendo timezone:', error)
      return 'America/Mexico_City' // Fallback
    }

    // El timezone está en config_value.timezone
    const timezone = data?.config_value?.timezone || 'America/Mexico_City'
    console.log('✅ Timezone obtenido:', timezone)
    
    return timezone
  } catch (error) {
    console.error('❌ Error crítico en fetchTimezone:', error)
    return 'America/Mexico_City' // Fallback
  }
}

export function useTimezone() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studio-timezone'],
    queryFn: fetchTimezone,
    staleTime: 24 * 60 * 60 * 1000, // 24 horas - El timezone casi nunca cambia
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 días en caché
    refetchOnMount: false, // No refetch al montar
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    refetchOnReconnect: false, // No refetch al reconectar
    retry: 2, // Reintentar solo 2 veces
    retryDelay: 1000 // 1 segundo entre reintentos
  })

  return {
    timezone: data || 'America/Mexico_City',
    loading: isLoading,
    error
  }
}

/**
 * Función helper para convertir fecha/hora a timezone del estudio
 * 
 * @param {Date|string} date - Fecha a convertir
 * @param {string} timezone - Timezone del estudio
 * @returns {string} Fecha formateada en timezone local
 * 
 * USO:
 * const { timezone } = useTimezone()
 * const fechaLocal = formatInTimezone(clase.fecha, timezone)
 */
export function formatInTimezone(date, timezone = 'America/Mexico_City') {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return dateObj.toLocaleString('es-MX', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('❌ Error formateando fecha:', error)
    return date.toString()
  }
}

/**
 * Hook para obtener fecha actual en timezone del estudio
 * 
 * USO:
 * const { currentDate, timezone } = useCurrentTimezoneDate()
 */
export function useCurrentTimezoneDate() {
  const { timezone, loading } = useTimezone()
  
  const currentDate = new Date().toLocaleString('es-MX', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return {
    currentDate,
    timezone,
    loading
  }
}