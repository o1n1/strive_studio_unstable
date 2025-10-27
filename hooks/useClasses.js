'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { stableQueryOptions } from '@/lib/react-query-config'

async function fetchClasses({ startDate, endDate, estado, coachId } = {}) {
  let query = supabase
    .from('classes_full_info')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (startDate) query = query.gte('fecha', startDate)
  if (endDate) query = query.lte('fecha', endDate)
  if (estado) query = query.eq('estado', estado)
  if (coachId) query = query.eq('coach_id', coachId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export function useClasses({ startDate, endDate, estado, coachId, enabled = true } = {}) {
  const queryKey = ['classes', { startDate, endDate, estado, coachId }]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchClasses({ startDate, endDate, estado, coachId }),
    enabled,
  })

  return {
    classes: data || [],
    loading: isLoading,
    error,
    refetch,
  }
}

export function useClassById(classId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes_full_info')
        .select('*')
        .eq('id', classId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!classId,
  })

  return {
    class: data,
    loading: isLoading,
    error,
  }
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newClass) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([newClass])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class', variables.id] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (classId) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}