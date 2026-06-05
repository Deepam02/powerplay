import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomer } from '../hooks/useCustomer';
import { StatusBadge } from '../components/StatusBadge';
import { InvoiceModal } from '../components/InvoiceModal';
import { fmt, fmtDate } from '../lib/api';
import type { InvoiceStatus, Invoice } from '../types';

const PILL_STATUSES: InvoiceStatus[] = ['Paid', 'Unpaid', 'Overdue', 'Draft'];

type SortKey = 'invoiceId' | 'total' | 'issueDate';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function sortInvoices(invoices: Invoice[], key: SortKey, asc: boolean): Invoice[] {
  return [...invoices].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (key === 'invoiceId') { av = a.invoiceId; bv = b.invoiceId; }
    else if (key === 'total') { av = a.total; bv = b.total; }
    else { av = new Date(a.issueDate).getTime(); bv = new Date(b.issueDate).getTime(); }
    return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
}

export function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useCustomer(id ?? '');
  const [activeStatus, setActiveStatus] = useState<InvoiceStatus | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('issueDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Customer not found.</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">← Back to invoices</Link>
      </div>
    );
  }

  const { customer, metrics, statusCounts, invoices } = data;

  const filtered = activeStatus ? invoices.filter((inv) => inv.status === activeStatus) : invoices;
  const sorted = sortInvoices(filtered, sortKey, sortAsc);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ field }: { field: SortKey }) {
    const active = sortKey === field;
    return (
      <span className={`ml-1 text-xs ${active ? 'text-blue-500' : 'text-gray-300'}`}>
        {active ? (sortAsc ? '↑' : '↓') : '↕'}
      </span>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-white sm:bg-gray-50 py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Breadcrumb + Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
              <Link to="/" className="hover:text-gray-600 transition-colors">Invoices</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">{customer.name}</span>
            </nav>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                {getInitials(customer.name)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
                <p className="text-sm text-gray-500">{customer.company}</p>
              </div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-gray-100">
            {[
              { label: 'Total billed', value: fmt(metrics.totalBilled) },
              { label: 'Total tax', value: fmt(metrics.totalTax) },
              { label: 'Outstanding', value: fmt(metrics.outstanding) },
              { label: '# Invoices', value: metrics.invoiceCount.toString() },
            ].map((m, i) => (
              <div
                key={m.label}
                className={`px-6 py-5 bg-stone-50 ${i < 3 ? 'border-r border-gray-100' : ''}`}
              >
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className="text-2xl font-semibold text-gray-900 truncate">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b border-gray-100">
            {PILL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(activeStatus === s ? null : s)}
                className={`px-3.5 py-1 rounded-full text-sm font-medium border transition-colors ${
                  activeStatus === s
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s}
                <span className="ml-1.5 text-xs opacity-70">{statusCounts[s] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Invoice history table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th
                    className="px-5 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('invoiceId')}
                  >
                    Invoice <SortIcon field="invoiceId" />
                  </th>
                  <th
                    className="px-5 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('total')}
                  >
                    Total <SortIcon field="total" />
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">
                    Status
                  </th>
                  <th
                    className="px-5 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('issueDate')}
                  >
                    Issued <SortIcon field="issueDate" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                      No invoices found
                    </td>
                  </tr>
                )}
                {sorted.map((inv) => (
                  <tr key={inv._id} className="group hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {inv.invoiceId}
                        <button
                          onClick={() => setEditInvoice(inv)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 p-0.5 rounded"
                          aria-label="Edit invoice"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {fmt(inv.total)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(inv.issueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

    {editInvoice && (
      <InvoiceModal invoice={editInvoice} onClose={() => setEditInvoice(null)} />
    )}
    </>
  );
}
