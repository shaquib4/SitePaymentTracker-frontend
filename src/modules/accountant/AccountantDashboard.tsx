import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../core/api/client';
import {
  PaymentRequest,
  RequestInfoPaymentDto,
  FinanceMetricsDto,
  SiteProfitabilityDto,
  ExpenseCategory
} from '../../core/types';
import { ExpensePieChart } from '../../components/ExpensePieChart';
import { SitePieChart } from '../../components/SitePieChart';
import { PeriodAccessModal } from '../../components/PeriodAccessModal';
import { SiteExpensesModal } from '../../components/SiteExpensesModal';
import { InitiatePaymentModal } from '../../components/InitiatePaymentModal';
import { useAuth } from '../../core/auth/AuthContext';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  X,
  Calendar,
  Lock,
  AlertCircle,
  Coins,
  Building2
} from 'lucide-react';

export const AccountantDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string | null>(null);
  const [ledgerMode, setLedgerMode] = useState<'all' | 'my_wages'>('all');
  const [showInitiateAccountantWageModal, setShowInitiateAccountantWageModal] = useState(false);

  // Calendar Date Range Filter State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [infoModalPayment, setInfoModalPayment] = useState<PaymentRequest | null>(null);
  const [questions, setQuestions] = useState('');
  const [showPeriodAccessModal, setShowPeriodAccessModal] = useState(false);
  const [viewingSiteProfitability, setViewingSiteProfitability] = useState<SiteProfitabilityDto | null>(null);

  // Export State
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Quick preset helper (User requirement: only Full Year & Last 30 Days, with custom calendar period pickers)
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

  // Queries
  const { data: accessibleYears = [2026] } = useQuery<number[]>({
    queryKey: ['accountant-accessible-years'],
    queryFn: async () => {
      const res = await apiClient.get<number[]>('/period-access/accessible-years');
      return res.data;
    },
  });

  const { data: payments = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ['accountant-payments', selectedYear, statusFilter, startDate, endDate, selectedCategoryFilter, selectedSiteFilter],
    queryFn: async () => {
      let url = `/payments?year=${selectedYear}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (selectedCategoryFilter) url += `&category=${encodeURIComponent(selectedCategoryFilter)}`;
      if (selectedSiteFilter) url += `&siteId=${selectedSiteFilter}`;
      const res = await apiClient.get<PaymentRequest[]>(url);
      return res.data;
    },
  });

  const { data: dashboardStats } = useQuery<FinanceMetricsDto>({
    queryKey: ['accountant-dashboard-stats', selectedYear, startDate, endDate],
    queryFn: async () => {
      let url = `/payments/dashboard-stats?year=${selectedYear}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await apiClient.get<FinanceMetricsDto>(url);
      return res.data;
    },
  });

  const { data: profitability = [] } = useQuery<SiteProfitabilityDto[]>({
    queryKey: ['accountant-sites-profitability', startDate, endDate],
    queryFn: async () => {
      let url = '/sites/profitability';
      if (startDate || endDate) {
        const p = new URLSearchParams();
        if (startDate) p.append('startDate', startDate);
        if (endDate) p.append('endDate', endDate);
        url += `?${p.toString()}`;
      }
      const res = await apiClient.get<SiteProfitabilityDto[]>(url);
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<ExpenseCategory[]>('/categories');
      return res.data;
    },
  });

  // Mutation: Request More Details
  const requestInfoMutation = useMutation({
    mutationFn: async ({ paymentId, dto }: { paymentId: string; dto: RequestInfoPaymentDto }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${paymentId}/request-info`, dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountant-payments'] });
      setInfoModalPayment(null);
      setQuestions('');
    },
  });

  // Trigger Excel Export via Background Worker Channel
  const handleExport = async (categoryFilter?: string) => {
    setExporting(true);
    setExportMessage(null);
    try {
      const res = await apiClient.post<{ jobId: string; message: string }>('/reports/export', {
        year: selectedYear,
        category: categoryFilter,
      });
      setExportMessage(res.data.message || 'Export job queued in background service!');
    } catch (err: any) {
      setExportMessage(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const filteredPayments = (payments || []).filter((p) => {
    if (ledgerMode === 'my_wages' && p.userId !== user?.userId) return false;
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.submitterName || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.submitterPhone && p.submitterPhone.includes(q))
    );
  });

  const totalPeriodApproved = filteredPayments
    .filter((p) => p.status === 'Approved' || (p.status as any) === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPeriodPending = filteredPayments
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPeriodInfoRequested = filteredPayments
    .filter((p) => p.status === 'InfoRequested')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPeriodGrand = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const siteBreakdowns = (profitability || []).map((s) => ({
    siteId: s.siteId,
    siteName: s.siteName,
    totalApprovedExpenses: s.totalApprovedExpenses,
    claimsCount: s.expenseClaimsCount,
  }));

  if (viewingSiteProfitability) {
    return (
      <SiteExpensesModal
        siteProfitability={viewingSiteProfitability}
        isAdmin={false}
        isPageView={true}
        onBack={() => setViewingSiteProfitability(null)}
        onClose={() => setViewingSiteProfitability(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Year Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Accountant Verification Ledger</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
              Read-Only Financial Gatekeeper
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete parity with master ledger for authorized periods. Request Admin approval for locked historical archive years.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <label className="text-xs text-slate-400 font-semibold uppercase">Fiscal Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setStartDate('');
                setEndDate('');
              }}
              className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
            >
              {accessibleYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr} {yr === 2026 ? '(Active Year)' : '(Approved Historical Archive)'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowInitiateAccountantWageModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Coins className="w-3.5 h-3.5 mr-1.5" />
            Request My Salary / Claim
          </button>

          <button
            type="button"
            onClick={() => setShowPeriodAccessModal(true)}
            className="inline-flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
            title="Request access to an unapproved locked historical year"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            Request Period Access
          </button>

          <button
            onClick={() => handleExport()}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            {exporting ? 'Queueing Export...' : 'Export Excel (ClosedXML)'}
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{exportMessage}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CALENDAR DATE RANGE FILTER & PERIOD SUMMARY STATS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Calendar Period Filter & Ledger Audit
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select date ranges within Fiscal Year {selectedYear} to audit category breakdowns, site spends, and transactions
            </p>
          </div>

          {/* Quick Presets (Only Full Year & Last 30 Days) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreset('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                !startDate && !endDate
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Full Year {selectedYear}
            </button>
            <button
              type="button"
              onClick={() => setPreset('last_30_days')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                startDate && endDate
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end pt-3 border-t border-slate-800/80">
          <div className="min-w-0 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 truncate">
              Start Date (From):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[42px] min-w-0 max-w-full box-border bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
            />
          </div>

          <div className="min-w-0 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 truncate">
              End Date (To):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[42px] min-w-0 max-w-full box-border bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]"
            />
          </div>

          <div className="min-w-0 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 truncate">
              Category Filter:
            </label>
            <select
              value={selectedCategoryFilter || ''}
              onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
              className="w-full h-[42px] min-w-0 max-w-full box-border bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 w-full">
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCategoryFilter(null);
                setSelectedSiteFilter(null);
                setStatusFilter('');
                setSearchFilter('');
              }}
              className="w-full h-[42px] flex items-center justify-center min-w-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm border border-slate-700 transition-colors"
            >
              Reset Date & Filters
            </button>
          </div>
        </div>

        {/* PROMINENT PERIOD SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase block">
              {startDate || endDate ? 'Period Grand Total' : `Year ${selectedYear} Spend`}
            </span>
            <div className="mt-1 text-2xl font-black text-white font-mono">
              ₹{totalPeriodGrand.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {filteredPayments.length} Claims Total
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Period Verified</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">
              ₹{totalPeriodApproved.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Disbursed Funds</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Awaiting Verification</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-amber-300 font-mono">
              ₹{totalPeriodPending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Pending Queue</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Clarifications</span>
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-blue-300 font-mono">
              ₹{totalPeriodInfoRequested.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Flagged for Admin Call</span>
          </div>
        </div>
      </div>

      {/* PIE CHARTS: CATEGORY BREAKDOWN & SITE DISTRIBUTION */}
      <div className="grid grid-cols-1 gap-8">
        <ExpensePieChart
          categoryBreakdowns={dashboardStats?.categoryBreakdowns || []}
          onSelectCategory={(cat) => setSelectedCategoryFilter(cat)}
          selectedCategory={selectedCategoryFilter}
        />

        <SitePieChart
          siteBreakdowns={siteBreakdowns}
          onSelectSite={(siteId) => setSelectedSiteFilter(siteId)}
          selectedSiteId={selectedSiteFilter}
        />
      </div>

      {/* MASTER ACCOUNTANT VERIFICATION TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses, supervisors, categories..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="InfoRequested">Info Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Toggle between Company Master Ledger and My Submitted Claims */}
        <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setLedgerMode('all')}
            className={`pb-3 transition-colors ${
              ledgerMode === 'all'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Company Expenses ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setLedgerMode('my_wages')}
            className={`pb-3 transition-colors ${
              ledgerMode === 'my_wages'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Submitted Salary & Expense Claims ({(payments || []).filter(p => p.userId === user?.userId).length})
          </button>
        </div>

        {/* MOBILE CARD GRID (Phone view < md) */}
        <div className="grid grid-cols-1 gap-3.5 md:hidden">
          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Loading ledger for {selectedYear}...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              No payment requests found for the selected period.
            </div>
          ) : (
            filteredPayments.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-slate-800 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                      {p.category}
                    </span>
                    {p.siteName && (
                      <span className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center">
                        <Building2 className="w-3 h-3 mr-1 text-blue-400" />
                        {p.siteName}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      p.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.status === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : p.status === 'InfoRequested'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-black font-mono text-white">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm font-bold text-white mt-1 leading-snug">{p.title}</div>
                  {p.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="font-semibold text-white block">{p.submitterName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{p.submitterPhone || p.submitterEmail}</span>
                  </div>
                  {p.submitterPhone && (
                    <a
                      href={`tel:${p.submitterPhone}`}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-xs font-bold hover:bg-emerald-500/20"
                    >
                      Call ({p.submitterPhone})
                    </a>
                  )}
                </div>

                <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-slate-300 font-semibold">{p.startDate} → {p.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested:</span>
                    <span className="text-amber-400/90">
                      {p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {p.infoRequestDetails && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200">
                    <span className="font-bold block text-blue-300 mb-0.5">Admin/Accountant Flag:</span>
                    {p.infoRequestDetails}
                  </div>
                )}

                <div className="pt-1">
                  {p.status === 'Pending' && (
                    <button
                      onClick={() => {
                        setInfoModalPayment(p);
                        setQuestions('');
                      }}
                      className="w-full py-2.5 px-3 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 mr-1.5" />
                      Request More Details (Flag for Admin)
                    </button>
                  )}
                  {p.status === 'InfoRequested' && (
                    <div className="w-full py-2 text-center text-xs text-blue-300 font-medium">
                      Flagged for Admin Call
                    </div>
                  )}
                  {p.status === 'Approved' && (
                    <div className="w-full py-2 text-center text-xs text-emerald-400 font-bold flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Verified & Approved
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Visible on md and above) */}
        <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Expense Details</th>
                <th className="py-3 px-4">Supervisor / Submitter</th>
                <th className="py-3 px-4">Calendar Duration & Record</th>
                <th className="py-3 px-4">Category & Site</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading ledger for {selectedYear}...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payment requests found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{p.description}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{p.submitterName}</div>
                      {p.submitterPhone ? (
                        <div className="text-xs text-slate-400 font-mono">{p.submitterPhone}</div>
                      ) : (
                        <div className="text-xs text-slate-500">{p.submitterEmail}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono space-y-1">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Expense Duration:</span>
                        <span className="text-slate-200">{p.startDate} → {p.endDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Requested Date:</span>
                        <span className="text-amber-400/90">
                          {p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }) : 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-xs font-medium">
                        {p.category}
                      </span>
                      {p.siteName && (
                        <span className="block text-[11px] text-slate-400 mt-1">
                          Site: {p.siteName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white text-base">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : p.status === 'InfoRequested'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.infoRequestDetails && (
                        <div className="text-[11px] text-blue-300 mt-1 max-w-xs">
                          Query: {p.infoRequestDetails}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => {
                            setInfoModalPayment(p);
                            setQuestions('');
                          }}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5 mr-1" />
                          Request More Details
                        </button>
                      )}
                      {p.status === 'InfoRequested' && (
                        <span className="text-xs text-blue-300 font-medium">Flagged for Admin Call</span>
                      )}
                      {p.status === 'Approved' && (
                        <span className="text-xs text-emerald-400 font-medium">Verified & Approved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REQUEST MORE DETAILS */}
      {infoModalPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Request More Details</h3>
                <p className="text-xs text-slate-400">
                  Flags this payment for Admin phone verification with supervisor
                </p>
              </div>
              <button onClick={() => setInfoModalPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-white block">{infoModalPayment.title}</span>
              <span className="text-slate-400 block">Supervisor: {infoModalPayment.submitterName}</span>
              <span className="text-amber-400 font-mono font-bold block">
                ₹{infoModalPayment.amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Questions / Document Requirements
              </label>
              <textarea
                rows={3}
                required
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="e.g. Please ask supervisor for GST invoice copy or measurement verification..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setInfoModalPayment(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!questions.trim() || requestInfoMutation.isPending}
                onClick={() =>
                  requestInfoMutation.mutate({
                    paymentId: infoModalPayment.id,
                    dto: {
                      version: infoModalPayment.version,
                      questions,
                    },
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow"
              >
                {requestInfoMutation.isPending ? 'Flagging...' : 'Flag for Admin Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERIOD ACCESS REQUEST (ACCOUNTANT VIEW) */}
      {showPeriodAccessModal && (
        <PeriodAccessModal
          isAdmin={false}
          onClose={() => {
            setShowPeriodAccessModal(false);
            queryClient.invalidateQueries({ queryKey: ['accountant-accessible-years'] });
          }}
        />
      )}

      {/* MODAL: SITE EXPENSES AUDIT */}
      {viewingSiteProfitability && (
        <SiteExpensesModal
          siteProfitability={viewingSiteProfitability}
          isAdmin={false}
          onClose={() => setViewingSiteProfitability(null)}
        />
      )}

      {/* MODAL: INITIATE ACCOUNTANT WAGE / SALARY CLAIM */}
      {showInitiateAccountantWageModal && (
        <InitiatePaymentModal
          onClose={() => setShowInitiateAccountantWageModal(false)}
          defaultCategory="Salary"
          defaultTitle="Accountant Monthly Salary / Audit Claim"
          targetRoleLabel="Accountant Salary / Wage Claim"
        />
      )}
    </div>
  );
};
