import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInvoices } from '../hooks/useInvoices';
import { InvoiceTable } from '../components/InvoiceTable';
import { Pagination } from '../components/Pagination';
import { InvoiceModal } from '../components/InvoiceModal';
import { SummaryPanel } from '../components/SummaryPanel';
import type { Invoice, InvoiceStatus, TaxRate } from '../types';

// ── Dropdown filter button ────────────────────────────────────────────────────

interface DropdownOption { value: string; label: string }

function DropdownFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const active = !!value;
  const activeLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors whitespace-nowrap select-none ${
          active
            ? 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        }`}
      >
        {active ? activeLabel : label}
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1 overflow-hidden">
          <li>
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                !value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === opt.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Date filter input ─────────────────────────────────────────────────────────

function DateFilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 hover:border-gray-400 ${
        value
          ? 'border-blue-400 text-blue-600 bg-blue-50'
          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
      }`}
    />
  );
}

// ── Status options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'Sent', label: 'Sent' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Void', label: 'Void' },
  { value: 'Draft', label: 'Draft' },
];

const TAX_RATE_OPTIONS: DropdownOption[] = [
  { value: '0', label: '0%' },
  { value: '3', label: '3%' },
  { value: '5', label: '5%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function InvoiceList() {
  const [params, setParams] = useSearchParams();

  const page      = parseInt(params.get('page') ?? '1', 10);
  const sort      = params.get('sort') ?? '';
  const status    = params.get('status') ?? '';
  const taxRate   = params.get('taxRate') ?? '';
  const date      = params.get('date') ?? '';
  const search    = params.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data, isLoading, isFetching } = useInvoices({
    page,
    sort: sort || undefined,
    status: (status as InvoiceStatus) || undefined,
    taxRate: taxRate !== '' ? (Number(taxRate) as TaxRate) : undefined,
    date: date || undefined,
    search: search || undefined,
  });

  function setParam(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam('search', value), 300);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function handleSort(key: string) {
    const isAsc = sort === `${key}_asc`;
    const next  = isAsc ? `${key}_desc` : `${key}_asc`;
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('sort', next);
      p.delete('page');
      return p;
    });
  }

  function handlePageChange(newPage: number) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('page', String(newPage));
      return p;
    });
  }

  const invoices = data?.data ?? [];
  const total    = data?.meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50 py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* ── Header row ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Invoices</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSummaryOpen(true)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Summary
              </button>
              <button
                onClick={() => { setEditInvoice(null); setModalOpen(true); }}
                className="px-4 py-2 text-sm text-blue-600 bg-white border border-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                New invoice
              </button>
            </div>
          </div>

          {/* ── Filter row ───────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search invoice / customer"
                className="w-full px-5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              />
            </div>

            {/* Status dropdown */}
            <DropdownFilter
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => setParam('status', v)}
            />

            {/* Tax rate dropdown */}
            <DropdownFilter
              label="Tax rate"
              value={taxRate}
              options={TAX_RATE_OPTIONS}
              onChange={(v) => setParam('taxRate', v)}
            />

            {/* Date filter */}
            <DateFilterInput
              value={date}
              onChange={(v) => setParam('date', v)}
            />
          </div>

          {/* ── Table ────────────────────────────────────────────────── */}
          <div className={`transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <InvoiceTable
                invoices={invoices}
                sort={sort}
                onSortChange={handleSort}
                onEdit={(inv) => { setEditInvoice(inv); setModalOpen(true); }}
              />
            )}
          </div>

          {/* ── Pagination ───────────────────────────────────────────── */}
          <Pagination
            page={page}
            total={total}
            limit={20}
            onChange={handlePageChange}
          />
        </div>
      </div>

      {modalOpen && (
        <InvoiceModal invoice={editInvoice} onClose={() => setModalOpen(false)} />
      )}
      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
}
