'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { defaultQueryOptions } from '@/lib/react-query-config'

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: {
        retry: 1,
        onError: (error) => {
          // Log de errores en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Mutation error:', error)
          }
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}