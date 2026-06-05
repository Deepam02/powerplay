import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCustomers } from '../hooks/useCustomers';
import type { Invoice, InvoiceStatus, TaxRate, Customer } from '../types';

const TAX_RATES: TaxRate[] = [0, 3, 5, 18, 28];
const STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Unpaid', 'Overdue', 'Paid', 'Void'];

function toISO(d: string | Date | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

interface Props {
  invoice?: Invoice | null;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: Props) {
  const qc = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    company: '',
    amount: '0',
    taxRate: 18 as TaxRate,
    issueDate: toISO(new Date()),
    dueDate: '',
    status: 'Draft' as InvoiceStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      const cust =
        typeof invoice.customerId === 'object'
          ? (invoice.customerId as Customer)
          : customers.find((c) => c._id === invoice.customerId);
      setForm({
        customerId: typeof invoice.customerId === 'object'
          ? (invoice.customerId as Customer)._id
          : String(invoice.customerId),
        company: cust?.company ?? '',
        amount: String(invoice.amount),
        taxRate: invoice.taxRate,
        issueDate: toISO(invoice.issueDate),
        dueDate: toISO(invoice.dueDate),
        status: invoice.status,
      });
      setCustomerSearch(
        typeof invoice.customerId === 'object'
          ? (invoice.customerId as Customer).name
          : cust?.name ?? ''
      );
    }
  }, [invoice, customers]);

  const amount = parseFloat(form.amount) || 0;
  const tax = Math.round(amount * form.taxRate) / 100;
  const total = amount + tax;

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  function selectCustomer(c: Customer) {
    setForm((f) => ({ ...f, customerId: c._id, company: c.company }));
    setCustomerSearch(c.name);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        customerId: form.customerId,
        amount: parseFloat(form.amount),
        taxRate: form.taxRate,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        status: form.status,
      };
      if (invoice) {
        await api.put(`/api/invoices/${invoice._id}`, body);
      } else {
        await api.post('/api/invoices', body);
      }
      await qc.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save invoice';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white text-gray-800 transition-colors';
  const selectCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-9 cursor-pointer bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white transition-colors';
  const dateCls = `${inputCls} cursor-pointer hover:border-gray-400 hover:bg-gray-50`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500/70" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {invoice ? 'Edit invoice' : 'New invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Customer */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setForm((f) => ({ ...f, customerId: '', company: '' }));
              }}
              onFocus={() => setShowDropdown(true)}
              className={inputCls}
              placeholder="Search customer..."
              required
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.slice(0, 10).map((c) => (
                  <li
                    key={c._id}
                    onClick={() => selectCustomer(c)}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{c.company}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company (auto-filled)
            </label>
            <input
              type="text"
              value={form.company}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-stone-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Amount + Tax Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
              <div className="relative">
                <select
                  value={form.taxRate}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) as TaxRate }))}
                  className={selectCls}
                >
                  {TAX_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
                <Chevron />
              </div>
            </div>
          </div>

          {/* Issue Date + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                className={dateCls}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={dateCls}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
                className={selectCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Tax / Total preview */}
          <div className="bg-stone-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-600">
            Tax: <span className="font-semibold text-gray-800">₹{tax.toFixed(2)}</span>
            <span className="mx-2 text-gray-300">·</span>
            Total: <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.customerId}
              className="px-5 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-500 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  );
}
