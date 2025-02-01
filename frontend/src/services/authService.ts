import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'writer' | 'editor';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  static async login(data: LoginData): Promise<void> {
    try {
      console.log('Attempting login with:', { email: data.email });
      const response = await api.post<AuthResponse>('auth/login', data);
      console.log('Login successful:', { userId: response.data.user.id });
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw this.handleError(error);
    }
  }

  static async register(data: RegisterData): Promise<void> {
    try {
      console.log('Attempting registration with:', { 
        email: data.email, 
        role: data.role,
        apiUrl: import.meta.env.VITE_API_URL 
      });
      
      const response = await api.post<AuthResponse>('auth/register', data);
      console.log('Registration successful:', {
        status: response.status,
        data: response.data
      });
      // Don't automatically log in after registration
      // Let the user log in manually
    } catch (error) {
      console.error('Registration failed:', {
        error,
        apiUrl: import.meta.env.VITE_API_URL,
        env: import.meta.env.MODE
      });
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getUser(): any {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private static handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.message || 'Authentication failed';
      return new Error(message);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from server. Please try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error('Request failed. Please check your connection.');
    }
  }
}

export default AuthService; 