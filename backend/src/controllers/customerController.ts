import type { Request, Response } from 'express';
import * as customerService from '../services/customerService';

export async function list(_req: Request, res: Response): Promise<void> {
  const customers = await customerService.listCustomers();
  res.json({ success: true, data: customers });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await customerService.getCustomerProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ success: false, error: 'Customer not found' });
    return;
  }
  res.json({ success: true, data: profile });
}
