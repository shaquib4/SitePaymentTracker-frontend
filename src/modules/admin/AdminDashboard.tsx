import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../core/api/client';
import {
  PaymentRequest,
  SiteProfitabilityDto,
  User,
  ExpenseCategory,
  Site,
  LabourerDto,
  PeriodAccessRequestDto,
  GenerateUserRequest,
  GenerateUserResponse,
  ApprovePaymentDto,
  FinanceMetricsDto
} from '../../core/types';
import { ExpensePieChart } from '../../components/ExpensePieChart';
import { SitePieChart } from '../../components/SitePieChart';
import { LabourerAuditModal } from '../../components/LabourerAuditModal';
import { SiteExpensesModal } from '../../components/SiteExpensesModal';
import { PeriodAccessModal } from '../../components/PeriodAccessModal';
import { InitiatePaymentModal } from '../../components/InitiatePaymentModal';
import { EditLabourerModal } from '../../components/EditLabourerModal';
import { useAuth } from '../../core/auth/AuthContext';
import { EmployeeExpensesView } from './EmployeeExpensesView';
import {
  CheckCircle2,
  Clock,
  Phone,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  UserX,
  History,
  X,
  Copy,
  Check,
  Search,
  AlertCircle,
  Calendar,
  ArrowRight,
  Building2,
  ShieldCheck,
  Coins,
  Lock,
  UserCheck,
  CreditCard,
  Edit3,
  Users,
  HelpCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'ledger' | 'profitability' | 'labourers' | 'employees' | 'sites_categories'>('ledger');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Calendar Date Range Filter State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string | null>(null);

  // Dedicated Employee View State
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);

  // Modals & Sub-views
  const [showGenerateUserModal, setShowGenerateUserModal] = useState(false);
  const [generatedUserCreds, setGeneratedUserCreds] = useState<GenerateUserResponse | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [showApproveModalPayment, setShowApproveModalPayment] = useState<PaymentRequest | null>(null);
  const [approveComments, setApproveComments] = useState('');
  const [approveCategoryMode, setApproveCategoryMode] = useState<'existing' | 'new'>('existing');
  const [approveSelectedCategory, setApproveSelectedCategory] = useState('');
  const [approveNewCategoryName, setApproveNewCategoryName] = useState('');

  const [showRequestInfoModalPayment, setShowRequestInfoModalPayment] = useState<PaymentRequest | null>(null);
  const [requestInfoQuestions, setRequestInfoQuestions] = useState('');

  const [showCreateSiteModal, setShowCreateSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');

  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showMbModalSiteId, setShowMbModalSiteId] = useState<string | null>(null);
  const [mbEstimatedValue, setMbEstimatedValue] = useState<string>('');
  const [mbMonth, setMbMonth] = useState<number>(new Date().getMonth() + 1);

  // Site Settlement & Audit States
  const [settleSiteProfitability, setSettleSiteProfitability] = useState<SiteProfitabilityDto | null>(null);
  const [settleFinalPayment, setSettleFinalPayment] = useState('');
  const [settleContractValue, setSettleContractValue] = useState('');
  const [viewingSiteProfitability, setViewingSiteProfitability] = useState<SiteProfitabilityDto | null>(null);

  // Labourers Management States
  const { user } = useAuth();
  const [showInitiatePaymentModal, setShowInitiatePaymentModal] = useState(false);
  const [editingLabourer, setEditingLabourer] = useState<LabourerDto | null>(null);
  const [selectedLabourerSiteFilter, setSelectedLabourerSiteFilter] = useState<string>('');
  const [selectedLabourerSupervisorFilter, setSelectedLabourerSupervisorFilter] = useState<string>('');
  const [newLabourerSiteId, setNewLabourerSiteId] = useState('');
  const [auditLabourerId, setAuditLabourerId] = useState<string | null>(null);
  const [showAddLabourerModal, setShowAddLabourerModal] = useState(false);
  const [newLabourerName, setNewLabourerName] = useState('');
  const [newLabourerWageRate, setNewLabourerWageRate] = useState('');
  const [newLabourerSupervisorId, setNewLabourerSupervisorId] = useState('');
  const [newLabourerPhotoUrl, setNewLabourerPhotoUrl] = useState('');

  // Period Access Request Modal State (Admin reviews Accountant requests)
  const [showPeriodRequestsModal, setShowPeriodRequestsModal] = useState(false);

  // Form State for User Generation
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Accountant' | 'Supervisor'>('Supervisor');
  const [newUserDept, setNewUserDept] = useState('Site Operations');

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
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentRequest[]>({
    queryKey: ['payments', selectedYear, statusFilter, startDate, endDate, selectedCategoryFilter, selectedSiteFilter],
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
    queryKey: ['dashboard-stats', selectedYear, startDate, endDate],
    queryFn: async () => {
      let url = `/payments/dashboard-stats?year=${selectedYear}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await apiClient.get<FinanceMetricsDto>(url);
      return res.data;
    },
  });

  const { data: profitability = [] } = useQuery<SiteProfitabilityDto[]>({
    queryKey: ['sites-profitability', startDate, endDate],
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

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<User[]>('/users');
      return res.data;
    },
  });

  const { data: labourers = [] } = useQuery<LabourerDto[]>({
    queryKey: ['labourers'],
    queryFn: async () => {
      const res = await apiClient.get<LabourerDto[]>('/labourers');
      return res.data;
    },
  });

  const { data: pendingPeriodRequests = [] } = useQuery<PeriodAccessRequestDto[]>({
    queryKey: ['admin-period-access-requests'],
    queryFn: async () => {
      const res = await apiClient.get<PeriodAccessRequestDto[]>('/period-access/pending');
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

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await apiClient.get<Site[]>('/sites');
      return res.data;
    },
  });

  // Mutations
  const generateUserMutation = useMutation({
    mutationFn: async (req: GenerateUserRequest) => {
      const res = await apiClient.post<GenerateUserResponse>('/users/generate', req);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setGeneratedUserCreds(data);
      setShowGenerateUserModal(false);
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserPhone('');
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.put(`/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ paymentId, dto }: { paymentId: string; dto: ApprovePaymentDto }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${paymentId}/approve`, dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      setShowApproveModalPayment(null);
      setApproveComments('');
      setApproveNewCategoryName('');
    },
  });

  const requestInfoMutation = useMutation({
    mutationFn: async ({ paymentId, version, questions }: { paymentId: string; version: number; questions: string }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${paymentId}/request-info`, {
        version,
        questions,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowRequestInfoModalPayment(null);
      setRequestInfoQuestions('');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiClient.post<ExpenseCategory>('/categories', { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
    },
  });

  const createSiteMutation = useMutation({
    mutationFn: async ({ name, location }: { name: string; location: string }) => {
      const res = await apiClient.post<Site>('/sites', { name, location });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      setShowCreateSiteModal(false);
      setNewSiteName('');
      setNewSiteLocation('');
    },
  });

  const uploadMbMutation = useMutation({
    mutationFn: async ({ siteId, month, year, value }: { siteId: string; month: number; year: number; value: number }) => {
      await apiClient.post(`/sites/${siteId}/mb-upload`, {
        month,
        year,
        totalEstimatedValue: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      setShowMbModalSiteId(null);
      setMbEstimatedValue('');
    },
  });

  const settleSiteMutation = useMutation({
    mutationFn: async ({
      siteId,
      finalPayment,
      contractVal,
      isSettled,
    }: {
      siteId: string;
      finalPayment: number;
      contractVal?: number;
      isSettled: boolean;
    }) => {
      await apiClient.put(`/sites/${siteId}/settlement`, {
        finalPaymentReceived: finalPayment,
        contractValue: contractVal,
        isSettled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      setSettleSiteProfitability(null);
      setSettleFinalPayment('');
      setSettleContractValue('');
    },
  });

  const createLabourerMutation = useMutation({
    mutationFn: async ({
      name,
      wageRate,
      supervisorId,
      siteId,
      photoUrl,
    }: {
      name: string;
      wageRate: number;
      supervisorId: string;
      siteId?: string;
      photoUrl?: string;
    }) => {
      const res = await apiClient.post<LabourerDto>('/labourers', {
        name,
        dailyWageRate: wageRate,
        supervisorId,
        siteId: siteId || null,
        photoUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourers'] });
      setShowAddLabourerModal(false);
      setNewLabourerName('');
      setNewLabourerWageRate('');
      setNewLabourerSupervisorId('');
      setNewLabourerSiteId('');
      setNewLabourerPhotoUrl('');
    },
  });

  const toggleLabourerStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.put(`/labourers/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourers'] });
    },
  });

  const deleteLabourerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/labourers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourers'] });
    },
  });

  // If currently viewing a dedicated employee detail page, render that component
  if (viewingEmployeeId) {
    return (
      <EmployeeExpensesView
        userId={viewingEmployeeId}
        onBack={() => setViewingEmployeeId(null)}
        year={selectedYear}
      />
    );
  }

  // Totals calculated from filtered payments list
  const totalApproved = (payments || [])
    .filter((p) => p.status === 'Approved' || (p.status as any) === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = (payments || [])
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalInfoRequested = (payments || [])
    .filter((p) => p.status === 'InfoRequested')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const periodGrandTotal = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = (payments || []).filter((p) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.submitterName || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.submitterPhone && p.submitterPhone.includes(q))
    );
  });

  const handleCopyCredentials = () => {
    if (!generatedUserCreds) return;
    const text = `BuildCon Employee Credentials:\nUser ID: ${generatedUserCreds.sixDigitUserId}\nEmail: ${generatedUserCreds.email}\nTemporary Password: ${generatedUserCreds.temporaryPassword}\nLogin: http://localhost:5173`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Gatekeeper & Master Ledger</h1>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
              ₹30k/yr Flat SaaS
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Construction site profitability tracking, click-to-call employee verification, and dynamic approval engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInitiatePaymentModal(true)}
            className="inline-flex items-center px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Initiate Payment Request
          </button>

          <button
            type="button"
            onClick={() => setShowPeriodRequestsModal(true)}
            className="relative inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
            title="Review historical year access requests from accountants"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            Accountant Period Requests
            {pendingPeriodRequests.filter((r) => r.status === 'Pending').length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                {pendingPeriodRequests.filter((r) => r.status === 'Pending').length}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-400" />
            <label className="text-xs font-semibold text-slate-400 uppercase">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setStartDate('');
                setEndDate('');
              }}
              className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-900 text-white">2026 (Active)</option>
              <option value={2025} className="bg-slate-900 text-white">2025 (Historical)</option>
              <option value={2024} className="bg-slate-900 text-white">2024 (Historical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CALENDAR DATE RANGE FILTER & PERIOD EXPENSE HEADLINE BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Calendar Period Filter & Spend Record
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any specific calendar date range to audit total expenses, pie chart breakdown, and transactions
            </p>
          </div>

          {/* Quick Presets (Only Full Year & Last 30 Days) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreset('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                !startDate && !endDate
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
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
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end pt-3 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Start Date (From):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              End Date (To):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Category Filter:
            </label>
            <select
              value={selectedCategoryFilter || ''}
              onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCategoryFilter(null);
                setStatusFilter('');
                setSearchFilter('');
              }}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm border border-slate-700 transition-colors"
            >
              Reset Date & Filters
            </button>
          </div>
        </div>

        {/* PROMINENT PERIOD SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase block">
              {startDate || endDate ? 'Period Grand Total' : `Year ${selectedYear} Total Spend`}
            </span>
            <div className="mt-1 text-2xl font-black text-white font-mono">
              ₹{periodGrandTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {filteredPayments.length} Claims Total
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Period Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">
              ₹{totalApproved.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Disbursed / Verified
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Period Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-amber-300 font-mono">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Awaiting Approval
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Clarifications</span>
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-1 text-2xl font-black text-blue-300 font-mono">
              ₹{totalInfoRequested.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Info Requested
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE EXPENSE PIE CHART */}
      <ExpensePieChart
        categoryBreakdowns={dashboardStats?.categoryBreakdowns || []}
        onSelectCategory={(cat) => setSelectedCategoryFilter(cat)}
        selectedCategory={selectedCategoryFilter}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 transition-colors ${
            activeTab === 'ledger'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Master Payment Ledger ({filteredPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-3 transition-colors ${
            activeTab === 'profitability'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sites & Profitability ({profitability.length})
        </button>
        <button
          onClick={() => setActiveTab('labourers')}
          className={`pb-3 transition-colors ${
            activeTab === 'labourers'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Labourers & Wage Audit ({labourers.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 transition-colors ${
            activeTab === 'employees'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Employee Roster & Deep-Dive ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('sites_categories')}
          className={`pb-3 transition-colors ${
            activeTab === 'sites_categories'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sites & Categories ({sites.length} Sites / {categories.length} Categories)
        </button>
      </div>

      {/* TAB 1: MASTER PAYMENT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, supervisor, category, phone..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="InfoRequested">Info Requested</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* PAYMENTS MOBILE CARD GRID (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {paymentsLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                Loading payment requests...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                No payment requests found for the selected calendar period.
              </div>
            ) : (
              filteredPayments.map((p) => {
                const approvalLog = (p.auditLogs || []).find((a) => a.newStatus === 'Approved');
                const isSelf = p.userId === user?.userId;
                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                    {/* Header: Category & Site Pills + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-slate-800 text-amber-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                          {p.category}
                        </span>
                        {p.labourerId && (
                          <span className="bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded text-[11px]">
                            Labour Wage
                          </span>
                        )}
                        {p.siteName && (
                          <span className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center">
                            <Building2 className="w-3 h-3 mr-1 text-blue-400 flex-shrink-0" />
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

                    {/* Amount & Title */}
                    <div>
                      <div className="text-2xl font-black font-mono text-white">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm font-bold text-white mt-1 leading-snug">{p.title}</div>
                      {p.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      )}
                    </div>

                    {/* Submitter & Click-to-call */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewingEmployeeId(p.userId)}
                        className="text-slate-300 hover:text-amber-300 font-medium text-left flex items-center group"
                      >
                        <span className="font-semibold text-white group-hover:text-amber-300">{p.submitterName}</span>
                        <ArrowRight className="w-3 h-3 ml-1 text-slate-500 group-hover:text-amber-300" />
                      </button>
                      {p.submitterPhone ? (
                        <a
                          href={`tel:${p.submitterPhone}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-xs hover:bg-amber-500/20 font-bold"
                          title="Click to Call Supervisor"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          {p.submitterPhone}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">{p.submitterEmail}</span>
                      )}
                    </div>

                    {/* Duration & Audit Log */}
                    <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="text-slate-300 font-semibold">{p.startDate} → {p.endDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Requested:</span>
                        <span className="text-amber-400/90">
                          {p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      {approvalLog && (
                        <div className="flex justify-between text-emerald-400 pt-0.5 border-t border-slate-800/50">
                          <span>Approved:</span>
                          <span>
                            {new Date(approvalLog.timestampUtc).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short'
                            })} by {approvalLog.performedByUserName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Clarification Alert */}
                    {p.infoRequestDetails && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200">
                        <span className="font-bold block text-blue-300 mb-0.5">Accountant/Admin Query:</span>
                        {p.infoRequestDetails}
                      </div>
                    )}

                    {/* Touch-Friendly Action Buttons (min-h-[44px]) */}
                    <div className="pt-1 flex flex-col gap-2">
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => {
                            setShowRequestInfoModalPayment(p);
                            setRequestInfoQuestions('');
                          }}
                          className="w-full py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 mr-1.5" />
                          Request Info / Clarification
                        </button>
                      )}

                      {(p.status === 'Pending' || p.status === 'InfoRequested') && (
                        isSelf ? (
                          <div className="w-full py-2.5 px-3 min-h-[44px] bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center text-center">
                            <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-400" />
                            Peer Approval Req (Self)
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowApproveModalPayment(p);
                              setApproveSelectedCategory(p.categoryId || '');
                              setApproveNewCategoryName('');
                              setApproveComments('');
                            }}
                            className="w-full py-2.5 px-3 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md flex items-center justify-center transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Approve & Categorize
                          </button>
                        )
                      )}

                      {p.status === 'Approved' && (
                        <div className="w-full py-2 text-center text-xs text-emerald-400 font-bold flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approved (Version {p.version})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (Visible on md and above) */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Expense Details</th>
                  <th className="py-3 px-4">Supervisor / Submitter</th>
                  <th className="py-3 px-4">Payment & Calendar Record</th>
                  <th className="py-3 px-4">Category & Site</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading payment requests...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payment requests found for the selected calendar period.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const approvalLog = (p.auditLogs || []).find((a) => a.newStatus === 'Approved');
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.title}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{p.description}</div>
                        </td>

                        {/* Submitter Name clickable to open individual Employee Expenses Page */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setViewingEmployeeId(p.userId)}
                            className="font-semibold text-white hover:text-amber-300 hover:underline text-left block text-sm group"
                            title="Open dedicated expenses page for this employee"
                          >
                            <span className="flex items-center">
                              {p.submitterName}
                              <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </button>
                          {p.submitterPhone ? (
                            <a
                              href={`tel:${p.submitterPhone}`}
                              className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-mono mt-0.5"
                              title="Click to Call Supervisor"
                            >
                              <Phone className="w-3 h-3 mr-1 text-slate-500" />
                              {p.submitterPhone}
                            </a>
                          ) : (
                            <div className="text-xs text-slate-500">{p.submitterEmail}</div>
                          )}
                        </td>

                        {/* PAYMENT DATE RECORD FOR EACH APPROVAL REQUESTED & APPROVED */}
                        <td className="py-3 px-4 text-xs font-mono space-y-1">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase block">Expense Duration:</span>
                            <span className="text-slate-200">
                              {p.startDate} → {p.endDate}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase block">Requested Date:</span>
                            <span className="text-amber-400/90">
                              {p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : 'N/A'}
                            </span>
                          </div>
                          {approvalLog && (
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase block">Approved On:</span>
                              <span className="text-emerald-400">
                                {new Date(approvalLog.timestampUtc).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} by {approvalLog.performedByUserName}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-medium">
                            {p.category}
                          </span>
                          {p.labourerId && (
                            <span className="ml-1.5 inline-block bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Labour Wage
                            </span>
                          )}
                          {p.siteName && (
                            <span className="block text-[11px] text-slate-400 mt-1">
                              Site: {p.siteName}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-white text-base">
                          ₹{(p.amount || 0).toLocaleString('en-IN')}
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

                        <td className="py-3 px-4 text-right space-x-2">
                          {p.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setShowRequestInfoModalPayment(p);
                                setRequestInfoQuestions('');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-lg text-xs border border-slate-700 shadow transition-colors"
                              title="Request clarification from supervisor"
                            >
                              Request Info
                            </button>
                          )}
                          {(p.status === 'Pending' || p.status === 'InfoRequested') && (
                            p.userId === user?.userId ? (
                              <span
                                className="inline-flex items-center px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold"
                                title="Peer review required: In our 4-admin system, you cannot self-approve your own payment request. Another Admin must approve it."
                              >
                                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                Peer Approval Req (Self)
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowApproveModalPayment(p);
                                  setApproveSelectedCategory(p.categoryId || '');
                                  setApproveNewCategoryName('');
                                  setApproveComments('');
                                }}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-colors"
                              >
                                Approve & Categorize
                              </button>
                            )
                          )}
                          {p.status === 'Approved' && (
                            <span className="text-xs text-emerald-400 font-medium">Approved (v{p.version})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SITE PROFITABILITY, SETTLEMENT & PIE CHART */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Construction Sites & Profitability Ledger</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Profit or loss is finalized when final payment or final MB is received by Admin. MB upload is optional.
              </p>
            </div>

            <button
              onClick={() => setShowCreateSiteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Project Site
            </button>
          </div>

          {/* Site Expense Distribution Pie Chart */}
          <SitePieChart
            siteBreakdowns={(profitability || []).map((s) => ({
              siteId: s.siteId,
              siteName: s.siteName,
              totalApprovedExpenses: s.totalApprovedExpenses,
              claimsCount: s.expenseClaimsCount,
            }))}
            onSelectSite={(id) => setSelectedSiteFilter(id)}
            selectedSiteId={selectedSiteFilter}
          />

          {/* Site Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(profitability || []).map((p) => {
              const mbVal = Number(p.mbTotalEstimatedValue ?? p.totalMbValue ?? 0);
              const approvedExp = Number(p.totalApprovedExpenses ?? 0);
              const margin = Number(p.currentMargin ?? p.profitMargin ?? 0);
              const marginPct = Number(p.profitMarginPercentage ?? p.marginPercentage ?? 0);
              const isProfitable = margin >= 0;

              return (
                <div key={p.siteId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white">{p.siteName}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.isSettled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {p.settlementStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{p.location || 'Location Not Specified'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingSiteProfitability(p)}
                      className="inline-flex items-center text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold transition-colors"
                      title="Inspect all itemized expenses for this site"
                    >
                      <History className="w-3.5 h-3.5 mr-1" />
                      View Expenses
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Final Received</span>
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {p.finalPaymentReceived ? `₹${p.finalPaymentReceived.toLocaleString('en-IN')}` : 'Pending'}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">MB Value (Opt.)</span>
                      <div className="text-sm font-mono font-bold text-white">
                        {mbVal > 0 ? `₹${mbVal.toLocaleString('en-IN')}` : 'No MB'}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Actual Expenses</span>
                      <div className="text-sm font-mono font-bold text-rose-300">
                        ₹{approvedExp.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        {p.isSettled ? 'Final Profit/Loss' : 'Estimated Margin'}
                      </span>
                      <div className={`text-sm font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{margin.toLocaleString('en-IN')} ({marginPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettleSiteProfitability(p);
                        setSettleFinalPayment(p.finalPaymentReceived ? String(p.finalPaymentReceived) : '');
                        setSettleContractValue(p.contractValue ? String(p.contractValue) : '');
                      }}
                      className="inline-flex items-center text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-bold transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {p.isSettled ? 'Update Settlement' : 'Record Final Payment / Settle'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMbModalSiteId(p.siteId)}
                      className="inline-flex items-center text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                      Upload MB (Optional)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LABOURERS & ANTI-EXPLOITATION WAGE AUDIT */}
      {activeTab === 'labourers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Labourers & Anti-Exploitation Wage Audit</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Full transparency on who added whom, assigned supervisors, registered daily wage rates, and payout parity.
              </p>
            </div>

            <button
              onClick={() => setShowAddLabourerModal(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Onboard Labourer (Assign Any Supervisor)
            </button>
          </div>

          {/* 4 Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase block">Registered Labourers</span>
              <div className="mt-1 text-2xl font-black text-white font-mono">{labourers.length} Workers</div>
              <span className="text-[11px] text-slate-500 block mt-0.5">Across all sites</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase block">Total Wages Claimed</span>
              <div className="mt-1 text-2xl font-black text-amber-300 font-mono">
                ₹{labourers.reduce((s, l) => s + (l.totalWagesClaimed || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">By supervisors</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase block">Approved Payouts</span>
              <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">
                ₹{labourers.reduce((s, l) => s + (l.totalWagesApproved || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">Disbursed to workers</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-xs font-semibold text-slate-400 uppercase block">Active Worker Roster</span>
              <div className="mt-1 text-2xl font-black text-blue-300 font-mono">
                {labourers.filter((l) => l.isActive).length} Active
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {labourers.filter((l) => !l.isActive).length} Deactivated
              </span>
            </div>
          </div>

          {/* Site & Supervisor Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <label className="text-xs font-semibold text-slate-400 uppercase">Filter Site:</label>
                <select
                  value={selectedLabourerSiteFilter}
                  onChange={(e) => setSelectedLabourerSiteFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">All Project Sites ({labourers.length})</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-semibold text-slate-400 uppercase">Filter Supervisor:</label>
                <select
                  value={selectedLabourerSupervisorFilter}
                  onChange={(e) => setSelectedLabourerSupervisorFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">All Supervisors</option>
                  {users.filter((u) => u.role === 'Supervisor').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.sixDigitUserId})
                    </option>
                  ))}
                </select>
              </div>

              {(selectedLabourerSiteFilter || selectedLabourerSupervisorFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLabourerSiteFilter('');
                    setSelectedLabourerSupervisorFilter('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono self-end sm:self-auto">
              Showing {labourers.filter((l) => {
                if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
                if (selectedLabourerSupervisorFilter && l.supervisorId !== selectedLabourerSupervisorFilter) return false;
                return true;
              }).length} of {labourers.length} Workers
            </span>
          </div>

          {/* LABOURERS MOBILE CARD GRID (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {labourers.filter((l) => {
              if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
              if (selectedLabourerSupervisorFilter && l.supervisorId !== selectedLabourerSupervisorFilter) return false;
              return true;
            }).length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                No labourers found matching the selected site/supervisor filters.
              </div>
            ) : (
              labourers.filter((l) => {
                if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
                if (selectedLabourerSupervisorFilter && l.supervisorId !== selectedLabourerSupervisorFilter) return false;
                return true;
              }).map((l) => (
                <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-base flex-shrink-0">
                        {l.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{l.name}</h4>
                        <div className="text-xs text-amber-400 font-mono font-bold">
                          ₹{l.dailyWageRate.toFixed(2)} / day
                        </div>
                        <span className="text-[11px] text-blue-400 font-semibold flex items-center mt-0.5">
                          <Building2 className="w-3 h-3 mr-1" />
                          {l.siteName || 'Unassigned Site'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        l.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {l.isActive ? 'Active Worker' : 'Deactivated'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supervisor:</span>
                      <span className="text-slate-200 font-semibold">{l.supervisorName}</span>
                    </div>
                    {l.supervisorPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Call:</span>
                        <a href={`tel:${l.supervisorPhone}`} className="text-amber-400 font-bold hover:underline">
                          {l.supervisorPhone}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Wages Paid:</span>
                      <span className="text-emerald-400 font-bold">₹{(l.totalWagesApproved || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Working Days:</span>
                      <span className="text-slate-400">{l.totalDaysWorked || 0} Days ({l.approvedWageClaimsCount || 0} claims)</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500">Onboarded By:</span>
                      <span className="text-blue-300">{l.createdByUserName || 'Supervisor'} ({l.createdByUserRole || 'Supervisor'})</span>
                    </div>
                  </div>

                  {/* Actions (touch targets) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingLabourer(l)}
                      className="py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                      Edit / Reassign
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditLabourerId(l.id)}
                      className="py-2.5 px-3 min-h-[44px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold rounded-xl text-xs border border-amber-500/30 flex items-center justify-center transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      Audit Ledger
                    </button>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1 border-t border-slate-800/60 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleLabourerStatusMutation.mutate({ id: l.id, isActive: !l.isActive })}
                      className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
                    >
                      {l.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Permanently delete ${l.name} from active roster? All historical payment records will be preserved.`)) {
                          deleteLabourerMutation.mutate(l.id);
                        }
                      }}
                      className="px-3 py-1.5 text-rose-400 hover:text-rose-300 rounded-lg bg-rose-500/10"
                    >
                      Delete
                    </button>
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
                  <th className="py-3 px-4">Labourer Profile</th>
                  <th className="py-3 px-4">Assigned Supervisor</th>
                  <th className="py-3 px-4">Onboarding Authority (Who Added Whom)</th>
                  <th className="py-3 px-4">Wage Rate & Payouts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {labourers.filter((l) => {
                  if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
                  if (selectedLabourerSupervisorFilter && l.supervisorId !== selectedLabourerSupervisorFilter) return false;
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No labourers found matching the selected site/supervisor filters.
                    </td>
                  </tr>
                ) : (
                  labourers.filter((l) => {
                    if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
                    if (selectedLabourerSupervisorFilter && l.supervisorId !== selectedLabourerSupervisorFilter) return false;
                    return true;
                  }).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{l.name}</span>
                            <span className="text-xs text-amber-400 font-mono font-bold">
                              ₹{l.dailyWageRate.toFixed(2)} / day
                            </span>
                            <span className="text-[11px] text-blue-400 font-semibold flex items-center mt-0.5">
                              <Building2 className="w-3 h-3 mr-1" />
                              {l.siteName || 'Unassigned Site'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{l.supervisorName}</div>
                        <div className="text-xs text-slate-400 font-mono">ID: {l.supervisorSixDigitId || 'N/A'}</div>
                        {l.supervisorPhone && (
                          <a
                            href={`tel:${l.supervisorPhone}`}
                            className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-mono mt-0.5"
                          >
                            <Phone className="w-3 h-3 mr-1 text-slate-500" />
                            {l.supervisorPhone}
                          </a>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-white flex items-center">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />
                          Added by: {l.createdByUserName || 'Supervisor'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Role: <span className="text-blue-300">{l.createdByUserRole || 'Supervisor'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(l.createdAtUtc).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono space-y-0.5">
                        <div className="text-white font-bold text-sm">
                          ₹{(l.totalWagesApproved || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {l.totalDaysWorked || 0} Working Days • {l.approvedWageClaimsCount || 0} Claims
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            l.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {l.isActive ? 'Active Worker' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingLabourer(l)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold rounded-lg text-xs border border-slate-700 shadow transition-colors inline-flex items-center"
                          title="Edit worker wage rate or reassign project site"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                          Edit / Reassign
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuditLabourerId(l.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs border border-slate-700 shadow transition-colors inline-flex items-center"
                          title="Open Anti-Exploitation Wage Audit Ledger"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          Audit Wage Ledger
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleLabourerStatusMutation.mutate({ id: l.id, isActive: !l.isActive })}
                          className={`p-1.5 rounded text-xs transition-colors ${
                            l.isActive
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={l.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                        >
                          {l.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Permanently delete ${l.name} from active roster? All historical payment records will be preserved.`)) {
                              deleteLabourerMutation.mutate(l.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete Labourer (Preserves Payment History)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE MANAGEMENT ROSTER & DEEP-DIVE */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Employee Roster & Six-Digit IDs</h2>
              <p className="text-xs text-slate-400">
                Click any employee name or row to open their dedicated personal expenses page with calendar filtering.
              </p>
            </div>
            <button
              onClick={() => setShowGenerateUserModal(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Generate Employee & 6-Digit ID
            </button>
          </div>

          {/* EMPLOYEES MOBILE CARD GRID (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setViewingEmployeeId(u.id)}
                      className="font-bold text-white text-base hover:text-amber-300 flex items-center group text-left"
                    >
                      <span>{u.fullName}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-60 group-hover:opacity-100 text-amber-400" />
                    </button>
                    <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      u.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Six-Digit ID:</span>
                    <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                      {u.sixDigitUserId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role & Dept:</span>
                    <span className="text-slate-200 font-semibold">{u.role} • {u.department}</span>
                  </div>
                  {u.phoneNumber && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500">Phone:</span>
                      <a
                        href={`tel:${u.phoneNumber}`}
                        className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-mono font-bold"
                      >
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {u.phoneNumber}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setViewingEmployeeId(u.id)}
                    className="py-2.5 px-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl text-xs border border-slate-700 inline-flex items-center justify-center"
                  >
                    <History className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    View Expenses
                  </button>
                  <button
                    type="button"
                    onClick={() => deactivateUserMutation.mutate(u.id)}
                    className={`py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-semibold border flex items-center justify-center ${
                      u.isActive
                        ? 'text-rose-400 border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20'
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (Visible on md and above) */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Six-Digit ID</th>
                  <th className="py-3 px-4">Role & Dept</th>
                  <th className="py-3 px-4">Phone (Click-to-Call)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {/* Clickable Employee Name opens full page */}
                      <button
                        type="button"
                        onClick={() => setViewingEmployeeId(u.id)}
                        className="font-semibold text-white hover:text-amber-300 hover:underline text-left block text-sm group"
                      >
                        <span className="flex items-center">
                          {u.fullName}
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                        </span>
                      </button>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2.5 py-1 rounded border border-slate-700">
                        {u.sixDigitUserId || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-300">{u.role}</div>
                      <div className="text-[11px] text-slate-500">{u.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <a
                        href={`tel:${u.phoneNumber}`}
                        className="inline-flex items-center text-xs font-mono font-medium text-amber-400 hover:text-amber-300"
                        title="Click to Call Employee"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {u.phoneNumber}
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setViewingEmployeeId(u.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs border border-slate-700 transition-colors inline-flex items-center"
                        title="Open Dedicated Expenses Page for this Employee"
                      >
                        <History className="w-3.5 h-3.5 mr-1" />
                        View Expenses
                      </button>

                      {u.isActive && (
                        <button
                          onClick={() => deactivateUserMutation.mutate(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
                          title="Deactivate Employee"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Permanently delete ${u.fullName}?`)) {
                            deleteUserMutation.mutate(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Hard Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SITES & CATEGORIES */}
      {activeTab === 'sites_categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sites */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Project Sites</h3>
                <p className="text-xs text-slate-400">Physical project locations</p>
              </div>
              <button
                onClick={() => setShowCreateSiteModal(true)}
                className="inline-flex items-center text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Site
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {sites.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block text-sm">{s.name}</span>
                    <span className="text-xs text-slate-400">{s.location || 'No location specified'}</span>
                  </div>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Categories */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Expense Categories</h3>
                <p className="text-xs text-slate-400">Add dynamic expense types on the fly</p>
              </div>
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="inline-flex items-center text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <div key={c.id} className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-lg text-sm text-slate-200">
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE EMPLOYEE CREDENTIALS */}
      {showGenerateUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Generate Employee & 6-Digit ID</h3>
              <button onClick={() => setShowGenerateUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateUserMutation.mutate({
                  fullName: newUserFullName,
                  email: newUserEmail,
                  phoneNumber: newUserPhone,
                  role: newUserRole,
                  department: newUserDept,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="e.g. Amit Patel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. amit@buildcon.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Phone Number (Mandatory for Call Verification)
                </label>
                <input
                  type="tel"
                  required
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="Site Operations"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateUserMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-bold shadow disabled:opacity-50"
                >
                  {generateUserMutation.isPending ? 'Generating...' : 'Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENTIALS GENERATED (WHATSAPP / SMS READY) */}
      {generatedUserCreds && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Employee Generated!</h3>
              </div>
              <button onClick={() => setGeneratedUserCreds(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy these credentials directly to WhatsApp or SMS to send to the employee:
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 font-mono text-sm text-slate-200">
              <div>
                <span className="text-slate-500 text-xs uppercase block">Six-Digit User ID:</span>
                <span className="text-amber-400 font-bold text-base">{generatedUserCreds.sixDigitUserId}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase block">Email:</span>
                <span>{generatedUserCreds.email}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase block">Temporary Password:</span>
                <span className="text-emerald-400 font-bold">{generatedUserCreds.temporaryPassword}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase block">Phone:</span>
                <span>{generatedUserCreds.phoneNumber}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors"
              >
                {copiedCreds ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy to WhatsApp / SMS
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setGeneratedUserCreds(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPROVE & DYNAMIC RE-CATEGORIZATION */}
      {showApproveModalPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Approve & Categorize Expense</h3>
                <p className="text-xs text-slate-400">
                  {showApproveModalPayment.title} - ₹{(showApproveModalPayment.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setShowApproveModalPayment(null)} className="text-slate-400 hover:text-white">
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
                    className={`px-3 py-1.5 rounded-lg border ${
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
                    className={`px-3 py-1.5 rounded-lg border ${
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
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
                        version: showApproveModalPayment.version,
                        comments: approveComments || 'Approved by Admin',
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Request Clarifications / Info</h3>
                <p className="text-xs text-slate-400">
                  Flags this payment as InfoRequested and records your questions in the audit trail
                </p>
              </div>
              <button onClick={() => setShowRequestInfoModalPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-white block">{showRequestInfoModalPayment.title}</span>
              <span className="text-slate-400">
                Amount: ₹{(showRequestInfoModalPayment.amount || 0).toLocaleString('en-IN')} | Supervisor: {showRequestInfoModalPayment.submitterName} ({showRequestInfoModalPayment.submitterPhone || 'No Phone'})
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRequestInfoModalPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestInfoMutation.isPending || !requestInfoQuestions.trim()}
                onClick={() => {
                  requestInfoMutation.mutate({
                    paymentId: showRequestInfoModalPayment.id,
                    version: showRequestInfoModalPayment.version,
                    questions: requestInfoQuestions.trim(),
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
              >
                {requestInfoMutation.isPending ? 'Submitting...' : 'Flag as InfoRequested'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD MB VALUATION */}
      {showMbModalSiteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Measurement Book Valuation</h3>
              <button onClick={() => setShowMbModalSiteId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMbMutation.mutate({
                  siteId: showMbModalSiteId,
                  month: mbMonth,
                  year: selectedYear,
                  value: parseFloat(mbEstimatedValue),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Month</label>
                <select
                  value={mbMonth}
                  onChange={(e) => setMbMonth(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Total Estimated Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={mbEstimatedValue}
                  onChange={(e) => setMbEstimatedValue(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMbModalSiteId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMbMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
                >
                  {uploadMbMutation.isPending ? 'Saving...' : 'Save MB Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SITE */}
      {showCreateSiteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Project Site</h3>
              <button onClick={() => setShowCreateSiteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSiteMutation.mutate({ name: newSiteName, location: newSiteLocation });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Site Name</label>
                <input
                  type="text"
                  required
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. Highway Flyover Section 3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={newSiteLocation}
                  onChange={(e) => setNewSiteLocation(e.target.value)}
                  placeholder="e.g. Ring Road KM 45"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSiteModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSiteMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
                >
                  {createSiteMutation.isPending ? 'Saving...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DYNAMIC CATEGORY */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Expense Category</h3>
              <button onClick={() => setShowCreateCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCategoryMutation.mutate(newCategoryName);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Diesel & Fuel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
                >
                  {createCategoryMutation.isPending ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ONBOARD LABOURER (AUTHORITY TO ASSIGN ANY SUPERVISOR) */}
      {showAddLabourerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Onboard Labourer (Admin Authority)</h3>
                <p className="text-xs text-slate-400">
                  Register worker and assign under any active site supervisor
                </p>
              </div>
              <button onClick={() => setShowAddLabourerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createLabourerMutation.mutate({
                  name: newLabourerName,
                  wageRate: parseFloat(newLabourerWageRate),
                  supervisorId: newLabourerSupervisorId,
                  siteId: newLabourerSiteId || undefined,
                  photoUrl: newLabourerPhotoUrl || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Worker Full Name</label>
                <input
                  type="text"
                  required
                  value={newLabourerName}
                  onChange={(e) => setNewLabourerName(e.target.value)}
                  placeholder="e.g. Ram Charan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Registered Daily Wage Rate (₹ / Day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newLabourerWageRate}
                  onChange={(e) => setNewLabourerWageRate(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Assigned Project Site
                </label>
                <select
                  value={newLabourerSiteId}
                  onChange={(e) => setNewLabourerSiteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Project Site (Optional) --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.location ? `(${s.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Assigned Supervisor (Admin Selection)
                </label>
                <select
                  required
                  value={newLabourerSupervisorId}
                  onChange={(e) => setNewLabourerSupervisorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Active Supervisor --</option>
                  {users
                    .filter((u) => u.isActive && (u.role === 'Supervisor' || u.role === 'Admin'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role}) • {u.phoneNumber}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={newLabourerPhotoUrl}
                  onChange={(e) => setNewLabourerPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddLabourerModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLabourerMutation.isPending || !newLabourerSupervisorId}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
                >
                  {createLabourerMutation.isPending ? 'Registering...' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FINAL PAYMENT / SETTLE SITE */}
      {settleSiteProfitability && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Record Final Settlement</h3>
                <p className="text-xs text-slate-400">
                  {settleSiteProfitability.siteName}: Profit or loss is finalized when final payment is received
                </p>
              </div>
              <button onClick={() => setSettleSiteProfitability(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 block">Total Approved Site Expenses so far:</span>
              <span className="text-rose-400 font-mono font-bold text-base block">
                ₹{settleSiteProfitability.totalApprovedExpenses.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-500 text-[11px] block">
                MB valuation on record: ₹{settleSiteProfitability.mbTotalEstimatedValue.toLocaleString('en-IN')} (MB is optional)
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                settleSiteMutation.mutate({
                  siteId: settleSiteProfitability.siteId,
                  finalPayment: parseFloat(settleFinalPayment),
                  contractVal: settleContractValue ? parseFloat(settleContractValue) : undefined,
                  isSettled: true,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Final Payment Received from Client (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleFinalPayment}
                  onChange={(e) => setSettleFinalPayment(e.target.value)}
                  placeholder="e.g. 1500000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Total Contract Value (₹, Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settleContractValue}
                  onChange={(e) => setSettleContractValue(e.target.value)}
                  placeholder="e.g. 1800000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {settleFinalPayment && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-xs space-y-1">
                  <span className="text-emerald-400 font-bold block">Finalized Net Margin Calculation:</span>
                  <div className="font-mono text-sm text-white font-bold">
                    ₹{(parseFloat(settleFinalPayment) - settleSiteProfitability.totalApprovedExpenses).toLocaleString('en-IN')} Net Profit/Loss
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSettleSiteProfitability(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleSiteMutation.isPending || !settleFinalPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
                >
                  {settleSiteMutation.isPending ? 'Finalizing...' : 'Confirm Final Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LABOURER ANTI-EXPLOITATION WAGE AUDIT */}
      {auditLabourerId && (
        <LabourerAuditModal
          labourerId={auditLabourerId}
          onClose={() => setAuditLabourerId(null)}
        />
      )}

      {/* MODAL: SITE EXPENSES AUDIT & LEDGER */}
      {viewingSiteProfitability && (
        <SiteExpensesModal
          siteProfitability={viewingSiteProfitability}
          isAdmin={true}
          onClose={() => setViewingSiteProfitability(null)}
          onOpenSettleModal={(id) => {
            const s = profitability.find((x) => x.siteId === id);
            if (s) {
              setSettleSiteProfitability(s);
              setSettleFinalPayment(s.finalPaymentReceived ? String(s.finalPaymentReceived) : '');
              setSettleContractValue(s.contractValue ? String(s.contractValue) : '');
            }
          }}
          onOpenMbModal={(id) => setShowMbModalSiteId(id)}
        />
      )}

      {/* MODAL: PERIOD ACCESS REQUESTS (ADMIN REVIEW) */}
      {showPeriodRequestsModal && (
        <PeriodAccessModal
          isAdmin={true}
          onClose={() => {
            setShowPeriodRequestsModal(false);
            queryClient.invalidateQueries({ queryKey: ['admin-period-access-requests'] });
          }}
        />
      )}

      {/* MODAL: INITIATE PAYMENT REQUEST (ADMIN / PEER APPROVAL) */}
      {showInitiatePaymentModal && (
        <InitiatePaymentModal
          onClose={() => setShowInitiatePaymentModal(false)}
          targetRoleLabel="Admin Payment Claim / Capital Expense"
        />
      )}

      {/* MODAL: EDIT LABOURER & REASSIGN SITE */}
      {editingLabourer && (
        <EditLabourerModal
          labourer={editingLabourer}
          isAdmin={true}
          onClose={() => setEditingLabourer(null)}
        />
      )}
    </div>
  );
};
