import express, { type NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './db';
import invoiceRoutes from './routes/invoices';
import customerRoutes from './routes/customers';
import summaryRoutes from './routes/summary';
import { runSeed } from './seed';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoices';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/summary', summaryRoutes);

// One-shot seed endpoint — requires SEED_SECRET header to prevent accidental triggers
app.post('/api/seed', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const result = await runSeed();
    res.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed';
    res.status(500).json({ success: false, error: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Global error handler — must have 4 params so Express recognises it as error middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(err);
  res.status(500).json({ success: false, error: message });
});

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

export default app;
