// API service layer with automatic fallback to mock data

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic fetch wrapper with automatic mock data fallback
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.ok) {
      return await response.json();
    }

    // If response is not ok, fall through to mock data
    throw new Error(`API error: ${response.status}`);
  } catch (error) {
    // API not available or failed - this is normal during development
    console.warn(`API call to ${endpoint} failed, using mock data:`, error);
    throw error; // Re-throw to let caller handle fallback
  }
}

export const api = {
  fetch: apiFetch,
  getBaseUrl: () => BASE_URL,
};
