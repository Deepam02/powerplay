import { useSummary } from '../hooks/useSummary';
import { fmt } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SummaryPanel({ open, onClose }: Props) {
  const { data, isLoading } = useSummary();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500/70" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Summary</h2>
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

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {data && (
            <>
              {/* 4 stat cards in a row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total billed" value={fmt(data.totalBilled)} />
                <StatCard label="Total tax" value={fmt(data.totalTax)} />
                <StatCard label="Invoices" value={data.invoiceCount.toLocaleString('en-IN')} large />
                <StatCard label="Customers" value={data.customerCount.toLocaleString('en-IN')} large />
              </div>

              {/* Top customers bar chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Top customers by value</h3>
                <div className="space-y-3">
                  {data.top5Customers.map((c) => {
                    const max = Math.max(...data.top5Customers.map((x) => x.totalBilled));
                    const pct = max === 0 ? 0 : (c.totalBilled / max) * 100;
                    return (
                      <div key={c._id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-32 flex-shrink-0 truncate">
                          {c.customerName}
                        </span>
                        <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-200 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
                          {fmt(c.totalBilled)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="bg-stone-50 border border-gray-100 rounded-xl px-4 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold text-gray-900 truncate ${large ? 'text-3xl' : 'text-lg'}`}>
        {value}
      </p>
    </div>
  );
}
