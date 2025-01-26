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
      const response = await api.post<AuthResponse>('/auth/login', data);
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(data: RegisterData): Promise<void> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      // Don't automatically log in after registration
      // Let the user log in manually
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
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
      const message = error.response.data.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error('Request failed');
    }
  }
}

export default AuthService; 