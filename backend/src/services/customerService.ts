import mongoose from 'mongoose';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';

export async function listCustomers() {
  return Customer.find().sort({ name: 1 }).lean();
}

export async function getCustomerProfile(id: string) {
  const customer = await Customer.findById(id).lean();
  if (!customer) return null;

  const objectId = new mongoose.Types.ObjectId(id);

  const [metrics] = await Invoice.aggregate([
    { $match: { customerId: objectId } },
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$amount' },
        totalTax: { $sum: '$tax' },
        invoiceCount: { $sum: 1 },
        outstanding: {
          $sum: {
            $cond: [{ $in: ['$status', ['Unpaid', 'Overdue']] }, '$total', 0],
          },
        },
      },
    },
  ]);

  const statusAgg = await Invoice.aggregate([
    { $match: { customerId: objectId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts: Record<string, number> = {
    Sent: 0, Unpaid: 0, Overdue: 0, Paid: 0, Void: 0, Draft: 0,
  };
  for (const s of statusAgg) {
    statusCounts[s._id as string] = s.count as number;
  }

  const invoices = await Invoice.find({ customerId: objectId })
    .sort({ issueDate: -1 })
    .lean();

  return {
    customer,
    metrics: metrics
      ? {
          totalBilled: metrics.totalBilled as number,
          totalTax: metrics.totalTax as number,
          invoiceCount: metrics.invoiceCount as number,
          outstanding: metrics.outstanding as number,
        }
      : { totalBilled: 0, totalTax: 0, invoiceCount: 0, outstanding: 0 },
    statusCounts,
    invoices,
  };
}
