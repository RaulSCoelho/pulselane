'use client'

import { isTransientQueryError } from '@/http/api-error'
import { getRateLimitRetryDelayMs } from '@/http/rate-limit'
import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: unknown) => previousData,
        retry: (failureCount, error) => failureCount < 1 && isTransientQueryError(error),
        retryDelay: (attemptIndex, error) => {
          const retryAfterMs =
            error instanceof Error && 'retryAfterMs' in error && typeof error.retryAfterMs === 'number'
              ? error.retryAfterMs
              : null

          return retryAfterMs ?? getRateLimitRetryDelayMs(null, attemptIndex)
        }
      }
    }
  })
}
