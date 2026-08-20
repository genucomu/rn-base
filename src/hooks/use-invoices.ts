import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type InvoiceListParams, invoicesService } from '@/services/invoices.service';

export function useInvoices(params?: InvoiceListParams) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params as Record<string, unknown>),
    queryFn: () => invoicesService.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => invoicesService.issue(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}
