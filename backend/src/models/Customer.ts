import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  company: string;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    company: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
