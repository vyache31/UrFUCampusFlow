import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface TokensResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData): Promise<TokensResponse> => {
  const response = await axios.post(`${API_BASE_URL}/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
  const { access_token, refresh_token } = response.data;
  
  if (access_token) {
    localStorage.setItem('access_token', access_token);
  }
  if (refresh_token) {
    localStorage.setItem('refresh_token', refresh_token);
  }
  
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string): Promise<TokensResponse> => {
  const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  return response.data;
};

export const getTokenPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};