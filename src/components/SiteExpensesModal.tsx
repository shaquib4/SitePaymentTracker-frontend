import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import {
  SiteExpenseItemDto,
  SiteProfitabilityDto,
  CategoryBreakdown,
  ExpenseCategory,
  ApprovePaymentDto
} from '../core/types';
import { useAuth } from '../core/auth/AuthContext';
import { ExpensePieChart } from './ExpensePieChart';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileSpreadsheet,
  Coins,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  X,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export interface SiteExpensesViewProps {
  siteProfitability: SiteProfitabilityDto;
  onClose?: () => void;
  onBack?: () => void;
  onOpenSettleModal?: (siteId: string) => void;
  onOpenMbModal?: (siteId: string) => void;
  isAdmin?: boolean;
  isPageView?: boolean;
}

export const SiteExpensesView: React.FC<SiteExpensesViewProps> = ({
  siteProfitability,
  onClose,
  onBack,
  onOpenSettleModal,
  onOpenMbModal,
  isAdmin = false,
  isPageView = false,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Robust field normalization with full null/undefined safety
  const siteId = siteProfitability?.siteId || (siteProfitability as any)?.id || '';
  const siteName = siteProfitability?.siteName || (siteProfitability as any)?.name || 'Project Site';
  const location = siteProfitability?.location || 'Location Not Specified';
  const isSettled = Boolean(siteProfitability?.isSettled);
  const settlementStatus = siteProfitability?.settlementStatus || (isSettled ? 'Finalized Settlement' : 'Ongoing');
  const finalPaymentReceived = siteProfitability?.finalPaymentReceived != null ? Number(siteProfitability.finalPaymentReceived) : null;
  const totalApprovedExpenses = Number(siteProfitability?.totalApprovedExpenses ?? 0);
  const currentMargin = Number(siteProfitability?.currentMargin ?? (siteProfitability as any)?.profitMargin ?? 0);
  const profitMarginPercentage = Number(siteProfitability?.profitMarginPercentage ?? (siteProfitability as any)?.marginPercentage ?? 0);
  const mbTotalEstimatedValue = Number(siteProfitability?.mbTotalEstimatedValue ?? (siteProfitability as any)?.totalMbValue ?? 0);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals for Admin Approval & Clarification Requests
  const [showApproveModalPayment, setShowApproveModalPayment] = useState<SiteExpenseItemDto | null>(null);
  const [approveComments, setApproveComments] = useState('');
  const [approveCategoryMode, setApproveCategoryMode] = useState<'existing' | 'new'>('existing');
  const [approveSelectedCategory, setApproveSelectedCategory] = useState('');
  const [approveNewCategoryName, setApproveNewCategoryName] = useState('');

  const [showRequestInfoModalPayment, setShowRequestInfoModalPayment] = useState<SiteExpenseItemDto | null>(null);
  const [requestInfoQuestions, setRequestInfoQuestions] = useState('');

  const [showCompleteModalPayment, setShowCompleteModalPayment] = useState<SiteExpenseItemDto | null>(null);
  const [completeComments, setCompleteComments] = useState('');

  const handleBack = onBack || onClose || (() => {});

  // Fetch all site expenses
  const { data: expenses = [], isLoading, isError, refetch } = useQuery<SiteExpenseItemDto[]>({
    queryKey: ['site-expenses', siteId, startDate, endDate, categoryFilter],
    queryFn: async () => {
      if (!siteId) return [];
      let url = `/sites/${siteId}/expenses`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (categoryFilter) params.append('category', categoryFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiClient.get<SiteExpenseItemDto[]>(url);
      return res.data;
    },
    enabled: Boolean(siteId),
  });

  // Fetch expense categories for categorization modal
  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<ExpenseCategory[]>('/categories');
      return res.data;
    },
    enabled: isAdmin,
  });

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ paymentId, dto }: { paymentId: string; dto: ApprovePaymentDto }) => {
      const res = await apiClient.post(`/payments/${paymentId}/approve`, dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowApproveModalPayment(null);
      setApproveComments('');
      setApproveNewCategoryName('');
    },
  });

  // Request Info Mutation
  const requestInfoMutation = useMutation({
    mutationFn: async ({ paymentId, version, questions }: { paymentId: string; version: number; questions: string }) => {
      const res = await apiClient.post(`/payments/${paymentId}/request-info`, {
        version,
        questions,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowRequestInfoModalPayment(null);
      setRequestInfoQuestions('');
    },
  });

  // Mark Completed / Disbursed Mutation (Admin Only)
  const markPaidMutation = useMutation({
    mutationFn: async ({ paymentId, version, comments }: { paymentId: string; version: number; comments?: string }) => {
      const res = await apiClient.post(`/payments/${paymentId}/mark-paid`, {
        version,
        comments,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowCompleteModalPayment(null);
      setCompleteComments('');
    },
  });

  // Quick preset helper
  const setPreset = (preset: 'all' | 'last_30_days') => {
    const today = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'last_30_days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('');
    setStatusFilter('');
    setSearchFilter('');
  };

  // Local filtering for search and status
  const filteredExpenses = expenses.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.labourerName && e.labourerName.toLowerCase().includes(q)) ||
        (e.submitterName && e.submitterName.toLowerCase().includes(q)) ||
        (e.submitterPhone && e.submitterPhone.includes(q))
      );
    }
    return true;
  });

  // Period totals
  const totalPeriodApproved = filteredExpenses
    .filter((e) => e.status === 'Approved' || (e.status as any) === 'Completed')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalPeriodPending = filteredExpenses
    .filter((e) => e.status === 'Pending' || e.status === 'InfoRequested')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const periodGrandTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Extract distinct categories for this site
  const uniqueCategories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)));

  // Calculate category breakdown for ExpensePieChart according to active statusFilter
  // e.g. Pending shows only Pending, Approved shows only Approved, Completed shows only Completed.
  const categoryMap = new Map<string, { totalAmount: number; count: number }>();
  const pieTargetExpenses = statusFilter
    ? filteredExpenses.filter((e) => e.status === statusFilter)
    : filteredExpenses.filter((e) => e.status === 'Approved' || (e.status as any) === 'Completed');

  const baseExpenses = (!statusFilter && pieTargetExpenses.length === 0)
    ? filteredExpenses
    : pieTargetExpenses;

  baseExpenses.forEach((e) => {
    const cat = e.category || 'General';
    const curr = categoryMap.get(cat) || { totalAmount: 0, count: 0 };
    categoryMap.set(cat, { totalAmount: curr.totalAmount + (Number(e.amount) || 0), count: curr.count + 1 });
  });

  const categoryBreakdowns: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    totalAmount: val.totalAmount,
    count: val.count,
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Completed
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Pending
          </span>
        );
      case 'InfoRequested':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-blue-400" />
            Info Req
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const content = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* TOP NAVIGATION & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition group self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500 group-hover:text-amber-400 transition" />
          <span>Back to Sites & Profitability</span>
        </button>

        {isAdmin && (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onOpenSettleModal?.(siteId)}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <Coins className="w-4 h-4 mr-1.5" />
              {isSettled ? 'Update Settlement' : 'Record Final Payment'}
            </button>
            <button
              type="button"
              onClick={() => onOpenMbModal?.(siteId)}
              className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Upload MB
            </button>
          </div>
        )}
      </div>

      {/* SITE TITLE & OVERVIEW CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/30 flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {siteName}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    isSettled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {settlementStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Project Location: <strong className="text-slate-200">{location}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* 4 FINANCIAL CARDS (PROFITABILITY HEALTH) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Final Payment Received</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
              {finalPaymentReceived != null
                ? `₹${finalPaymentReceived.toLocaleString('en-IN')}`
                : 'Pending'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Site Expenses</span>
            <div className="text-lg sm:text-xl font-black text-rose-300 font-mono mt-0.5">
              ₹{totalApprovedExpenses.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isSettled ? 'Final Net Profit' : 'Estimated Margin'}
            </span>
            <div
              className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${
                currentMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ₹{currentMargin.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-sans">({profitMarginPercentage.toFixed(1)}%)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">MB Valuation (Opt.)</span>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
              {mbTotalEstimatedValue > 0
                ? `₹${mbTotalEstimatedValue.toLocaleString('en-IN')}`
                : 'No MB Uploaded'}
            </div>
          </div>
        </div>
      </div>

      {/* CALENDAR DATE RANGE FILTER & PERIOD EXPENSE HEADLINE BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Calendar Period Filter & Spend Record</h2>
            <p className="text-xs text-slate-400">
              Select any specific calendar date range to audit total site expenses, pie chart breakdown, and transactions
            </p>
          </div>
        </div>

        {/* Filter Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreset('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              !startDate && !endDate
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Site Records
          </button>
          <button
            type="button"
            onClick={() => setPreset('last_30_days')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              startDate && endDate
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Date Pickers & Category Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Start Date (From):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              End Date (To):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Category Filter:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Status Filter:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed / Disbursed</option>
              <option value="Pending">Pending Review</option>
              <option value="InfoRequested">Info Requested</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* PROMINENT PERIOD SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase block">
              {startDate || endDate ? 'Period Grand Total' : 'Site Expenses Total'}
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              ₹{periodGrandTotal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredExpenses.length} Claims Total
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase block">
              Period Approved & Disbursed
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              ₹{totalPeriodApproved.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cleared, Approved & Completed
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-amber-400 uppercase block">
              Period Pending
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              ₹{totalPeriodPending.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Awaiting Audit / Clarification
            </p>
          </div>
        </div>
      </div>

      {/* EXPENSE CATEGORY DISTRIBUTION PIE CHART */}
      {categoryBreakdowns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Site Expense Category Distribution {statusFilter ? `(${statusFilter} Only)` : '(Approved & Disbursed)'}
              </h3>
              <p className="text-xs text-slate-400">
                {statusFilter
                  ? `Breakdown of ${statusFilter.toLowerCase()} project expenses by material, labour wages, equipment rental, and logistics`
                  : 'Breakdown of cleared project expenses by material, labour wages, equipment rental, and logistics'}
              </p>
            </div>
            {statusFilter && (
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Status: {statusFilter}
              </span>
            )}
          </div>
          <ExpensePieChart
            categoryBreakdowns={categoryBreakdowns}
            onSelectCategory={(cat) => setCategoryFilter(cat || '')}
            selectedCategory={categoryFilter || null}
          />
        </div>
      )}

      {/* ITEMIZED SITE EXPENSES LEDGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Itemized Site Expenses Ledger ({filteredExpenses.length} Records)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit trail of all material, contractor and labour wage claims charged to {siteName}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses, workers, supervisor..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* MOBILE CARD GRID (Phone view < md) */}
        <div className="grid grid-cols-1 gap-3.5 md:hidden">
          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Loading site expenses...
            </div>
          ) : isError ? (
            <div className="bg-slate-900 border border-rose-800/40 rounded-2xl p-8 text-center text-rose-300 space-y-2">
              <p className="font-semibold text-sm">Failed to load site expenses.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              No expense records found for this site in the selected period.
            </div>
          ) : (
            filteredExpenses.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                {/* Header: Category & Worker Pills + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-slate-800 text-amber-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                      {item.category}
                    </span>
                    {item.labourerName && (
                      <span className="bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                        Worker: {item.labourerName}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Amount & Title */}
                <div>
                  <div className="text-2xl font-black font-mono text-white">
                    ₹{(Number(item.amount) || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm font-bold text-white mt-1 leading-snug">{item.title}</div>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>

                {/* Duration & Audit Log */}
                <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-slate-300 font-semibold">{item.startDate} → {item.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested:</span>
                    <span className="text-amber-400/90">
                      {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  {item.approvedByUserName && (
                    <div className="flex justify-between text-emerald-400 pt-0.5 border-t border-slate-800/50">
                      <span>Approved:</span>
                      <span>by {item.approvedByUserName}</span>
                    </div>
                  )}
                </div>

                {/* Clarification Alert */}
                {item.infoRequestDetails && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200">
                    <span className="font-bold block text-blue-300 mb-0.5">Clarification Query:</span>
                    {item.infoRequestDetails}
                  </div>
                )}

                {/* Submitter & Click-to-call */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-300 font-medium">
                    Sub: <strong className="text-white">{item.submitterName}</strong>
                  </span>
                  {item.submitterPhone ? (
                    <a
                      href={`tel:${item.submitterPhone}`}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-xs hover:bg-amber-500/20 font-bold"
                      title="Click to Call Submitter"
                    >
                      <Phone className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      {item.submitterPhone}
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[11px]">No Phone</span>
                  )}
                </div>

                {/* Approval Comments */}
                {item.approvalComments && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-xs text-emerald-300 italic">
                    "{item.approvalComments}"
                  </div>
                )}

                {/* Admin Actions (Mobile) */}
                {isAdmin && (
                  <div className="pt-2 flex flex-col gap-2 border-t border-slate-800">
                    {item.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRequestInfoModalPayment(item);
                          setRequestInfoQuestions('');
                        }}
                        className="w-full py-2.5 px-3 min-h-[42px] bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 mr-1.5" />
                        Request Info / Clarification
                      </button>
                    )}

                    {(item.status === 'Pending' || item.status === 'InfoRequested') && (
                      item.userId === user?.userId ? (
                        <div className="w-full py-2.5 px-3 min-h-[42px] bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center text-center">
                          <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-400" />
                          Peer Approval Req (Self)
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowApproveModalPayment(item);
                            setApproveSelectedCategory(item.categoryId || '');
                            setApproveNewCategoryName('');
                            setApproveComments('');
                          }}
                          className="w-full py-2.5 px-3 min-h-[42px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md flex items-center justify-center transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve & Categorize
                        </button>
                      )
                    )}

                    {item.status === 'Approved' && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompleteModalPayment(item);
                            setCompleteComments('');
                          }}
                          className="w-full py-2.5 px-3 min-h-[42px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Mark Complete / Disbursed
                        </button>
                        <div className="w-full text-center text-[11px] text-emerald-400 font-medium">
                          Approved • Awaiting Final Payout
                        </div>
                      </div>
                    )}

                    {item.status === 'Completed' && (
                      <div className="w-full py-2 text-center text-xs text-cyan-400 font-bold flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Completed & Disbursed
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Visible on md and above) */}
        <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category & Worker</th>
                <th className="py-3 px-4">Supervisor / Submitter</th>
                <th className="py-3 px-4">Calendar Duration</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approval Notes</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-10 text-center text-slate-400">
                    Loading site expenses...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-10 text-center text-rose-300">
                    <p className="font-semibold text-sm">Failed to load site expenses.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-10 text-center text-slate-400">
                    No expense records found for this site in the selected period.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      {item.description && (
                        <div className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                      {item.labourerName && (
                        <div className="text-[10px] text-blue-400 font-semibold mt-1">
                          Worker: {item.labourerName}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-white font-medium">{item.submitterName}</div>
                      {item.submitterPhone && (
                        <a
                          href={`tel:${item.submitterPhone}`}
                          className="inline-flex items-center text-[11px] font-mono text-amber-400 hover:text-amber-300 mt-0.5"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {item.submitterPhone}
                        </a>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      <div>{item.startDate} → {item.endDate}</div>
                      <div className="text-[10px] text-slate-500">
                        Req: {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                      ₹{(Number(item.amount) || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                      {item.infoRequestDetails && (
                        <div className="text-[11px] text-blue-300 mt-1 max-w-xs">
                          Query: {item.infoRequestDetails}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-400 max-w-xs">
                      {item.approvedByUserName && (
                        <div className="text-emerald-400 text-[10px] font-semibold">
                          Appr: {item.approvedByUserName}
                        </div>
                      )}
                      {item.approvalComments ? (
                        <div className="text-slate-300 italic mt-0.5">
                          "{item.approvalComments}"
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No notes</span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {item.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowRequestInfoModalPayment(item);
                              setRequestInfoQuestions('');
                            }}
                            className="px-2.5 py-1.5 min-h-[36px] bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-lg text-xs border border-slate-700 shadow transition-colors inline-flex items-center"
                            title="Request clarification from supervisor"
                          >
                            <HelpCircle className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            Request Info
                          </button>
                        )}
                        {(item.status === 'Pending' || item.status === 'InfoRequested') && (
                          item.userId === user?.userId ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1.5 min-h-[36px] bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold"
                              title="Peer review required: In our 4-admin system, you cannot self-approve your own payment request. Another Admin must approve it."
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                              Peer Approval Req (Self)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setShowApproveModalPayment(item);
                                setApproveSelectedCategory(item.categoryId || '');
                                setApproveNewCategoryName('');
                                setApproveComments('');
                              }}
                              className="px-3 py-1.5 min-h-[36px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-colors inline-flex items-center"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve & Categorize
                            </button>
                          )
                        )}
                        {item.status === 'Approved' && (
                          <div className="inline-flex items-center space-x-2">
                            <span className="text-xs text-emerald-400 font-medium">Approved</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCompleteModalPayment(item);
                                setCompleteComments('');
                              }}
                              className="px-3 py-1.5 min-h-[36px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition-colors inline-flex items-center"
                              title="Confirm payment disbursement and mark completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Mark Complete
                            </button>
                          </div>
                        )}
                        {item.status === 'Completed' && (
                          <span className="inline-flex items-center text-xs text-cyan-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Completed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isPageView ? (
        content
      ) : (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-7xl shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto relative">
            <button
              onClick={handleBack}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* MODAL: APPROVE & DYNAMIC RE-CATEGORIZATION */}
      {showApproveModalPayment && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Approve & Categorize Expense</h3>
                <p className="text-xs text-slate-400">
                  {showApproveModalPayment.title} - ₹{(showApproveModalPayment.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModalPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Categorization Strategy
                </label>
                <div className="flex space-x-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setApproveCategoryMode('existing')}
                    className={`px-3 py-1.5 rounded-lg border transition ${
                      approveCategoryMode === 'existing'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    Select Existing Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveCategoryMode('new')}
                    className={`px-3 py-1.5 rounded-lg border transition ${
                      approveCategoryMode === 'new'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    Type New Category (Auto-Save)
                  </button>
                </div>
              </div>

              {approveCategoryMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select Category
                  </label>
                  <select
                    value={approveSelectedCategory}
                    onChange={(e) => setApproveSelectedCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
                  >
                    <option value="">Keep current ({showApproveModalPayment.category})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    New Category Name (e.g. "Sariya - Grade Fe550")
                  </label>
                  <input
                    type="text"
                    value={approveNewCategoryName}
                    onChange={(e) => setApproveNewCategoryName(e.target.value)}
                    placeholder="Enter new category name..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Backend will automatically save this category to the database for future use.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Approval Comments / Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  placeholder="Verified quote with site engineer..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {showApproveModalPayment.userId === user?.userId && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Peer Review Required:</strong> You initiated this payment claim. In our 4-admin setup, you cannot approve your own request; one of the other 3 Admins must review and approve it.
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModalPayment(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={approveMutation.isPending || showApproveModalPayment.userId === user?.userId}
                  onClick={() => {
                    approveMutation.mutate({
                      paymentId: showApproveModalPayment.id,
                      dto: {
                        version: showApproveModalPayment.version || 1,
                        comments: approveComments || 'Approved by Admin in Site Ledger',
                        overrideCategoryId:
                          approveCategoryMode === 'existing' && approveSelectedCategory
                            ? approveSelectedCategory
                            : undefined,
                        newCategoryName:
                          approveCategoryMode === 'new' && approveNewCategoryName
                            ? approveNewCategoryName
                            : undefined,
                      },
                    });
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 min-h-[42px] flex items-center"
                >
                  {approveMutation.isPending ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN REQUEST MORE DETAILS */}
      {showRequestInfoModalPayment && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Request Clarifications / Info</h3>
                <p className="text-xs text-slate-400">
                  Flags this payment as InfoRequested and records your questions in the audit trail
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestInfoModalPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-white block">{showRequestInfoModalPayment.title}</span>
              <span className="text-slate-400">
                Amount: ₹{(showRequestInfoModalPayment.amount || 0).toLocaleString('en-IN')} | Submitter: {showRequestInfoModalPayment.submitterName} ({showRequestInfoModalPayment.submitterPhone || 'No Phone'})
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Specific Questions / Details Required
              </label>
              <textarea
                rows={3}
                required
                value={requestInfoQuestions}
                onChange={(e) => setRequestInfoQuestions(e.target.value)}
                placeholder="e.g. Please clarify labourer hours for bar-bending or attach weigh-bridge slip..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRequestInfoModalPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestInfoMutation.isPending || !requestInfoQuestions.trim()}
                onClick={() => {
                  requestInfoMutation.mutate({
                    paymentId: showRequestInfoModalPayment.id,
                    version: showRequestInfoModalPayment.version || 1,
                    questions: requestInfoQuestions.trim(),
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 min-h-[42px] flex items-center"
              >
                {requestInfoMutation.isPending ? 'Submitting...' : 'Flag as InfoRequested'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN MARK COMPLETE & DISBURSE */}
      {showCompleteModalPayment && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Payment Disbursement</h3>
                <p className="text-xs text-slate-400">
                  Mark this approved expense as Completed & Disbursed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModalPayment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{showCompleteModalPayment.title}</span>
                <span className="text-emerald-400 font-mono font-bold text-base">
                  ₹{(showCompleteModalPayment.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Category: <strong className="text-slate-200">{showCompleteModalPayment.category}</strong></span>
                <span>Claimant: <strong className="text-slate-200">{showCompleteModalPayment.submitterName}</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Disbursement Notes / Transaction Ref (Optional)
              </label>
              <textarea
                rows={2}
                value={completeComments}
                onChange={(e) => setCompleteComments(e.target.value)}
                placeholder="e.g. Paid via NEFT Ref #99281, Cash voucher signed..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCompleteModalPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={markPaidMutation.isPending}
                onClick={() => {
                  markPaidMutation.mutate({
                    paymentId: showCompleteModalPayment.id,
                    version: showCompleteModalPayment.version || 1,
                    comments: completeComments || 'Payment disbursed & completed by Admin',
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 min-h-[42px] flex items-center"
              >
                {markPaidMutation.isPending ? 'Processing...' : 'Confirm Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const SiteExpensesModal = SiteExpensesView;
