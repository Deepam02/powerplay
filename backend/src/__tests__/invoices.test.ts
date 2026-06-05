import request from 'supertest';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { startMemoryDB, stopMemoryDB, clearCollections } from './setup';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import invoiceRoutes from '../routes/invoices';
import customerRoutes from '../routes/customers';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);

const CUSTOMERS = [
  { name: 'Alice Kumar', company: 'Alpha Corp' },
  { name: 'Bob Singh', company: 'Beta Ltd' },
  { name: 'Carol Patel', company: 'Gamma Inc' },
  { name: 'David Rao', company: 'Delta Co' },
  { name: 'Eva Sharma', company: 'Epsilon Tech' },
];

interface FixtureInvoice {
  invoiceId: string;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  taxRate: 0 | 3 | 5 | 18 | 28;
  status: 'Sent' | 'Unpaid' | 'Overdue' | 'Paid' | 'Void' | 'Draft';
  issueDate: Date;
  dueDate: Date;
}

let customerIds: mongoose.Types.ObjectId[] = [];

async function seedFixture() {
  const createdCustomers = await Customer.insertMany(CUSTOMERS);
  customerIds = createdCustomers.map((c) => c._id as mongoose.Types.ObjectId);

  const statuses: Array<'Sent' | 'Unpaid' | 'Overdue' | 'Paid' | 'Void'> = [
    'Sent', 'Unpaid', 'Overdue', 'Paid', 'Void',
  ];
  const taxRates: Array<0 | 3 | 5 | 18 | 28> = [0, 3, 5, 18, 28];

  const invoices: FixtureInvoice[] = [];
  let idx = 0;
  for (let ci = 0; ci < 5; ci++) {
    for (let si = 0; si < 5; si++) {
      const amount = 1000 * (ci + 1) + si * 100;
      const taxRate = taxRates[si];
      const tax = Math.round(amount * taxRate) / 100;
      const total = amount + tax;
      invoices.push({
        invoiceId: `TEST-${String(idx).padStart(4, '0')}`,
        customerId: customerIds[ci],
        amount,
        taxRate,
        status: statuses[si],
        issueDate: new Date(`2025-0${si + 1}-15`),
        dueDate: new Date(`2025-0${si + 1}-30`),
      });
      void total;
      idx++;
    }
  }

  for (const inv of invoices) {
    const doc = new Invoice(inv);
    await doc.save();
  }
}

beforeAll(async () => {
  await startMemoryDB();
  await seedFixture();
});

afterAll(async () => {
  await stopMemoryDB();
});

describe('GET /api/invoices', () => {
  test('1. pagination returns correct page size and total', async () => {
    const res = await request(app).get('/api/invoices?page=1&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.meta.total).toBe(25);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(20);
  });

  test('1b. second page returns remaining records', async () => {
    const res = await request(app).get('/api/invoices?page=2&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('2. filter by status returns only matching records', async () => {
    const res = await request(app).get('/api/invoices?status=Paid');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const inv of res.body.data) {
      expect(inv.status).toBe('Paid');
    }
  });

  test('3. filter by date range is inclusive on both ends', async () => {
    const res = await request(app).get(
      '/api/invoices?issueDateFrom=2025-01-15&issueDateTo=2025-02-15'
    );
    expect(res.status).toBe(200);
    for (const inv of res.body.data) {
      const d = new Date(inv.issueDate);
      expect(d.getTime()).toBeGreaterThanOrEqual(new Date('2025-01-15').getTime());
      expect(d.getTime()).toBeLessThanOrEqual(new Date('2025-02-15T23:59:59.999Z').getTime());
    }
  });
});

describe('POST /api/invoices', () => {
  test('5. rejects missing required fields with 400', async () => {
    const res = await request(app).post('/api/invoices').send({ amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('6. rejects taxRate not in allowed set with 400', async () => {
    const res = await request(app).post('/api/invoices').send({
      customerId: customerIds[0].toString(),
      amount: 500,
      taxRate: 7,
      issueDate: '2025-01-01',
      dueDate: '2025-02-01',
      status: 'Draft',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/customers/:id', () => {
  test('4. aggregated totals match the fixture data', async () => {
    const customerId = customerIds[0].toString();
    const res = await request(app).get(`/api/customers/${customerId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { metrics, invoices } = res.body.data;
    const manualTotal = invoices.reduce(
      (sum: number, inv: { amount: number }) => sum + inv.amount,
      0
    );
    expect(metrics.totalBilled).toBeCloseTo(manualTotal, 1);
    expect(metrics.invoiceCount).toBe(5);
  });
});
