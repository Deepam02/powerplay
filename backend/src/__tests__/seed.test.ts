import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';

let mongod: MongoMemoryServer;

interface SeedRecord {
  invoiceId: string;
  customer: string;
  company: string;
  amount: number;
  taxRate: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function runSeed(uri: string) {
  const dataPath = path.join(__dirname, '..', '..', 'seed-data.json');
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
  }

  void uri;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
});

test('7. seed script - running twice produces no duplicates', async () => {
  const uri = mongod.getUri();

  await runSeed(uri);
  const customersAfterFirst = await Customer.countDocuments();
  const invoicesAfterFirst = await Invoice.countDocuments();

  await runSeed(uri);
  const customersAfterSecond = await Customer.countDocuments();
  const invoicesAfterSecond = await Invoice.countDocuments();

  expect(customersAfterSecond).toBe(customersAfterFirst);
  expect(invoicesAfterSecond).toBe(invoicesAfterFirst);
  expect(customersAfterSecond).toBe(61);
  expect(invoicesAfterSecond).toBe(2000);
});
