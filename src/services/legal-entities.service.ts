import type { LegalEntity, LegalEntityListResponse } from '@/types/api';
import { http } from './http';

export interface LegalEntityListParams {
  page?: number;
  limit?: number;
  q?: string;
  [key: string]: unknown;
}

export const legalEntitiesService = {
  list(params?: LegalEntityListParams): Promise<LegalEntityListResponse> {
    return http.get<LegalEntityListResponse>('/billing/legal-entities', params);
  },

  getById(id: string): Promise<LegalEntity> {
    return http.get<LegalEntity>(`/billing/legal-entities/${id}`);
  },

  create(data: unknown): Promise<LegalEntity> {
    return http.post<LegalEntity>('/billing/legal-entities', data);
  },

  update(id: string, data: unknown): Promise<LegalEntity> {
    return http.patch<LegalEntity>(`/billing/legal-entities/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(`/billing/legal-entities/${id}`);
  },
};
