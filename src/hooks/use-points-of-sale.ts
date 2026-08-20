import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type PointOfSaleListParams, pointsOfSaleService } from '@/services/points-of-sale.service';

export function usePointsOfSale(legalEntityId: string, params?: PointOfSaleListParams) {
  return useQuery({
    queryKey: queryKeys.pointsOfSale.list(legalEntityId, params),
    queryFn: () => pointsOfSaleService.list(legalEntityId, params),
    enabled: !!legalEntityId,
  });
}

export function usePointOfSale(id: string) {
  return useQuery({
    queryKey: queryKeys.pointsOfSale.detail(id),
    queryFn: () => pointsOfSaleService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePointOfSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ legalEntityId, data }: { legalEntityId: string; data: unknown }) =>
      pointsOfSaleService.create(legalEntityId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pointsOfSale.all });
      qc.invalidateQueries({ queryKey: queryKeys.legalEntities.all });
    },
  });
}

export function useUpdatePointOfSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      pointsOfSaleService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pointsOfSale.all });
      qc.invalidateQueries({ queryKey: queryKeys.pointsOfSale.detail(id) });
    },
  });
}

export function useDeactivatePointOfSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pointsOfSaleService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pointsOfSale.all });
    },
  });
}
