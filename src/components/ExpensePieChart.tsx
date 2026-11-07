import React, { useState } from 'react';
import { CategoryBreakdown } from '../core/types';
import { PieChart as PieIcon } from 'lucide-react';

interface ExpensePieChartProps {
  categoryBreakdowns: CategoryBreakdown[];
  currency?: string;
  onSelectCategory?: (category: string | null) => void;
  selectedCategory?: string | null;
}

const PALETTE = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#e11d48', // Rose
  '#6366f1', // Indigo
];

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  categoryBreakdowns,
  currency = 'INR',
  onSelectCategory,
  selectedCategory,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalAmount = categoryBreakdowns.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  if (!categoryBreakdowns || categoryBreakdowns.length === 0 || totalAmount === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-3">
        <div className="inline-flex p-3 bg-slate-800 rounded-xl text-slate-500">
          <PieIcon className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-semibold text-white">No Expense Breakdown Recorded</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No approved or pending expenses fall within the selected calendar period.
        </p>
      </div>
    );
  }

  // Pre-calculate Donut slices using SVG circumference
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = categoryBreakdowns.map((cat, idx) => {
    const fraction = totalAmount > 0 ? cat.totalAmount / totalAmount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += fraction * circumference;
    const color = PALETTE[idx % PALETTE.length];
    const percentage = (fraction * 100).toFixed(1);

    return {
      ...cat,
      fraction,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      color,
      idx,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <PieIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Expense Breakdown by Category</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive spend distribution across all project categories in selected calendar period
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory?.(null)}
            className="text-xs bg-slate-800 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 font-semibold self-start"
          >
            Clear Category Filter ({selectedCategory})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* SVG Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 200 200"
            >
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="24"
              />

              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                const isSelected = selectedCategory === slice.category;
                return (
                  <circle
                    key={slice.category}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered || isSelected ? '28' : '22'}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                      filter: isHovered ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectCategory?.(selectedCategory === slice.category ? null : slice.category)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeSlice ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                    {activeSlice.category}
                  </span>
                  <span className="text-xl font-mono font-black text-white mt-0.5">
                    {currencySymbol}{activeSlice.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: `${activeSlice.color}25`, color: activeSlice.color }}>
                    {activeSlice.percentage}% ({activeSlice.count} claims)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Period Total
                  </span>
                  <span className="text-xl font-mono font-black text-white mt-0.5">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {categoryBreakdowns.length} Categories
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Hover or click a slice to inspect</span>
        </div>

        {/* Category Legend & Distribution Bars */}
        <div className="lg:col-span-7 space-y-3">
          <div className="max-h-72 overflow-y-auto pr-2 space-y-2.5">
            {slices.map((slice) => {
              const isSelected = selectedCategory === slice.category;
              const isHovered = hoveredIdx === slice.idx;
              return (
                <div
                  key={slice.category}
                  onClick={() => onSelectCategory?.(selectedCategory === slice.category ? null : slice.category)}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10'
                      : isHovered
                      ? 'border-slate-700 bg-slate-800/80'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-semibold text-white text-sm">{slice.category}</span>
                      <span className="text-slate-500 text-[11px]">({slice.count} claims)</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-white text-sm block">
                        ₹{slice.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {slice.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal visual bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(4, slice.fraction * 100)}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
