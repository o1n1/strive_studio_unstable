'use client'

import { useQuery, useMutation, useQueryClient } from '@tantml/react-query'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './useUser'

async function fetchBookings({ userId, classId, estado } = {}) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      class:classes(
        *,
        class_type:class_types(*),
        room:rooms(*),
        coach:coaches(
          id,
          profiles(nombre, apellidos)
        )
      ),
      user:profiles(id, nombre, apellidos, email),
      spot:spots(*),
      user_credit:user_credits(*)
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (classId) {
    query = query.eq('class_id', classId)
  }

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

export function useBookings({ userId, classId, estado, enabled = true } = {}) {
  const queryKey = ['bookings', { userId, classId, estado }]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchBookings({ userId, classId, estado }),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled
  })

  return {
    bookings: data || [],
    loading: isLoading,
    error,
    refetch
  }
}

export function useMyBookings({ estado } = {}) {
  const { user } = useUser()
  
  return useBookings({
    userId: user?.id,
    estado,
    enabled: !!user?.id
  })
}

export function useMyUpcomingBookings() {
  const { user } = useUser()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-upcoming-bookings', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes!inner(
            *,
            class_type:class_types(*),
            room:rooms(*),
            coach:coaches(
              id,
              profiles(nombre, apellidos)
            )
          ),
          spot:spots(*)
        `)
        .eq('user_id', user?.id)
        .eq('estado', 'confirmada')
        .gte('class.fecha', today)
        .order('class(fecha)', { ascending: true })
        .order('class(hora_inicio)', { ascending: true })

      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!user?.id
  })

  return {
    bookings: data || [],
    loading: isLoading,
    error,
    refetch
  }
}

export function useClassBookings(classId) {
  return useBookings({
    classId,
    enabled: !!classId
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingData) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-upcoming-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class', variables.class_id] })
      queryClient.invalidateQueries({ queryKey: ['user-credits'] })
    }
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          estado: 'cancelada',
          fecha_cancelacion: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-upcoming-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class', data.class_id] })
      queryClient.invalidateQueries({ queryKey: ['user-credits'] })
    }
  })
}

export function useCheckInBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          check_in_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['class', data.class_id] })
    }
  })
}

export function useBookingById(bookingId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(*,
            class_type:class_types(*),
            room:rooms(*),
            coach:coaches(id, profiles(nombre, apellidos))
          ),
          spot:spots(*),
          user_credit:user_credits(*)
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!bookingId
  })

  return {
    booking: data,
    loading: isLoading,
    error
  }
}