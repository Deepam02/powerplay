interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: Props) {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const arrowBase =
    'w-8 h-8 rounded-lg flex items-center justify-center border text-gray-500 transition-colors text-base leading-none';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
      <p className="text-sm text-gray-600 order-2 sm:order-1">
        Showing {total === 0 ? 0 : start}–{end} of {total.toLocaleString('en-IN')}
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* prev arrow */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={`${arrowBase} ${
            page === 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium border transition-colors ${
                p === page
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* next arrow */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className={`${arrowBase} ${
            page === totalPages || totalPages === 0
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
