import type { Product, ProductListResponse } from '@/types/api';
import { http } from './http';

export interface ProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export const productsService = {
  list(params?: ProductListParams): Promise<ProductListResponse> {
    return http.get<ProductListResponse>('/billing/products', params);
  },

  getById(id: string): Promise<Product> {
    return http.get<Product>(`/billing/products/${id}`);
  },

  create(data: unknown): Promise<Product> {
    return http.post<Product>('/billing/products', data);
  },

  update(id: string, data: unknown): Promise<Product> {
    return http.patch<Product>(`/billing/products/${id}`, data);
  },

  deactivate(id: string): Promise<Product> {
    return http.post<Product>(`/billing/products/${id}/deactivate`);
  },
};
