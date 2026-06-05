import type { Request, Response } from 'express';
import * as summaryService from '../services/summaryService';

export async function get(_req: Request, res: Response): Promise<void> {
  const summary = await summaryService.getSummary();
  res.json({ success: true, data: summary });
}
