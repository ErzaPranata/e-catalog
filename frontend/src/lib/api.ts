import { useAuthStore } from '@/stores/authStore';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An error occurred' };
      }
      
      const error = new Error(errorData.message || 'Request failed') as any;
      error.status = response.status;
      error.errors = errorData.errors;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, any>) {
    const url = params
      ? `${endpoint}?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
          )
        ).toString()}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Upload failed' };
      }
      const error = new Error(errorData.message || 'Upload failed') as any;
      error.status = response.status;
      throw error;
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL, () => useAuthStore.getState().accessToken);

// API endpoints
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const categoriesApi = {
  list: (params?: { includeInactive?: boolean }) =>
    api.get<any[]>('/categories', params),
  getBySlug: (slug: string) => api.get<any>(`/categories/${slug}`),
  adminList: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<any>('/admin/categories', params),
  adminCreate: (data: any) => api.post('/admin/categories', data),
  adminUpdate: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
  adminDelete: (id: string) => api.delete(`/admin/categories/${id}`),
};

export const productsApi = {
  list: (params?: any) => api.get<any>('/products', params),
  getBySlug: (slug: string) => api.get<any>(`/products/${slug}`),
  adminList: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<any>('/admin/products', params),
  adminGet: (id: string) => api.get<any>(`/admin/products/${id}`),
  adminCreate: (data: any) => api.post('/admin/products', data),
  adminUpdate: (id: string, data: any) => api.patch(`/admin/products/${id}`, data),
  adminDelete: (id: string) => api.delete(`/admin/products/${id}`),
};

export const productVariantsApi = {
  list: (productId: string) => api.get<any[]>(`/admin/products/${productId}/variants`),
  create: (productId: string, data: any) =>
    api.post(`/admin/products/${productId}/variants`, data),
  update: (id: string, data: any) =>
    api.patch(`/admin/products/${id}/variants/${id}`, data),
  delete: (id: string) =>
    api.delete(`/admin/products/${id}/variants/${id}`),
};

export const productImagesApi = {
  list: (productId: string) => api.get<any[]>(`/admin/products/${productId}/images`),
  listByVariant: (variantId: string) => api.get<any[]>(`/admin/products/variant/${variantId}/images`),
  create: (productId: string, data: any) =>
    api.post(`/admin/products/${productId}/images`, data),
  createBatch: (productId: string, data: any[]) =>
    api.post(`/admin/products/${productId}/images/batch`, data),
  update: (id: string, data: any) =>
    api.patch(`/admin/products/${id}/images/${id}`, data),
  reorder: (productId: string, imageIds: string[]) =>
    api.patch(`/admin/products/${productId}/images/reorder`, { imageIds }),
  setPrimary: (productId: string, id: string) =>
    api.patch(`/admin/products/${productId}/images/${id}/primary`),
  delete: (id: string) =>
    api.delete(`/admin/products/${id}/images/${id}`),
};

export const ordersApi = {
  create: (data: any) => api.post<any>('/orders', data),
  getByOrderNumber: (orderNumber: string) =>
    api.get<any>(`/orders/${orderNumber}`),
  adminList: (params?: any) => api.get<any>('/admin/orders', params),
  adminGet: (id: string) => api.get<any>(`/admin/orders/${id}`),
  adminUpdateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  adminUpdatePaymentStatus: (id: string, paymentStatus: string) =>
    api.patch(`/admin/orders/${id}/payment-status`, { paymentStatus }),
  adminGetDashboardStats: () => api.get<any>('/admin/orders/dashboard/stats'),
};

export const settingsApi = {
  getPublic: () => api.get<any>('/settings/public'),
  adminGet: () => api.get<any>('/admin/settings'),
  adminUpdate: (data: any) => api.patch('/admin/settings', data),
};

export const adminUsersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<any>('/admin/users', params),
  create: (data: any) => api.post('/admin/users', data),
  update: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  changePassword: (id: string, password: string) =>
    api.patch(`/admin/users/${id}/password`, { password }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

export const uploadsApi = {
  uploadProductImage: (file: File, productId: string, variantId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    if (variantId) formData.append('variantId', variantId);
    return api.upload<{ url: string; storagePath: string }>('/admin/uploads/product-image', formData);
  },
  uploadProductImages: (files: File[], productId: string, variantId?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('productId', productId);
    if (variantId) formData.append('variantId', variantId);
    return api.upload<Array<{ url: string; storagePath: string }>>(
      '/admin/uploads/product-images',
      formData
    );
  },
  deleteProductImage: (storagePath: string) =>
    api.post('/admin/uploads/product-image', { storagePath }),
  deleteProductImages: (storagePaths: string[]) =>
    api.post('/admin/uploads/product-images', { storagePaths }),
};