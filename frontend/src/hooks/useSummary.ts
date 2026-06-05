import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse, SummaryData } from '../types';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SummaryData>>('/api/summary');
      return data.data;
    },
    staleTime: 30_000,
  });
}
