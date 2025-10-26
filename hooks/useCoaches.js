'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

async function fetchCoaches({ estado, activo } = {}) {
  let query = supabase
    .from('coaches_complete')
    .select('*')
    .order('created_at', { ascending: false })

  if (estado) {
    query = query.eq('estado', estado)
  }

  if (activo !== undefined) {
    query = query.eq('activo', activo)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

export function useCoaches({ estado, activo, enabled = true } = {}) {
  const queryKey = ['coaches', { estado, activo }]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchCoaches({ estado, activo }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled
  })

  return {
    coaches: data || [],
    loading: isLoading,
    error,
    refetch
  }
}

export function useActiveCoaches() {
  return useCoaches({
    estado: 'activo',
    activo: true
  })
}

export function usePendingCoaches() {
  return useCoaches({
    estado: 'pendiente'
  })
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!coachId
  })

  return {
    coach: data,
    loading: isLoading,
    error,
    refetch
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
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!coachId
  })

  return {
    stats: data,
    loading: isLoading,
    error
  }
}

export function useUpdateCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ coachId, updates }) => {
      const { data, error } = await supabase
        .from('coaches')
        .update(updates)
        .eq('id', coachId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] })
      queryClient.invalidateQueries({ queryKey: ['coach', variables.coachId] })
      queryClient.invalidateQueries({ queryKey: ['coach-stats', variables.coachId] })
    }
  })
}

export function useApproveCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ coachId, approvedBy }) => {
      const { data, error } = await supabase
        .from('coaches')
        .update({
          estado: 'activo',
          activo: true,
          fecha_aprobacion: new Date().toISOString().split('T')[0],
          aprobado_por: approvedBy
        })
        .eq('id', coachId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] })
      queryClient.invalidateQueries({ queryKey: ['coach', variables.coachId] })
    }
  })
}

export function useRejectCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (coachId) => {
      const { data, error } = await supabase
        .from('coaches')
        .update({
          estado: 'rechazado',
          activo: false
        })
        .eq('id', coachId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, coachId) => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] })
      queryClient.invalidateQueries({ queryKey: ['coach', coachId] })
    }
  })
}

export function useCoachCertifications(coachId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-certifications', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_certifications')
        .select('*')
        .eq('coach_id', coachId)
        .order('fecha_obtencion', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!coachId
  })

  return {
    certifications: data || [],
    loading: isLoading,
    error
  }
}

export function useCoachDocuments(coachId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-documents', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_documents')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!coachId
  })

  return {
    documents: data || [],
    loading: isLoading,
    error
  }
}

export function useCoachContracts(coachId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-contracts', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_contracts')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!coachId
  })

  const activeContract = data?.find(c => c.vigente === true)

  return {
    contracts: data || [],
    activeContract,
    loading: isLoading,
    error
  }
}

export function useCoachClasses(coachId, { startDate, endDate } = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach-classes', coachId, { startDate, endDate }],
    queryFn: async () => {
      let query = supabase
        .from('classes_full_info')
        .select('*')
        .eq('coach_id', coachId)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })

      if (startDate) {
        query = query.gte('fecha', startDate)
      }

      if (endDate) {
        query = query.lte('fecha', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!coachId
  })

  return {
    classes: data || [],
    loading: isLoading,
    error
  }
}