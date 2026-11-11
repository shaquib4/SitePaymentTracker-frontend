import React from 'react';
import {
  getQuarterDateRange,
  getLastQuarterDateRange,
  detectActivePreset,
  QuarterKey,
} from '../core/utils/quarterUtils';
import { RotateCcw, Clock } from 'lucide-react';

export interface QuarterFilterBarProps {
  year?: number;
  startDate: string;
  endDate: string;
  onChangeRange?: (startDate: string, endDate: string, targetYear?: number) => void;
  onSelectRange?: (startDate: string, endDate: string, targetYear?: number) => void;
  onReset?: () => void;
  themeColor?: 'amber' | 'emerald' | 'blue';
  allLabel?: string;
  className?: string;
}

export const QuarterFilterBar: React.FC<QuarterFilterBarProps> = ({
  year = new Date().getFullYear(),
  startDate,
  endDate,
  onChangeRange,
  onSelectRange,
  onReset,
  themeColor = 'amber',
  allLabel,
  className = '',
}) => {
  const dispatchRange = onChangeRange || onSelectRange || (() => {});
  const activePreset = detectActivePreset(startDate, endDate, year);
  const lastQuarterInfo = getLastQuarterDateRange();

  const themeClasses = {
    amber: {
      active: 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-bold',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      text: 'text-amber-400',
    },
    emerald: {
      active: 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20 font-bold',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    blue: {
      active: 'bg-blue-500 text-slate-950 border-blue-500 shadow-md shadow-blue-500/20 font-bold',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      text: 'text-blue-400',
    },
  }[themeColor];

  const handleSelectQuarter = (q: QuarterKey) => {
    const range = getQuarterDateRange(year, q);
    dispatchRange(range.startDate, range.endDate);
  };

  const handleSelectLastQuarter = () => {
    const lq = getLastQuarterDateRange();
    dispatchRange(lq.startDate, lq.endDate, lq.year);
  };

  const handleSelect30Days = () => {
    const today = new Date();
    const past = new Date();
    past.setDate(past.getDate() - 30);
    dispatchRange(past.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  };

  const handleSelectAll = () => {
    dispatchRange('', '');
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Quarter & Presets Pill Row */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Full Year */}
        <button
          type="button"
          onClick={handleSelectAll}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'all'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {allLabel || `Full Year ${year}`}
        </button>

        {/* Q1 */}
        <button
          type="button"
          onClick={() => handleSelectQuarter('Q1')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'Q1'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={`Q1: Jan 01 - Mar 31, ${year}`}
        >
          Q1 <span className="text-[10px] opacity-80 hidden sm:inline">(Jan-Mar)</span>
        </button>

        {/* Q2 */}
        <button
          type="button"
          onClick={() => handleSelectQuarter('Q2')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'Q2'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={`Q2: Apr 01 - Jun 30, ${year}`}
        >
          Q2 <span className="text-[10px] opacity-80 hidden sm:inline">(Apr-Jun)</span>
        </button>

        {/* Q3 */}
        <button
          type="button"
          onClick={() => handleSelectQuarter('Q3')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'Q3'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={`Q3: Jul 01 - Sep 30, ${year}`}
        >
          Q3 <span className="text-[10px] opacity-80 hidden sm:inline">(Jul-Sep)</span>
        </button>

        {/* Q4 */}
        <button
          type="button"
          onClick={() => handleSelectQuarter('Q4')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'Q4'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={`Q4: Oct 01 - Dec 31, ${year}`}
        >
          Q4 <span className="text-[10px] opacity-80 hidden sm:inline">(Oct-Dec)</span>
        </button>

        {/* Smart Last Quarter Button */}
        <button
          type="button"
          onClick={handleSelectLastQuarter}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border inline-flex items-center space-x-1 ${
            activePreset === 'last_quarter'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={`Filter to previous completed quarter: ${lastQuarterInfo.label} (${lastQuarterInfo.startDate} to ${lastQuarterInfo.endDate})`}
        >
          <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
          <span>Last Quarter</span>
          <span className="text-[10px] opacity-80 font-mono hidden md:inline">
            ({lastQuarterInfo.quarter} '{String(lastQuarterInfo.year).slice(-2)})
          </span>
        </button>

        {/* Rolling 30 Days */}
        <button
          type="button"
          onClick={handleSelect30Days}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === 'last_30_days'
              ? themeClasses.active
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          Last 30 Days
        </button>

        {/* Reset Filter Button */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition inline-flex items-center space-x-1"
            title="Reset to Full Year and clear all active date filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Active Range Confirmation Sub-bar */}
      {(startDate || endDate) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono pt-0.5">
          <span className="text-slate-500">Active Filter:</span>
          <span className={`px-2 py-0.5 rounded-md border font-sans font-semibold text-xs ${themeClasses.badge}`}>
            {activePreset === 'last_quarter'
              ? lastQuarterInfo.label
              : activePreset !== 'custom'
              ? `${activePreset} ${year}`
              : 'Custom Date Range'}
          </span>
          <span className="text-slate-300 font-mono">
            ({startDate || 'Start of year'} → {endDate || 'End of year'})
          </span>
        </div>
      )}
    </div>
  );
};
