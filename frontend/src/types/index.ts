export type TaxRate = 0 | 3 | 5 | 18 | 28;
export type InvoiceStatus = 'Sent' | 'Unpaid' | 'Overdue' | 'Paid' | 'Void' | 'Draft';

export interface Customer {
  _id: string;
  name: string;
  company: string;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  customerId: Customer | string;
  amount: number;
  taxRate: TaxRate;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CustomerProfile {
  customer: Customer;
  metrics: {
    totalBilled: number;
    totalTax: number;
    invoiceCount: number;
    outstanding: number;
  };
  statusCounts: Record<InvoiceStatus, number>;
  invoices: Invoice[];
}

export interface SummaryData {
  totalBilled: number;
  totalTax: number;
  invoiceCount: number;
  customerCount: number;
  top5Customers: Array<{
    _id: string;
    totalBilled: number;
    customerName: string;
    company: string;
  }>;
}

export interface InvoiceFilters {
  page: number;
  sort?: string;
  status?: InvoiceStatus | '';
  taxRate?: number | '';
  customer?: string;
  date?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}
