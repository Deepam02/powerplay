import type { Request, Response } from 'express';
import { invoiceQuerySchema } from '../validators/querySchema';
import { invoiceBodySchema } from '../validators/invoiceSchema';
import * as invoiceService from '../services/invoiceService';

export async function list(req: Request, res: Response): Promise<void> {
  const parsed = invoiceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  try {
    const { page, limit } = parsed.data;
    const { data, total } = await invoiceService.listInvoices(parsed.data);
    res.json({ success: true, data, meta: { page, limit, total } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: invoice });
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = invoiceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const invoice = await invoiceService.createInvoice(parsed.data);
  res.status(201).json({ success: true, data: invoice });
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = invoiceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const invoice = await invoiceService.updateInvoice(req.params.id, parsed.data);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: invoice });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const invoice = await invoiceService.deleteInvoice(req.params.id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: null });
}
