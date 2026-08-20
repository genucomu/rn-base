import type { Invoice, InvoiceListResponse } from '@/types/api';
import { http } from './http';

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  pointOfSaleId?: string;
  invoiceType?: string;
  status?: string;
  from?: string;
  to?: string;
  customerId?: string;
  [key: string]: unknown;
}

export const invoicesService = {
  list(params?: InvoiceListParams): Promise<InvoiceListResponse> {
    return http.get<InvoiceListResponse>('/billing/invoices', params);
  },

  getById(id: string): Promise<Invoice> {
    return http.get<Invoice>(`/billing/invoices/${id}`);
  },

  issue(data: unknown): Promise<Invoice> {
    return http.post<Invoice>('/billing/invoices', data);
  },

  cancel(id: string): Promise<Invoice> {
    return http.post<Invoice>(`/billing/invoices/${id}/cancel`);
  },
};
