import type { ImportedProductListResponse, SyncResult } from '@/types/api';
import { http } from './http';

export interface ImportedProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  [key: string]: unknown;
}

export const pricingService = {
  sync(): Promise<SyncResult> {
    return http.post<SyncResult>('/pricing/paraiso-muebles/sync');
  },

  listImported(params?: ImportedProductListParams): Promise<ImportedProductListResponse> {
    return http.get<ImportedProductListResponse>('/pricing/paraiso-muebles/products', params);
  },
};
