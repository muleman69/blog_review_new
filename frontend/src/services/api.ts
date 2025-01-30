import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

// Validate API URL
if (!baseURL) {
  console.error('API URL is not configured. Please check your environment variables.');
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add timeout
  timeout: 10000
});

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    }

    // Ensure CORS headers are sent
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }

    config.headers.set('Access-Control-Allow-Origin', import.meta.env.VITE_BASE_URL);
    config.headers.set('Access-Control-Allow-Credentials', 'true');

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });

    if (error.code === 'ECONNABORTED') {
      throw new Error('Server is not responding. Please try again later.');
    }

    if (!error.response) {
      throw new Error('Unable to reach the server. Please check your connection.');
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw error;
  }
);

export default api; 