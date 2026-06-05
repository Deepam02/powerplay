import mongoose, { Document, Schema, Types } from 'mongoose';

export type TaxRate = 0 | 3 | 5 | 18 | 28;
export type InvoiceStatus = 'Sent' | 'Unpaid' | 'Overdue' | 'Paid' | 'Void' | 'Draft';

export interface IInvoice extends Document {
  invoiceId: string;
  customerId: Types.ObjectId;
  amount: number;
  taxRate: TaxRate;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, enum: [0, 3, 5, 18, 28] },
    tax: { type: Number },
    total: { type: Number },
    status: {
      type: String,
      required: true,
      enum: ['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft'],
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', function (next) {
  this.tax = round2(this.amount * this.taxRate / 100);
  this.total = round2(this.amount + this.tax);
  next();
});

invoiceSchema.index({ status: 1, issueDate: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ amount: 1 });
invoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
