import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type ProductListParams, productsService } from '@/services/products.service';

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsService.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => productsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => productsService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

export function useDeactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
