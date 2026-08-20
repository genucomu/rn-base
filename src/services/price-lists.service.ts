import type {
  PriceList,
  PriceListItem,
  PriceListListResponse,
  PriceListSummary,
} from '@/types/api';
import { http } from './http';

export interface PriceListListParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export const priceListsService = {
  list(params?: PriceListListParams): Promise<PriceListListResponse> {
    return http.get<PriceListListResponse>('/billing/price-lists', params);
  },

  getById(id: string): Promise<PriceList> {
    return http.get<PriceList>(`/billing/price-lists/${id}`);
  },

  create(data: unknown): Promise<PriceListSummary> {
    return http.post<PriceListSummary>('/billing/price-lists', data);
  },

  update(id: string, data: unknown): Promise<PriceListSummary> {
    return http.patch<PriceListSummary>(`/billing/price-lists/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(`/billing/price-lists/${id}`);
  },

  activate(id: string): Promise<PriceList> {
    return http.post<PriceList>(`/billing/price-lists/${id}/activate`);
  },

  upsertItem(id: string, data: unknown): Promise<PriceListItem> {
    return http.post<PriceListItem>(`/billing/price-lists/${id}/items`, data);
  },

  deleteItem(id: string, productId: string): Promise<void> {
    return http.delete<void>(`/billing/price-lists/${id}/items/${productId}`);
  },
};
