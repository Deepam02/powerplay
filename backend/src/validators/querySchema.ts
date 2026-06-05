import { z } from 'zod';

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      'amount_asc', 'amount_desc',
      'dueDate_asc', 'dueDate_desc',
      'invoiceId_asc', 'invoiceId_desc',
      'customer_asc', 'customer_desc',
      'total_asc', 'total_desc',
    ])
    .optional(),
  status: z
    .enum(['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft'])
    .optional(),
  taxRate: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.union([z.literal(0), z.literal(3), z.literal(5), z.literal(18), z.literal(28)]).optional()
  ),
  customer: z.string().optional(),
  issueDateFrom: z.string().optional(),
  issueDateTo: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  search: z.string().optional(),
});

export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
