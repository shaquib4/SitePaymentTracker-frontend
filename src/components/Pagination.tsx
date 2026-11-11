import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  recordLabel?: string;
  themeColor?: 'amber' | 'emerald' | 'blue';
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  recordLabel = 'records',
  themeColor = 'amber',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(totalRecords, safeCurrentPage * pageSize);

  // Active theme classes for page number buttons
  const themeClasses = {
    amber: {
      active: 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 border-amber-500',
      focus: 'focus:ring-amber-500',
      badge: 'text-amber-400',
    },
    emerald: {
      active: 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 border-emerald-500',
      focus: 'focus:ring-emerald-500',
      badge: 'text-emerald-400',
    },
    blue: {
      active: 'bg-blue-500 text-slate-950 font-black shadow-md shadow-blue-500/20 border-blue-500',
      focus: 'focus:ring-blue-500',
      badge: 'text-blue-400',
    },
  }[themeColor];

  // Helper to build page window (e.g. 1 ... 4, 5, 6 ... 12)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
      {/* Records Info & Page Size */}
      <div className="flex flex-wrap items-center gap-3 text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing{' '}
          <strong className="text-white font-mono font-bold">{startRecord}</strong> to{' '}
          <strong className="text-white font-mono font-bold">{endRecord}</strong> of{' '}
          <strong className="text-white font-mono font-bold">{totalRecords}</strong> {recordLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-1.5 pl-2 sm:border-l sm:border-slate-800">
            <span className="text-slate-500 hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              className={`bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 ${themeClasses.focus}`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition inline-flex items-center space-x-1 font-semibold"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-600">
                  ...
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                  isCurrent
                    ? themeClasses.active
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition inline-flex items-center space-x-1 font-semibold"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
