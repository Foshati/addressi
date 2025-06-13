import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown) => {
  console.error("Frontend: API Error caught:", error);
  if (error instanceof AxiosError) {
    const err = error;
    if (err.response) {
      console.error("Frontend: API Error Response Data:", err.response.data);
      console.error("Frontend: API Error Response Status:", err.response.status);
    }
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    if (err.message && err.code === 'ECONNABORTED') {
      throw new Error('Server is not responding. Please check your internet connection and try again.');
    }
  }
  throw new Error('An unexpected error occurred.');
};

export interface Link {
  id: string;
  title: string;
  url:string;
  slug: string;
  description?: string;
  isActive: boolean;
  clicks: number;
  isCustom: boolean;
  favicon?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface CreateLinkData {
  title: string;
  url: string;
  description?: string;
  customSlug?: string;
}

export interface UpdateLinkData {
  title?: string;
  url?: string;
  description?: string;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const linkApi = {
  createLink: async (data: CreateLinkData) => {
    try {
      const response = await api.post<ApiResponse<Link>>('/api/v1/links', data);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getPublicLinks: async () => {
    try {
      const response = await api.get<ApiResponse<Link[]>>('/api/v1/links/public-links');
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getMyLinks: async () => {
    try {
      const response = await api.get<ApiResponse<Link[]>>('/api/v1/links/my-links');
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getLinkBySlug: async (slug: string) => {
    try {
      const response = await api.get<ApiResponse<Link>>(`/api/v1/links/${slug}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw error;
      }
      handleApiError(error);
      throw error;
    }
  },

  updateLink: async (id: string, data: UpdateLinkData) => {
    try {
      const response = await api.put<ApiResponse<Link>>(`/api/v1/links/${id}`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteLink: async (id: string) => {
    try {
      await api.delete(`/api/v1/links/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};