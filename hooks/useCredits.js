'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './useUser'

async function fetchUserCredits(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select(`
      *,
      package:packages(*)
    `)
    .eq('user_id', userId)
    .order('fecha_expiracion', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

async function fetchActiveCredits(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select(`
      *,
      package:packages(*)
    `)
    .eq('user_id', userId)
    .eq('estado', 'activo')
    .gt('creditos_restantes', 0)
    .gt('fecha_expiracion', new Date().toISOString())
    .order('fecha_expiracion', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export function useUserCredits(userId, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-credits', userId],
    queryFn: () => fetchUserCredits(userId),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: enabled && !!userId
  })

  return {
    credits: data || [],
    loading: isLoading,
    error,
    refetch
  }
}

export function useMyCredits() {
  const { user } = useUser()
  
  return useUserCredits(user?.id, !!user?.id)
}

export function useActiveCredits(userId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['active-credits', userId],
    queryFn: () => fetchActiveCredits(userId),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!userId
  })

  const totalCredits = data?.reduce((sum, credit) => sum + credit.creditos_restantes, 0) || 0

  return {
    activeCredits: data || [],
    totalCredits,
    loading: isLoading,
    error,
    refetch
  }
}

export function useMyActiveCredits() {
  const { user } = useUser()
  
  return useActiveCredits(user?.id)
}

export function useCreditsSummary() {
  const { user } = useUser()

  const { data, isLoading, error } = useQuery({
    queryKey: ['credits-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credits_summary')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!user?.id
  })

  return {
    summary: data,
    loading: isLoading,
    error
  }
}

export function useCreateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (creditData) => {
      const { data, error } = await supabase
        .from('user_credits')
        .insert([creditData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-credits', variables.user_id] })
      queryClient.invalidateQueries({ queryKey: ['active-credits', variables.user_id] })
      queryClient.invalidateQueries({ queryKey: ['credits-summary', variables.user_id] })
    }
  })
}

export function useUpdateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ creditId, updates }) => {
      const { data, error } = await supabase
        .from('user_credits')
        .update(updates)
        .eq('id', creditId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-credits', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['active-credits', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['credits-summary', data.user_id] })
    }
  })
}

export function useDeductCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ creditId, userId }) => {
      const { data: credit, error: fetchError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('id', creditId)
        .single()

      if (fetchError) throw fetchError

      if (credit.creditos_restantes <= 0) {
        throw new Error('No hay créditos disponibles')
      }

      const { data, error } = await supabase
        .from('user_credits')
        .update({
          creditos_restantes: credit.creditos_restantes - 1,
          estado: credit.creditos_restantes - 1 <= 0 ? 'usado' : 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', creditId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-credits', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['active-credits', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['credits-summary', variables.userId] })
    }
  })
}

export function useRefundCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ creditId, userId }) => {
      const { data: credit, error: fetchError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('id', creditId)
        .single()

      if (fetchError) throw fetchError

      if (credit.creditos_restantes >= credit.creditos_totales) {
        throw new Error('No se puede reembolsar más créditos')
      }

      const { data, error } = await supabase
        .from('user_credits')
        .update({
          creditos_restantes: credit.creditos_restantes + 1,
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', creditId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-credits', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['active-credits', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['credits-summary', variables.userId] })
    }
  })
}

export function useCreditById(creditId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['credit', creditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select(`
          *,
          package:packages(*)
        `)
        .eq('id', creditId)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!creditId
  })

  return {
    credit: data,
    loading: isLoading,
    error
  }
}