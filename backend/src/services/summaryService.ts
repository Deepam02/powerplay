import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';

export async function getSummary() {
  const [global] = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$amount' },
        totalTax: { $sum: '$tax' },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  const customerCount = await Customer.countDocuments();

  const top5 = await Invoice.aggregate([
    { $group: { _id: '$customerId', totalBilled: { $sum: '$amount' } } },
    { $sort: { totalBilled: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 1,
        totalBilled: 1,
        customerName: '$customer.name',
        company: '$customer.company',
      },
    },
  ]);

  return {
    totalBilled: global?.totalBilled ?? 0,
    totalTax: global?.totalTax ?? 0,
    invoiceCount: global?.invoiceCount ?? 0,
    customerCount,
    top5Customers: top5,
  };
}
