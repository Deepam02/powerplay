import type { InvoiceStatus } from '../types';

const COLOR_MAP: Record<InvoiceStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-800',
  Sent: 'bg-blue-100 text-blue-800',
  Unpaid: 'bg-amber-100 text-amber-800',
  Overdue: 'bg-red-100 text-red-800',
  Void: 'bg-gray-100 text-gray-600',
  Draft: 'bg-slate-100 text-slate-600',
};

interface Props {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[status]}`}
    >
      {status}
    </span>
  );
}
