import type { PointOfSale, PointOfSaleListResponse } from '@/types/api';
import { http } from './http';

export interface PointOfSaleListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  [key: string]: unknown;
}

export const pointsOfSaleService = {
  list(legalEntityId: string, params?: PointOfSaleListParams): Promise<PointOfSaleListResponse> {
    return http.get<PointOfSaleListResponse>(
      `/billing/legal-entities/${legalEntityId}/points-of-sale`,
      params,
    );
  },

  getById(id: string): Promise<PointOfSale> {
    return http.get<PointOfSale>(`/billing/points-of-sale/${id}`);
  },

  create(legalEntityId: string, data: unknown): Promise<PointOfSale> {
    return http.post<PointOfSale>(`/billing/legal-entities/${legalEntityId}/points-of-sale`, data);
  },

  update(id: string, data: unknown): Promise<PointOfSale> {
    return http.patch<PointOfSale>(`/billing/points-of-sale/${id}`, data);
  },

  deactivate(id: string): Promise<PointOfSale> {
    return http.post<PointOfSale>(`/billing/points-of-sale/${id}/deactivate`);
  },
};
