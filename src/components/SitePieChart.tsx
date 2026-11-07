import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SiteBreakdownItem {
  siteId: string;
  siteName: string;
  totalApprovedExpenses: number;
  claimsCount: number;
}

interface SitePieChartProps {
  siteBreakdowns: SiteBreakdownItem[];
  currency?: string;
  onSelectSite?: (siteId: string | null) => void;
  selectedSiteId?: string | null;
}

const PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#6366f1', // Indigo
];

export const SitePieChart: React.FC<SitePieChartProps> = ({
  siteBreakdowns,
  currency = 'INR',
  onSelectSite,
  selectedSiteId,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const validSites = siteBreakdowns.filter((s) => s.totalApprovedExpenses > 0);
  const totalAmount = validSites.reduce((sum, s) => sum + s.totalApprovedExpenses, 0);

  if (validSites.length === 0 || totalAmount === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
        <div className="inline-flex p-3 bg-slate-800 rounded-xl text-slate-500">
          <Building2 className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-semibold text-white">No Site Expenses Recorded</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No approved site expenses found in this selected calendar period.
        </p>
      </div>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = validSites.map((site, idx) => {
    const fraction = totalAmount > 0 ? site.totalApprovedExpenses / totalAmount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += fraction * circumference;
    const color = PALETTE[idx % PALETTE.length];
    const percentage = (fraction * 100).toFixed(1);

    return {
      ...site,
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
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Expense Distribution by Construction Site</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare actual approved expenditure and capital allocation across active projects
          </p>
        </div>

        {selectedSiteId && (
          <button
            onClick={() => onSelectSite?.(null)}
            className="text-xs bg-slate-800 text-blue-300 px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 font-semibold self-start"
          >
            Clear Site Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* SVG Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="24"
              />

              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                const isSelected = selectedSiteId === slice.siteId;
                return (
                  <circle
                    key={slice.siteId}
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
                      filter: isHovered ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectSite?.(selectedSiteId === slice.siteId ? null : slice.siteId)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeSlice ? (
                <>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                    {activeSlice.siteName}
                  </span>
                  <span className="text-xl font-mono font-black text-white mt-0.5">
                    {currencySymbol}{activeSlice.totalApprovedExpenses.toLocaleString('en-IN')}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{ backgroundColor: `${activeSlice.color}25`, color: activeSlice.color }}
                  >
                    {activeSlice.percentage}% ({activeSlice.claimsCount} claims)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Site Spend
                  </span>
                  <span className="text-xl font-mono font-black text-white mt-0.5">
                    {currencySymbol}{totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {slices.length} Active Sites
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Hover or click a site slice to filter</span>
        </div>

        {/* Site Legend & Progress Bars */}
        <div className="lg:col-span-7 space-y-2.5 max-h-72 overflow-y-auto pr-2">
          {slices.map((slice) => {
            const isSelected = selectedSiteId === slice.siteId;
            const isHovered = hoveredIdx === slice.idx;
            return (
              <div
                key={slice.siteId}
                onClick={() => onSelectSite?.(selectedSiteId === slice.siteId ? null : slice.siteId)}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
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
                    <span className="font-semibold text-white text-sm">{slice.siteName}</span>
                    <span className="text-slate-500 text-[11px]">({slice.claimsCount} claims)</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-sm block">
                      {currencySymbol}{slice.totalApprovedExpenses.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{slice.percentage}%</span>
                  </div>
                </div>

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
  );
};

