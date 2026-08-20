import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type PriceListListParams, priceListsService } from '@/services/price-lists.service';

export function usePriceLists(params?: PriceListListParams) {
  return useQuery({
    queryKey: queryKeys.priceLists.list(params),
    queryFn: () => priceListsService.list(params),
  });
}

export function usePriceList(id: string) {
  return useQuery({
    queryKey: queryKeys.priceLists.detail(id),
    queryFn: () => priceListsService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => priceListsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
    },
  });
}

export function useUpdatePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => priceListsService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.detail(id) });
    },
  });
}

export function useDeletePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => priceListsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
    },
  });
}

export function useActivatePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => priceListsService.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
    },
  });
}

export function useUpsertPriceListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      priceListsService.upsertItem(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.detail(id) });
    },
  });
}

export function useDeletePriceListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      priceListsService.deleteItem(id, productId),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.all });
      qc.invalidateQueries({ queryKey: queryKeys.priceLists.detail(id) });
    },
  });
}
