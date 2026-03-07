import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

/** Map API status codes to user-friendly messages. */
function mapApiErrorToMessage(error: ApiError): string {
  if (error.status === 401) return 'Session expired. Please log in again.';
  if (error.status === 403) return 'You don\'t have permission to perform this action.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status === 422) return error.message || 'Validation failed. Please check your input.';
  if (error.status === 429) return 'Too many requests. Please try again later.';
  if (error.status === 503) return 'Service temporarily unavailable. Please try again later.';
  if (error.status === 0) return error.message; // Network/timeout
  return error.message || 'An unexpected error occurred.';
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, TArgs extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: TArgs) => Promise<T>;
  reset: () => void;
}

export function useApi<T, TArgs extends unknown[] = []>(
  apiFunction: (...args: TArgs) => Promise<T>
): UseApiReturn<T, TArgs> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = error instanceof ApiError
          ? mapApiErrorToMessage(error)
          : 'An unexpected error occurred';

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}
