import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse, CustomerProfile } from '../types';

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CustomerProfile>>(`/api/customers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
