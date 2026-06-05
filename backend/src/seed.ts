import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Customer } from './models/Customer';
import { Invoice } from './models/Invoice';

interface SeedRecord {
  invoiceId: string;
  customer: string;
  company: string;
  amount: number;
  taxRate: number;
  tax: number;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function seed(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);

  const dataPath = path.join(__dirname, '..', 'seed-data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const records: SeedRecord[] = JSON.parse(raw);

  const uniqueCustomers = new Map<string, string>();
  for (const r of records) {
    if (!uniqueCustomers.has(r.customer)) {
      uniqueCustomers.set(r.customer, r.company);
    }
  }

  const customerIdMap = new Map<string, mongoose.Types.ObjectId>();

  for (const [name, company] of uniqueCustomers) {
    const result = await Customer.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, company } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    customerIdMap.set(name, result._id as mongoose.Types.ObjectId);
  }

  let invoiceCount = 0;
  for (const r of records) {
    const customerId = customerIdMap.get(r.customer);
    if (!customerId) continue;

    const tax = round2(r.amount * r.taxRate / 100);
    const total = round2(r.amount + tax);

    await Invoice.updateOne(
      { invoiceId: r.invoiceId },
      {
        $set: {
          customerId,
          amount: r.amount,
          taxRate: r.taxRate,
          tax,
          total,
          status: r.status,
          issueDate: new Date(r.issueDate),
          dueDate: new Date(r.dueDate),
        },
      },
      { upsert: true }
    );
    invoiceCount++;
  }

  console.log(`Seeded ${uniqueCustomers.size} customers, ${invoiceCount} invoices`);
  await mongoose.disconnect();
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoices';
seed(MONGO_URI).catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
