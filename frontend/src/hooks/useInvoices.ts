import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ApiResponse, Invoice, InvoiceFilters } from '../types';

export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(filters.page));
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.status) params.set('status', filters.status);
      if (filters.taxRate !== undefined && filters.taxRate !== '') {
        params.set('taxRate', String(filters.taxRate));
      }
      if (filters.customer) params.set('customer', filters.customer);
      if (filters.search) params.set('search', filters.search);
      // single date maps to issueDate range for that day
      if (filters.date) {
        params.set('issueDateFrom', filters.date);
        params.set('issueDateTo', filters.date);
      } else {
        if (filters.issueDateFrom) params.set('issueDateFrom', filters.issueDateFrom);
        if (filters.issueDateTo) params.set('issueDateTo', filters.issueDateTo);
      }
      if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo);

      const { data } = await api.get<ApiResponse<Invoice[]>>(`/api/invoices?${params}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
