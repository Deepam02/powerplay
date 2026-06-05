import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse, Customer } from '../types';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Customer[]>>('/api/customers');
      return data.data;
    },
    staleTime: 60_000,
  });
}
