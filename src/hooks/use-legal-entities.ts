import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  type LegalEntityListParams,
  legalEntitiesService,
} from '@/services/legal-entities.service';

export function useLegalEntities(params?: LegalEntityListParams) {
  return useQuery({
    queryKey: queryKeys.legalEntities.list(params),
    queryFn: () => legalEntitiesService.list(params),
  });
}

export function useLegalEntity(id: string) {
  return useQuery({
    queryKey: queryKeys.legalEntities.detail(id),
    queryFn: () => legalEntitiesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => legalEntitiesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.legalEntities.all });
    },
  });
}

export function useUpdateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      legalEntitiesService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.legalEntities.all });
      qc.invalidateQueries({ queryKey: queryKeys.legalEntities.detail(id) });
    },
  });
}

export function useDeleteLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => legalEntitiesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.legalEntities.all });
    },
  });
}
