import axios, { AxiosError } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ke_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Extract RFC 7807 Problem Details
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; title?: string; errors?: Record<string, string[]> }>) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      const currentToken = localStorage.getItem('ke_auth_token');
      if (currentToken && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('ke_auth_token');
        localStorage.removeItem('ke_auth_user');
      }
    }

    const problem = error.response?.data;
    const message =
      problem?.detail ||
      (problem?.errors ? Object.values(problem.errors).flat().join(', ') : null) ||
      problem?.title ||
      error.message ||
      'An unexpected error occurred.';

    return Promise.reject(new Error(message));
  }
);
