import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';

// Get base URL from environment
const baseURL = import.meta.env.VITE_API_URL;

// Validate API URL
if (!baseURL) {
  console.error('API URL is not configured. Please check your environment variables.');
}

console.log('API Configuration:', {
  baseURL,
  env: import.meta.env.MODE,
  isDev: import.meta.env.DEV
});

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log all requests in detail
    console.log('Making API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });

    const token = localStorage.getItem('auth_token');
    if (token) {
      if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers);
      }
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor with detailed logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error: AxiosError) => {
    // Detailed error logging
    console.error('API Error:', {
      url: error.config?.url,
      fullUrl: error.config?.baseURL && error.config?.url ? `${error.config.baseURL}${error.config.url}` : undefined,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.config?.headers,
      data: error.response?.data,
      message: error.message
    });

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }

    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    if (error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (error.response.status === 404) {
      throw new Error(`Resource not found: ${error.config?.url || 'unknown endpoint'}`);
    }

    const errorMessage = error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message
      : error.message;
    throw new Error(errorMessage);
  }
);

export default api; 