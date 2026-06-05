import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse, Invoice } from '../types';

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
