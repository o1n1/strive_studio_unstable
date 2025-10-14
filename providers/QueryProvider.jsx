'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
        cacheTime: 10 * 60 * 1000, // 10 minutos - mantener en caché
        refetchOnWindowFocus: false, // No refrescar al cambiar de pestaña
        refetchOnMount: false, // No refrescar al montar componente
        retry: 1, // Solo 1 reintento en caso de error
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}