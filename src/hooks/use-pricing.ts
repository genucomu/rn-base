import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type ImportedProductListParams, pricingService } from '@/services/pricing.service';

export function useImportedProducts(params?: ImportedProductListParams) {
  return useQuery({
    queryKey: queryKeys.pricing.importedProducts(params as Record<string, unknown>),
    queryFn: () => pricingService.listImported(params),
  });
}

export function useSyncCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => pricingService.sync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pricing.all });
    },
  });
}
