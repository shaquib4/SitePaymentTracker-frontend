import React from 'react';

/**
 * Modern dark-mode shimmer skeleton rows for tabular data.
 */
export const TableShimmer: React.FC<{
  rows?: number;
  cols?: number;
  hasActions?: boolean;
}> = ({ rows = 6, cols: _cols, hasActions = true }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr
          key={`shimmer-row-${rIdx}`}
          className="border-b border-slate-800/60 animate-pulse"
        >
          {/* Column 1: Title & Description */}
          <td className="py-3.5 px-4 space-y-2">
            <div className="h-4 bg-slate-800 rounded-md w-3/4 shimmer-wave" />
            <div className="h-2.5 bg-slate-800/60 rounded-md w-1/2" />
          </td>

          {/* Column 2: Category & Worker */}
          <td className="py-3.5 px-4 space-y-1.5">
            <div className="h-5 bg-slate-800 rounded-lg w-24 shimmer-wave" />
            <div className="h-2.5 bg-slate-800/60 rounded w-16" />
          </td>

          {/* Column 3: Submitter */}
          <td className="py-3.5 px-4 space-y-1.5">
            <div className="h-3.5 bg-slate-800 rounded w-20" />
            <div className="h-2.5 bg-slate-800/60 rounded w-16" />
          </td>

          {/* Column 4: Duration / Date */}
          <td className="py-3.5 px-4 space-y-1">
            <div className="h-3 bg-slate-800 rounded w-28 font-mono" />
            <div className="h-2 bg-slate-800/60 rounded w-20" />
          </td>

          {/* Column 5: Amount */}
          <td className="py-3.5 px-4">
            <div className="h-5 bg-slate-800 rounded-md w-24 shimmer-wave" />
          </td>

          {/* Column 6: Status */}
          <td className="py-3.5 px-4">
            <div className="h-6 bg-slate-800 rounded-full w-20 shimmer-wave" />
          </td>

          {/* Column 7: Actions */}
          {hasActions && (
            <td className="py-3.5 px-4 text-right">
              <div className="inline-block h-8 bg-slate-800 rounded-lg w-28 shimmer-wave" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

/**
 * Modern dark-mode shimmer skeleton cards for mobile layouts.
 */
export const CardShimmer: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-shimmer-${idx}`}
          className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-lg space-y-3.5 animate-pulse"
        >
          {/* Header Pills */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-5 bg-slate-800 rounded-lg w-20 shimmer-wave" />
              <div className="h-4 bg-slate-800/60 rounded-md w-16" />
            </div>
            <div className="h-5 bg-slate-800 rounded-full w-16 shimmer-wave" />
          </div>

          {/* Amount & Title */}
          <div className="space-y-2">
            <div className="h-7 bg-slate-800 rounded-md w-36 shimmer-wave" />
            <div className="h-4 bg-slate-800/70 rounded-md w-4/5" />
            <div className="h-3 bg-slate-800/40 rounded-md w-3/5" />
          </div>

          {/* Duration Box */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-2.5 bg-slate-800 rounded w-14" />
              <div className="h-2.5 bg-slate-800 rounded w-28" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-2.5 bg-slate-800 rounded w-16" />
              <div className="h-2.5 bg-slate-800 rounded w-20" />
            </div>
          </div>

          {/* Action Button Placeholder */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="h-10 bg-slate-800 rounded-xl w-full shimmer-wave" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Shimmer placeholder for financial summary cards.
 */
export const StatsShimmer: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-3 pt-3 border-t border-slate-800/80`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`stat-shimmer-${idx}`}
          className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 animate-pulse"
        >
          <div className="h-3 bg-slate-800 rounded w-28" />
          <div className="h-7 bg-slate-800 rounded w-36 shimmer-wave" />
          <div className="h-2 bg-slate-800/50 rounded w-20" />
        </div>
      ))}
    </div>
  );
};
