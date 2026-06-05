import { Link } from 'react-router-dom';
import type { Invoice, Customer } from '../types';
import { StatusBadge } from './StatusBadge';
import { fmt } from '../lib/api';

type SortKey = 'invoiceId' | 'customer' | 'amount' | 'total';

interface Props {
  invoices: Invoice[];
  sort?: string;
  onSortChange: (key: string) => void;
  onEdit: (invoice: Invoice) => void;
}

function SortBtn({ field, sort, children }: { field: SortKey; sort?: string; children: React.ReactNode }) {
  const active = sort?.startsWith(field);
  const isAsc  = sort === `${field}_asc`;
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <span className={`text-xs leading-none ${active ? 'text-blue-500' : 'text-gray-300'}`}>
        {active ? (isAsc ? '↑' : '↓') : '↕'}
      </span>
    </span>
  );
}

function getCustomer(inv: Invoice): Customer | null {
  if (typeof inv.customerId === 'object' && inv.customerId !== null) {
    return inv.customerId as Customer;
  }
  return null;
}

export function InvoiceTable({ invoices, sort, onSortChange, onEdit }: Props) {
  const thBase = 'px-5 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap';
  const thSort = `${thBase} cursor-pointer select-none hover:text-gray-900 transition-colors`;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            <th className={thSort} onClick={() => onSortChange('invoiceId')}>
              <SortBtn field="invoiceId" sort={sort}>Invoice</SortBtn>
            </th>
            <th className={thSort} onClick={() => onSortChange('customer')}>
              <SortBtn field="customer" sort={sort}>Customer</SortBtn>
            </th>
            <th className={thSort} onClick={() => onSortChange('amount')}>
              <SortBtn field="amount" sort={sort}>Amount</SortBtn>
            </th>
            <th className={thBase}>Tax%</th>
            <th className={thSort} onClick={() => onSortChange('total')}>
              <SortBtn field="total" sort={sort}>Total</SortBtn>
            </th>
            <th className={thBase}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-14 text-center text-gray-400 text-sm">
                No invoices found
              </td>
            </tr>
          )}
          {invoices.map((inv) => {
            const customer = getCustomer(inv);
            return (
              <tr
                key={inv._id}
                className="group hover:bg-gray-50/70 transition-colors"
              >
                <td className="px-5 py-3.5 text-sm font-mono text-gray-600 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {inv.invoiceId}
                    {/* edit button, visible on row hover */}
                    <button
                      onClick={() => onEdit(inv)}
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
                <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                  {customer ? (
                    <Link
                      to={`/customers/${customer._id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                  {fmt(inv.amount)}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                  {inv.taxRate}%
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {fmt(inv.total)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
