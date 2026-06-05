import type { InvoiceStatus } from '../types';

const STATUSES: InvoiceStatus[] = ['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft'];

interface Props {
  status: string;
  issueDateFrom: string;
  issueDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
  onStatusChange: (v: string) => void;
  onIssueDateFromChange: (v: string) => void;
  onIssueDateToChange: (v: string) => void;
  onDueDateFromChange: (v: string) => void;
  onDueDateToChange: (v: string) => void;
}

export function FilterBar({
  status,
  issueDateFrom,
  issueDateTo,
  dueDateFrom,
  dueDateTo,
  onStatusChange,
  onIssueDateFromChange,
  onIssueDateToChange,
  onDueDateFromChange,
  onDueDateToChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 whitespace-nowrap">Issue:</span>
        <input
          type="date"
          value={issueDateFrom}
          onChange={(e) => onIssueDateFromChange(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="From"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={issueDateTo}
          onChange={(e) => onIssueDateToChange(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="To"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 whitespace-nowrap">Due:</span>
        <input
          type="date"
          value={dueDateFrom}
          onChange={(e) => onDueDateFromChange(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="From"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={dueDateTo}
          onChange={(e) => onDueDateToChange(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="To"
        />
      </div>
    </div>
  );
}
