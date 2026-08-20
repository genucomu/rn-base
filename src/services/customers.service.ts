import type { Customer, CustomerListResponse } from '@/types/api';
import { http } from './http';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  q?: string;
  ivaCondition?: string;
  [key: string]: unknown;
}

export const customersService = {
  list(params?: CustomerListParams): Promise<CustomerListResponse> {
    return http.get<CustomerListResponse>('/billing/customers', params);
  },

  getById(id: string): Promise<Customer> {
    return http.get<Customer>(`/billing/customers/${id}`);
  },

  create(data: unknown): Promise<Customer> {
    return http.post<Customer>('/billing/customers', data);
  },

  update(id: string, data: unknown): Promise<Customer> {
    return http.patch<Customer>(`/billing/customers/${id}`, data);
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/billing/customers/${id}`);
  },
};
