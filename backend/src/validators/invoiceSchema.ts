import { z } from 'zod';

export const invoiceBodySchema = z.object({
  customerId: z.string().min(1, 'customerId is required'),
  amount: z.number({ required_error: 'amount is required' }).nonnegative(),
  taxRate: z.union([
    z.literal(0),
    z.literal(3),
    z.literal(5),
    z.literal(18),
    z.literal(28),
  ]),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD'),
  status: z.enum(['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft']),
});

export type InvoiceBody = z.infer<typeof invoiceBodySchema>;
