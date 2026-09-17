import type { PaginationParams } from '@/types/pagination';

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  legalEntities: {
    all: ['legalEntities'] as const,
    list: (params?: PaginationParams & { q?: string }) =>
      [...queryKeys.legalEntities.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.legalEntities.all, 'detail', id] as const,
  },

  pointsOfSale: {
    all: ['pointsOfSale'] as const,
    list: (legalEntityId: string, params?: PaginationParams & { status?: string }) =>
      [...queryKeys.pointsOfSale.all, 'list', legalEntityId, params] as const,
    detail: (id: string) => [...queryKeys.pointsOfSale.all, 'detail', id] as const,
  },

  customers: {
    all: ['customers'] as const,
    list: (params?: PaginationParams & { q?: string; ivaCondition?: string }) =>
      [...queryKeys.customers.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
  },

  products: {
    all: ['products'] as const,
    list: (params?: PaginationParams & { q?: string; type?: string; isActive?: boolean }) =>
      [...queryKeys.products.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
  },

  priceLists: {
    all: ['priceLists'] as const,
    list: (params?: PaginationParams) => [...queryKeys.priceLists.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.priceLists.all, 'detail', id] as const,
  },

  invoices: {
    all: ['invoices'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.invoices.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },

  pricing: {
    all: ['pricing'] as const,
    importedProducts: (params?: Record<string, unknown>) =>
      [...queryKeys.pricing.all, 'importedProducts', params] as const,
  },

  tasks: {
    all: ['tasks'] as const,
    types: ['tasks', 'types'] as const,
    list: (groupId: string, params?: { status?: string; priority?: string }) =>
      [...queryKeys.tasks.all, 'list', groupId, params] as const,
    detail: (groupId: string, id: string) =>
      [...queryKeys.tasks.all, 'detail', groupId, id] as const,
  },
} as const;
