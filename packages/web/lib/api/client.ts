// API Client für ShareLocal Frontend
// Verwaltet HTTP Requests mit automatischem Token Management

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - sollte die Base-URL ohne /api sein
// z.B. https://nuernbergspots.de/share-local/dev (nicht mit /api am Ende)
// client.ts fügt automatisch /api hinzu
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Entferne trailing slash und /api falls vorhanden (für Robustheit)
const cleanApiUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');

// Axios Instance erstellen
// baseURL enthält bereits /api, daher beginnen alle Routes direkt mit /listings, /auth, etc.
const apiClient: AxiosInstance = axios.create({
  baseURL: `${cleanApiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Fügt Token automatisch hinzu
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token aus localStorage laden
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Behandelt 401 Errors (Token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token ist ungültig oder abgelaufen
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Redirect zu Login (wird später implementiert)
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API Response Types
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

// Error Response Type
export interface ApiError {
  error: string;
  message?: string;
}

