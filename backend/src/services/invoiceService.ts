import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import type { InvoiceQuery } from '../validators/querySchema';
import type { InvoiceBody } from '../validators/invoiceSchema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the right regex pattern for invoice ID matching:
 *
 *  "6598015"   (pure digits)   → "^INV-6598015"   prefix on the numeric part
 *  "659"       (pure digits)   → "^INV-659"        still a prefix – works for any ID whose
 *                                                   number starts with those digits
 *  "INV-659"   (INV prefix)   → "^INV-659"        explicit prefix match
 *  "inv659"    (no dash)      → "^INV-659"        normalised: strip "inv", prepend "^INV-"
 *  "sara"      (plain text)   → "sara"            substring match (customer name use-case
 *                                                   shouldn't reach here, but safe fallback)
 */
function buildInvoiceIdRegex(raw: string, escaped: string): string {
  // Pure digits: user typed the numeric portion directly
  if (/^\d+$/.test(raw)) return `^INV-${escaped}`;

  // Starts with "INV" (with or without dash, any case)
  if (/^inv/i.test(raw)) {
    // Normalise "inv659" → "^INV-659" so missing dash still matches
    const withoutPrefix = raw.replace(/^inv-?/i, '');
    const safeRest = escapeRegex(withoutPrefix);
    return `^INV-${safeRest}`;
  }

  // Anything else (partial text, mixed): substring / contains match
  return escaped;
}

function buildSortStage(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'amount_asc':    return { amount: 1 };
    case 'amount_desc':   return { amount: -1 };
    case 'dueDate_asc':   return { dueDate: 1 };
    case 'dueDate_desc':  return { dueDate: -1 };
    case 'invoiceId_asc': return { invoiceId: 1 };
    case 'invoiceId_desc':return { invoiceId: -1 };
    case 'total_asc':     return { total: 1 };
    case 'total_desc':    return { total: -1 };
    case 'customer_asc':  return { 'customer.name': 1 };
    case 'customer_desc': return { 'customer.name': -1 };
    default:              return { issueDate: -1 };
  }
}

export async function listInvoices(query: InvoiceQuery) {
  const { page, limit, sort, status, taxRate, issueDateFrom, issueDateTo,
    dueDateFrom, dueDateTo } = query;

  const customer = query.customer?.trim() || undefined;
  const search = query.search?.trim() || undefined;

  // customer sort requires a $lookup join even with no search term
  const needsCustomerJoin = !!(customer || search || sort?.startsWith('customer'));

  const invoiceMatch: Record<string, unknown> = {};
  if (status) invoiceMatch['status'] = status;
  if (taxRate !== undefined) invoiceMatch['taxRate'] = taxRate;
  if (issueDateFrom || issueDateTo) {
    invoiceMatch['issueDate'] = {
      ...(issueDateFrom ? { $gte: new Date(issueDateFrom) } : {}),
      ...(issueDateTo ? { $lte: new Date(issueDateTo + 'T23:59:59.999Z') } : {}),
    };
  }
  if (dueDateFrom || dueDateTo) {
    invoiceMatch['dueDate'] = {
      ...(dueDateFrom ? { $gte: new Date(dueDateFrom) } : {}),
      ...(dueDateTo ? { $lte: new Date(dueDateTo + 'T23:59:59.999Z') } : {}),
    };
  }

  if (needsCustomerJoin) {
    const pipeline: mongoose.PipelineStage[] = [
      { $match: invoiceMatch },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      // Mirror what .populate() does: put the customer object back into customerId
      // so the frontend shape is identical whether this path or the find() path runs.
      { $set: { customerId: { _id: '$customer._id', name: '$customer.name', company: '$customer.company' } } },
    ];

    const postJoinMatch: Record<string, unknown> = {};
    if (customer) {
      postJoinMatch['customer.name'] = { $regex: escapeRegex(customer), $options: 'i' };
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      postJoinMatch['$or'] = [
        { invoiceId: { $regex: buildInvoiceIdRegex(search, safeSearch), $options: 'i' } },
        { 'customer.name': { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (Object.keys(postJoinMatch).length) {
      pipeline.push({ $match: postJoinMatch });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const [countResult] = await Invoice.aggregate(countPipeline);
    const total = countResult?.total ?? 0;

    pipeline.push(
      { $sort: buildSortStage(sort) },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const data = await Invoice.aggregate(pipeline);
    return { data, total };
  }

  const total = await Invoice.countDocuments(invoiceMatch);
  const data = await Invoice.find(invoiceMatch)
    .populate('customerId', 'name company')
    .sort(buildSortStage(sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { data, total };
}

export async function getInvoiceById(id: string) {
  return Invoice.findById(id).populate('customerId', 'name company').lean();
}

export async function createInvoice(body: InvoiceBody) {
  const invoiceId = 'INV-' + Math.floor(1000000 + Math.random() * 9000000).toString();
  const invoice = new Invoice({
    invoiceId,
    customerId: new mongoose.Types.ObjectId(body.customerId),
    amount: body.amount,
    taxRate: body.taxRate,
    status: body.status,
    issueDate: new Date(body.issueDate),
    dueDate: new Date(body.dueDate),
  });
  await invoice.save();
  return invoice.populate('customerId', 'name company');
}

export async function updateInvoice(id: string, body: InvoiceBody) {
  const invoice = await Invoice.findById(id);
  if (!invoice) return null;

  invoice.customerId = new mongoose.Types.ObjectId(body.customerId) as unknown as typeof invoice.customerId;
  invoice.amount = body.amount;
  invoice.taxRate = body.taxRate as typeof invoice.taxRate;
  invoice.status = body.status as typeof invoice.status;
  invoice.issueDate = new Date(body.issueDate);
  invoice.dueDate = new Date(body.dueDate);

  await invoice.save();
  return invoice.populate('customerId', 'name company');
}

export async function deleteInvoice(id: string) {
  return Invoice.findByIdAndDelete(id);
}
