'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { stableQueryOptions } from '@/lib/react-query-config'

async function fetchCoaches({ estado, activo } = {}) {
  let query = supabase
    .from('coaches_complete')
    .select('*')
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (activo !== undefined) query = query.eq('activo', activo)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export function useCoaches({ estado, activo, enabled = true } = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coaches', { estado, activo }],
    queryFn: () => fetchCoaches({ estado, activo }),
    ...stableQueryOptions,
    enabled,
  })

  return {
    coaches: data || [],
    loading: isLoading,
    error,
    refetch,
  }
}

export function useActiveCoaches() {
  return useCoaches({ estado: 'activo', activo: true })
}

export function usePendingCoaches() {
  return useCoaches({ estado: 'pendiente' })
}

export function useCoachById(coachId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches_complete')
        .select('*')
        .eq('id', coachId)
        .single()

      if (error) throw error
      return data
    },
    ...stableQueryOptions,
    enabled: !!coachId,
  })

  return {
    coach: data,
    loading: isLoading,
    error,
    refetch,
  }
}

export function useCoachStats(coachId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-stats', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_stats')
        .select('*')
        .eq('id', coachId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!coachId,
  })

  return {
    stats: data,
    loading: isLoading,
    error,
  }
}