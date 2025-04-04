/**
 * Query client configuration and API request utility
 */
import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// API request options interface
interface ApiRequestOptions extends RequestInit {
  on401?: 'redirect' | 'returnNull' | 'throw';
}

/**
 * Make an API request to the backend
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { on401 = 'redirect', ...fetchOptions } = options;

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
      },
    });

    // Handle 401 Unauthorized based on the specified action
    if (response.status === 401) {
      switch (on401) {
        case 'redirect':
          // In a real app, we might redirect to login
          console.error('Unauthorized access');
          throw new Error('Unauthorized');
        case 'returnNull':
          return null as T;
        case 'throw':
        default:
          throw new Error('Unauthorized');
      }
    }

    // Handle other error responses
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    } else {
      return null as T;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}