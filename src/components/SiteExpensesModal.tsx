import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import { SiteExpenseItemDto, SiteProfitabilityDto } from '../core/types';
import {
  X,
  Building2,
  Calendar,
  FileSpreadsheet,
  Coins
} from 'lucide-react';

interface SiteExpensesModalProps {
  siteProfitability: SiteProfitabilityDto;
  onClose: () => void;
  onOpenSettleModal?: (siteId: string) => void;
  onOpenMbModal?: (siteId: string) => void;
  isAdmin?: boolean;
}

export const SiteExpensesModal: React.FC<SiteExpensesModalProps> = ({
  siteProfitability,
  onClose,
  onOpenSettleModal,
  onOpenMbModal,
  isAdmin = false,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: expenses = [], isLoading } = useQuery<SiteExpenseItemDto[]>({
    queryKey: ['site-expenses', siteProfitability.siteId, startDate, endDate, categoryFilter],
    queryFn: async () => {
      let url = `/sites/${siteProfitability.siteId}/expenses`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (categoryFilter) params.append('category', categoryFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiClient.get<SiteExpenseItemDto[]>(url);
      return res.data;
    },
  });

  const totalPeriodApproved = expenses
    .filter((e) => e.status === 'Approved' || (e.status as any) === 'Completed')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPeriodPending = expenses
    .filter((e) => e.status === 'Pending' || e.status === 'InfoRequested')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white tracking-tight">{siteProfitability.siteName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    siteProfitability.isSettled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {siteProfitability.settlementStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Location: {siteProfitability.location || 'Location Not Specified'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Site Financial Summary Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider block">Financial Audit Model</span>
              Profit or loss is finalized when final payment is received by Admin. MB upload is optional.
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onOpenSettleModal?.(siteProfitability.siteId)}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  <Coins className="w-3.5 h-3.5 mr-1.5" />
                  {siteProfitability.isSettled ? 'Update Final Settlement' : 'Record Final Payment / Settle'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMbModal?.(siteProfitability.siteId)}
                  className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                  Upload MB
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Final Payment Received</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {siteProfitability.finalPaymentReceived
                  ? `₹${siteProfitability.finalPaymentReceived.toLocaleString('en-IN')}`
                  : 'Pending Settlement'}
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">MB Valuation (Optional)</span>
              <span className="text-lg font-black text-white font-mono">
                ₹{siteProfitability.mbTotalEstimatedValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Site Expenses</span>
              <span className="text-lg font-black text-rose-300 font-mono">
                ₹{siteProfitability.totalApprovedExpenses.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {siteProfitability.isSettled ? 'Final Net Profit / Loss' : 'Current Estimated Margin'}
              </span>
              <span
                className={`text-lg font-black font-mono ${
                  siteProfitability.currentMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ₹{siteProfitability.currentMargin.toLocaleString('en-IN')}{' '}
                <span className="text-xs">({siteProfitability.profitMarginPercentage.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">From Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">To Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Category:</label>
              <input
                type="text"
                placeholder="Search category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {(startDate || endDate || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCategoryFilter('');
                }}
                className="self-end text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Period Approved:</span>
              <span className="text-emerald-400 font-bold">₹{totalPeriodApproved.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Period Pending:</span>
              <span className="text-amber-400 font-bold">₹{totalPeriodPending.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Itemized Expenses Ledger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-400" />
              Itemized Site Expenses Ledger ({expenses.length} Records)
            </h3>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Expense Title</th>
                  <th className="py-3 px-3">Category & Worker</th>
                  <th className="py-3 px-3">Calendar Duration</th>
                  <th className="py-3 px-3">Amount (₹)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Supervisor & Approval Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading site expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expense records found for this site in the selected period.
                    </td>
                  </tr>
                ) : (
                  expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block text-sm">{item.title}</span>
                        {item.description && (
                          <span className="text-slate-400 text-[11px] line-clamp-1">{item.description}</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium">
                          {item.category}
                        </span>
                        {item.labourerName && (
                          <span className="block mt-1 text-[10px] text-blue-400 font-semibold">
                            Worker: {item.labourerName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono space-y-0.5">
                        <div className="text-white">
                          {item.startDate} → {item.endDate}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Req: {new Date(item.createdAtUtc).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'Pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : item.status === 'InfoRequested'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] space-y-0.5">
                        <div className="text-slate-300 font-medium">
                          Sub: {item.submitterName} ({item.submitterPhone || 'No Phone'})
                        </div>
                        {item.approvedByUserName && (
                          <div className="text-emerald-400 text-[10px]">
                            Appr: {item.approvedByUserName}
                          </div>
                        )}
                        {item.approvalComments && (
                          <div className="text-slate-400 text-[10px] italic">
                            "{item.approvalComments}"
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Site Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
