'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// Fetch bookings del usuario
async function fetchUserBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes (
        *,
        class_type:class_types (*),
        coach:coaches (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Hook principal de bookings
export function useUserBookings(userId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', userId],
    queryFn: () => fetchUserBookings(userId),
    enabled: !!userId,
  })

  return {
    bookings: data || [],
    loading: isLoading,
    error,
    refetch,
  }
}

// Crear booking usando función transaccional
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, classId, spotId }) => {
      const { data, error } = await supabase.rpc('create_booking_transactional', {
        p_user_id: userId,
        p_class_id: classId,
        p_spot_id: spotId,
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message || data.error)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class', variables.classId] })
      queryClient.invalidateQueries({ queryKey: ['user-credits', variables.userId] })
    },
  })
}

// Cancelar booking usando función transaccional
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, userId, reason }) => {
      const { data, error } = await supabase.rpc('cancel_booking_transactional', {
        p_booking_id: bookingId,
        p_user_id: userId,
        p_reason: reason,
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message || data.error)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['user-credits', variables.userId] })
    },
  })
}

// Check-in usando función transaccional
export function useCheckInBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, staffId }) => {
      const { data, error } = await supabase.rpc('checkin_booking_transactional', {
        p_booking_id: bookingId,
        p_staff_id: staffId,
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message || data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// Agregar a waitlist
export function useAddToWaitlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, classId }) => {
      const { data, error } = await supabase.rpc('add_to_waitlist_transactional', {
        p_user_id: userId,
        p_class_id: classId,
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message || data.error)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', variables.classId] })
    },
  })
}