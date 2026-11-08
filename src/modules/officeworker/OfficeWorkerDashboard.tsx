import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../core/auth/AuthContext';
import { apiClient } from '../../core/api/client';
import { PaymentRequest, UserHistoryResponse, CategoryBreakdown } from '../../core/types';
import { InitiatePaymentModal } from '../../components/InitiatePaymentModal';
import { ExpensePieChart } from '../../components/ExpensePieChart';
import {
  Briefcase,
  PlusCircle,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Search,
  TrendingUp,
  RefreshCw,
  Coins
} from 'lucide-react';

export const OfficeWorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentCalendarYear = new Date().getFullYear();

  // Year selection: allows Office Worker to view whole current year or historical past years (e.g., 2025, 2024)
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInitiateModal, setShowInitiateModal] = useState<boolean>(false);

  // Quick preset helper
  const setPreset = (preset: 'all' | 'last_30_days') => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'last_30_days') {
      const today = new Date();
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setCategoryFilter('');
    setSearchQuery('');
  };

  // Query: Payments strictly submitted by the logged-in user for the chosen year
  // (Backend automatically enforces userFilter = currentUserId for OfficeWorker role)
  const { data: payments = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ['officeworker-payments', user?.userId, selectedYear],
    queryFn: async () => {
      const res = await apiClient.get<PaymentRequest[]>(`/payments?year=${selectedYear}`);
      return res.data;
    },
    enabled: !!user?.userId,
  });

  // Query: Lifetime User History endpoint (strictly for self)
  const { data: historyProfile } = useQuery<UserHistoryResponse>({
    queryKey: ['officeworker-history-profile', user?.userId, startDate, endDate],
    queryFn: async () => {
      let url = `/users/${user?.userId}/history`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiClient.get<UserHistoryResponse>(url);
      return res.data;
    },
    enabled: !!user?.userId,
  });

  // Filter payments locally by date range, category, status, and search query
  const filteredPayments = payments.filter((p) => {
    if (startDate && p.startDate < startDate) return false;
    if (endDate && p.endDate > endDate) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate summary metrics strictly for themselves in the active period
  const totalClaimed = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalApproved = filteredPayments
    .filter((p) => p.status === 'Approved' || (p.status as any) === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = filteredPayments
    .filter((p) => p.status === 'Pending' || p.status === 'InfoRequested')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Extract distinct categories from their requests
  const uniqueCategories = Array.from(new Set(payments.map((p) => p.category).filter(Boolean)));

  // Calculate category breakdown for Pie Chart
  const categoryMap = new Map<string, { totalAmount: number; count: number }>();
  filteredPayments.forEach((p) => {
    const cat = p.category || 'General Office';
    const curr = categoryMap.get(cat) || { totalAmount: 0, count: 0 };
    categoryMap.set(cat, { totalAmount: curr.totalAmount + (p.amount || 0), count: curr.count + 1 });
  });
  const categoryBreakdowns: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    totalAmount: stats.totalAmount,
    count: stats.count,
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Completed
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Pending Review
          </span>
        );
      case 'InfoRequested':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-sky-400" />
            Info Requested
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-2xl border border-cyan-500/30 flex-shrink-0">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Office Worker Self-Service Portal
              </h1>
              <span className="text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                Personal Claims
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Submit your office & administrative expense claims, track real-time approval status, and audit historical payments.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-300">
                Employee: <strong className="text-white">{user?.fullName}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-300">
                Company: <strong className="text-amber-400">{user?.tenantName || 'Khan Enterprises'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Request Payment */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition transform active:scale-95 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Payment / Claim</span>
          </button>
        </div>
      </div>

      {/* CALENDAR PERIOD & YEAR CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Calendar Period Filter & Spend Record
            </h2>
          </div>

          {/* Historical Year Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Select Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setStartDate('');
                setEndDate('');
              }}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={2026}>Year 2026 (Active)</option>
              <option value={2025}>Year 2025 (Historical)</option>
              <option value={2024}>Year 2024 (Historical)</option>
              <option value={2023}>Year 2023 (Historical)</option>
            </select>
          </div>
        </div>

        {/* Period Preset Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreset('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              !startDate && !endDate
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Full Year {selectedYear}
          </button>
          <button
            type="button"
            onClick={() => setPreset('last_30_days')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              startDate && endDate
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Date Pickers & Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Start Date (From):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              End Date (To):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Status Filter:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed / Paid</option>
              <option value="InfoRequested">Info Requested</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Category Filter:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS BAR (Strictly Personal Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              {startDate || endDate ? 'Period Claims Total' : `Year ${selectedYear} Total Claims`}
            </span>
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            ₹{totalClaimed.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {filteredPayments.length} Claims submitted in this period
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase">
              Approved Claims
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 tracking-tight">
            ₹{totalApproved.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cleared & verified by management
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase">
              Pending Review
            </span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 tracking-tight">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Awaiting executive approval
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase">
              Lifetime Total Approved
            </span>
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 tracking-tight">
            ₹{(historyProfile?.totalApprovedAmount ?? totalApproved).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            All-time cumulative payouts
          </p>
        </div>
      </div>

      {/* PIE CHART / CATEGORY BREAKDOWN (If data exists) */}
      {categoryBreakdowns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Personal Expense Category Breakdown
          </h3>
          <ExpensePieChart categoryBreakdowns={categoryBreakdowns} />
        </div>
      )}

      {/* PAYMENT CLAIMS LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              My Payment Claims & Expense Audit ({filteredPayments.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal muster of claims submitted by you for {selectedYear}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims, invoices..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            Loading your expense records...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No payment requests found for the selected calendar period.
            </p>
            <p className="text-xs text-slate-500">
              Click "+ Request Payment / Claim" above to submit an expense for approval.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Claim Title & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Period Dates</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approval Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm">{p.title}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {p.description}
                          </div>
                        )}
                        {p.invoiceNumber && (
                          <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                            Inv: {p.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-[11px] font-mono">
                        <div>{p.startDate}</div>
                        <div className="text-slate-500">to {p.endDate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Req: {new Date(p.createdAtUtc).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-400 max-w-xs">
                        {p.approvalComments ? (
                          <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {p.approvalComments}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No notes yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (visible on phone screens < md) */}
            <div className="md:hidden divide-y divide-slate-800">
              {filteredPayments.map((p) => (
                <div key={p.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <p className="text-[11px] text-cyan-400 font-medium">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="mt-1">{getStatusBadge(p.status)}</div>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                      {p.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/40">
                    <span>
                      Period: <strong className="text-slate-300">{p.startDate}</strong> to <strong className="text-slate-300">{p.endDate}</strong>
                    </span>
                    <span>
                      {new Date(p.createdAtUtc).toLocaleDateString()}
                    </span>
                  </div>

                  {p.approvalComments && (
                    <div className="text-[11px] text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <strong>Admin Note:</strong> {p.approvalComments}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* INITIATE PAYMENT MODAL */}
      {showInitiateModal && (
        <InitiatePaymentModal
          onClose={() => {
            setShowInitiateModal(false);
            queryClient.invalidateQueries({ queryKey: ['officeworker-payments'] });
            queryClient.invalidateQueries({ queryKey: ['officeworker-history-profile'] });
          }}
          targetRoleLabel="Office Worker Expense Claim"
          defaultCategory="Office Supplies & IT"
        />
      )}
    </div>
  );
};
