import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { type CustomerListParams, customersService } from '@/services/customers.service';

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customersService.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => customersService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => customersService.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
