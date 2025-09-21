import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  AdminRegisterCredentials,
  User 
} from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  private token: string | null = localStorage.getItem('token');

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.data.token);
    return response;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.data.token);
    return response;
  }

  async registerAdmin(credentials: AdminRegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.data.token);
    return response;
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/auth/profile');
  }

  async updateProfile(profileData: Partial<User['profile']>): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export default new AuthService();
