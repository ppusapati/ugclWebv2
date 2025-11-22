// src/services/auth.service.ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_super_admin?: boolean;
}

export interface BusinessVertical {
  id: string;
  name: string;
  code: string;
  description: string;
  access_type: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

class AuthService {
  private baseUrl = 'http://localhost:8080/api/v1';
  private apiKey = '87339ea3-1add-4689-ae57-3128ebd03c4f'; // From your .env

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async getUserBusinesses(): Promise<BusinessVertical[]> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/my-businesses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch businesses');
    }

    const data = await response.json();
    return data.accessible_businesses;
  }

  async getSuperAdminDashboard() {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }

    return response.json();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }
}

export const authService = new AuthService();
