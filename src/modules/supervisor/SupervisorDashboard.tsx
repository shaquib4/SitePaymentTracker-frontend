import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../core/api/client';
import {
  PaymentRequest,
  Labourer,
  LabourerDto,
  Site,
  WageRequestDto,
  CreatePaymentDto
} from '../../core/types';
import {
  Users,
  PlusCircle,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  ShieldCheck,
  UserX,
  Building2,
  Coins,
  Edit3
} from 'lucide-react';
import { LabourerAuditModal } from '../../components/LabourerAuditModal';
import { EditLabourerModal } from '../../components/EditLabourerModal';
import { InitiatePaymentModal } from '../../components/InitiatePaymentModal';
import { ExpensePieChart } from '../../components/ExpensePieChart';

export const SupervisorDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const currentCalendarYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<'wage_requests' | 'my_wages' | 'labourers' | 'material_requests'>('wage_requests');

  // Modals
  const [showOnboardLabourerModal, setShowOnboardLabourerModal] = useState(false);
  const [showInitiateSupervisorWageModal, setShowInitiateSupervisorWageModal] = useState(false);
  const [editingLabourer, setEditingLabourer] = useState<LabourerDto | null>(null);
  const [selectedLabourerSiteFilter, setSelectedLabourerSiteFilter] = useState<string>('');
  const [labourerName, setLabourerName] = useState('');
  const [labourerWageRate, setLabourerWageRate] = useState('');
  const [labourerSiteId, setLabourerSiteId] = useState('');
  const [labourerPhotoUrl, setLabourerPhotoUrl] = useState('');
  const [auditLabourerId, setAuditLabourerId] = useState<string | null>(null);

  const [showWageRequestModal, setShowWageRequestModal] = useState(false);
  const [wageLabourerId, setWageLabourerId] = useState('');
  const [wageSiteId, setWageSiteId] = useState('');
  const [wageAmount, setWageAmount] = useState('');
  const [wageTitle, setWageTitle] = useState('');
  const [wageDesc, setWageDesc] = useState('');
  const [wageStartDate, setWageStartDate] = useState('');
  const [wageEndDate, setWageEndDate] = useState('');

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matAmount, setMatAmount] = useState('');
  const [matCategory, setMatCategory] = useState('');
  const [matSiteId, setMatSiteId] = useState('');
  const [matStartDate, setMatStartDate] = useState('');
  const [matEndDate, setMatEndDate] = useState('');

  // Queries
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentRequest[]>({
    queryKey: ['supervisor-payments', currentCalendarYear],
    queryFn: async () => {
      const res = await apiClient.get<PaymentRequest[]>(`/payments?year=${currentCalendarYear}`);
      return res.data;
    },
  });

  const { data: labourers = [] } = useQuery<Labourer[]>({
    queryKey: ['labourers'],
    queryFn: async () => {
      const res = await apiClient.get<Labourer[]>('/labourers');
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
  const onboardLabourerMutation = useMutation({
    mutationFn: async ({
      name,
      wageRate,
      siteId,
      photoUrl,
    }: {
      name: string;
      wageRate: number;
      siteId?: string;
      photoUrl?: string;
    }) => {
      const res = await apiClient.post<Labourer>('/labourers', {
        name,
        dailyWageRate: wageRate,
        siteId: siteId || null,
        photoUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourers'] });
      setShowOnboardLabourerModal(false);
      setLabourerName('');
      setLabourerWageRate('');
      setLabourerSiteId('');
      setLabourerPhotoUrl('');
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

  const submitWageRequestMutation = useMutation({
    mutationFn: async (dto: WageRequestDto) => {
      const res = await apiClient.post<PaymentRequest>('/payments/wage-request', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-payments'] });
      setShowWageRequestModal(false);
      setWageAmount('');
      setWageTitle('');
      setWageDesc('');
    },
  });

  const submitMaterialMutation = useMutation({
    mutationFn: async (dto: CreatePaymentDto) => {
      const res = await apiClient.post<PaymentRequest>('/payments', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-payments'] });
      setShowMaterialModal(false);
      setMatTitle('');
      setMatDesc('');
      setMatAmount('');
      setMatCategory('');
    },
  });

  const wagePayments = payments.filter((p) => p.labourerId != null);
  const materialPayments = payments.filter((p) => p.labourerId == null);

  const totalWagePending = wagePayments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalApproved = payments.filter((p) => p.status === 'Approved' || (p.status as any) === 'Completed').reduce((s, p) => s + p.amount, 0);

  // Pie chart calculation strictly for approved/completed payments (Pending is excluded)
  const approvedSupervisorPayments = (payments || []).filter(
    (p) => p.status === 'Approved' || (p.status as any) === 'Completed'
  );

  const categoryMap = new Map<string, { total: number; count: number }>();
  approvedSupervisorPayments.forEach((p) => {
    const cat = p.category || (p.labourerId ? 'Labour Wages' : 'General');
    const curr = categoryMap.get(cat) || { total: 0, count: 0 };
    categoryMap.set(cat, { total: curr.total + (p.amount || 0), count: curr.count + 1 });
  });

  const supervisorCategoryBreakdown = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    totalAmount: val.total,
    count: val.count,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Supervisor Site & Labour Management</h1>
            <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30">
              Site Operations
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Distinct labour onboarding, muster roll wage requests, and material claim tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowInitiateSupervisorWageModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow transition-colors"
          >
            <Coins className="w-4 h-4 mr-2" />
            Request My Wages / Fee
          </button>

          <button
            onClick={() => setShowOnboardLabourerModal(true)}
            className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm border border-slate-700 transition-colors"
          >
            <UserCheck className="w-4 h-4 mr-2 text-blue-400" />
            Onboard Labourer
          </button>

          <button
            onClick={() => setShowWageRequestModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Request Labour Wage
          </button>

          <button
            onClick={() => setShowMaterialModal(true)}
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Claim Material Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">My Managed Labourers</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{labourers.length} Workers</div>
          <p className="text-xs text-slate-400 mt-1">Active muster roll personnel under supervision</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Wage Payouts (₹)</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">₹{totalWagePending.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Labour requests awaiting Admin approval</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Approved (₹)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">₹{totalApproved.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Disbursed wage and material claims in {currentCalendarYear}</p>
        </div>
      </div>

      {/* APPROVED EXPENSE BREAKDOWN (EXCLUDES PENDING) */}
      {supervisorCategoryBreakdown.length > 0 && (
        <ExpensePieChart
          categoryBreakdowns={supervisorCategoryBreakdown}
        />
      )}

      {/* Tabs with Horizontal Scroll for Mobile */}
      <div className="border-b border-slate-800 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex overflow-x-auto horizontal-scroll-container pb-2 pt-1 gap-2 sm:gap-6 text-sm font-semibold items-center">
          <button
            onClick={() => setActiveTab('wage_requests')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 py-2 rounded-xl sm:rounded-none sm:px-1 sm:pb-3 transition-colors ${
              activeTab === 'wage_requests'
                ? 'text-blue-400 bg-blue-500/15 sm:bg-transparent sm:border-b-2 sm:border-blue-400 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 sm:hover:bg-transparent'
            }`}
          >
            Labour Wage Requests ({wagePayments.length})
          </button>
          <button
            onClick={() => setActiveTab('my_wages')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 py-2 rounded-xl sm:rounded-none sm:px-1 sm:pb-3 transition-colors ${
              activeTab === 'my_wages'
                ? 'text-emerald-400 bg-emerald-500/15 sm:bg-transparent sm:border-b-2 sm:border-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 sm:hover:bg-transparent'
            }`}
          >
            My Supervisor Wages ({payments.filter((p) => p.labourerId == null && (p.category.includes('Wage') || p.category.includes('Salary') || p.category.includes('Supervisor'))).length})
          </button>
          <button
            onClick={() => setActiveTab('labourers')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 py-2 rounded-xl sm:rounded-none sm:px-1 sm:pb-3 transition-colors ${
              activeTab === 'labourers'
                ? 'text-blue-400 bg-blue-500/15 sm:bg-transparent sm:border-b-2 sm:border-blue-400 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 sm:hover:bg-transparent'
            }`}
          >
            Labour Roster & Wage Audit ({labourers.length})
          </button>
          <button
            onClick={() => setActiveTab('material_requests')}
            className={`whitespace-nowrap flex-shrink-0 px-3.5 py-2 rounded-xl sm:rounded-none sm:px-1 sm:pb-3 transition-colors ${
              activeTab === 'material_requests'
                ? 'text-amber-400 bg-amber-500/15 sm:bg-transparent sm:border-b-2 sm:border-amber-400 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 sm:hover:bg-transparent'
            }`}
          >
            Material & Site Claims ({materialPayments.length})
          </button>
        </div>
      </div>

      {/* TAB 1: WAGE REQUESTS */}
      {activeTab === 'wage_requests' && (
        <div className="space-y-4">
          {/* MOBILE CARD GRID (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paymentsLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                Loading wage requests...
              </div>
            ) : wagePayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                No labour wage requests submitted yet. Click "Request Labour Wage" above.
              </div>
            ) : (
              wagePayments.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-blue-500/20 text-blue-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                      Labour Wage Claim
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
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
                    <div className="text-sm font-bold text-white mt-1">{p.title}</div>
                    {p.description && (
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    )}
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wage Period:</span>
                      <span className="text-slate-200 font-semibold">{p.startDate} → {p.endDate}</span>
                    </div>
                    {p.siteName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Site:</span>
                        <span className="text-blue-300">{p.siteName}</span>
                      </div>
                    )}
                  </div>

                  {p.infoRequestDetails && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200">
                      <span className="font-bold block text-blue-300 mb-0.5">Accountant Query:</span>
                      {p.infoRequestDetails}
                    </div>
                  )}

                  {p.approvalComments && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300">
                      <span className="font-bold block text-emerald-400 mb-0.5">Approval Note:</span>
                      {p.approvalComments}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Wage Claim</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Audit History / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading wage requests...
                    </td>
                  </tr>
                ) : wagePayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No labour wage requests submitted yet. Click "Request Labour Wage" above.
                    </td>
                  </tr>
                ) : (
                  wagePayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{p.title}</div>
                        <div className="text-xs text-slate-400">{p.description}</div>
                        <span className="inline-block mt-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Labour ID: {p.labourerId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-300 font-mono">
                        {p.startDate} to {p.endDate}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white">
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
                            Accountant Clarification: {p.infoRequestDetails}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-400">
                        {p.approvalComments ? (
                          <span className="text-emerald-400 font-medium">{p.approvalComments}</span>
                        ) : p.rejectionReason ? (
                          <span className="text-rose-400">{p.rejectionReason}</span>
                        ) : (
                          <span className="text-slate-500">In Admin Queue</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MY SUPERVISOR WAGES & SALARY */}
      {activeTab === 'my_wages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <Coins className="w-4 h-4 mr-2 text-emerald-400" />
                My Supervisor Wages & Personal Claims
              </h3>
              <p className="text-xs text-slate-400">
                Track personal fee requests, supervision salary, and monthly allowances submitted to Admin.
              </p>
            </div>
            <button
              onClick={() => setShowInitiateSupervisorWageModal(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition-colors self-start sm:self-auto"
            >
              <Coins className="w-3.5 h-3.5 mr-1.5" />
              Request New Wage / Fee
            </button>
          </div>

          {/* MOBILE CARD GRID FOR SUPERVISOR'S OWN CLAIMS (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {payments.filter(p => p.labourerId == null && (p.category.includes('Wage') || p.category.includes('Salary') || p.category.includes('Supervisor'))).length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                No personal wage claims submitted yet. Click "Request New Wage / Fee" to submit.
              </div>
            ) : (
              payments.filter(p => p.labourerId == null && (p.category.includes('Wage') || p.category.includes('Salary') || p.category.includes('Supervisor'))).map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                      Supervisor Wage
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
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
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      ₹{(p.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{p.title}</div>
                    {p.description && (
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    )}
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span className="text-slate-200">{p.startDate} → {p.endDate}</span>
                    </div>
                    {p.siteName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Site:</span>
                        <span className="text-blue-300">{p.siteName}</span>
                      </div>
                    )}
                  </div>

                  {(p.approvalComments || p.rejectionReason || p.infoRequestDetails) && (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300">
                      <span className="font-bold block text-slate-400 mb-0.5">Admin Note:</span>
                      {p.approvalComments || p.rejectionReason || p.infoRequestDetails}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Claim Title & Details</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Review Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {payments.filter(p => p.labourerId == null && (p.category.includes('Wage') || p.category.includes('Salary') || p.category.includes('Supervisor'))).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No personal wage claims submitted yet. Click "Request New Wage / Fee" to submit.
                    </td>
                  </tr>
                ) : (
                  payments.filter(p => p.labourerId == null && (p.category.includes('Wage') || p.category.includes('Salary') || p.category.includes('Supervisor'))).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{p.title}</span>
                        {p.siteName && (
                          <span className="text-xs text-blue-400 font-semibold block">Site: {p.siteName}</span>
                        )}
                        <span className="text-[11px] text-slate-400">{p.description}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {p.startDate} → {p.endDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
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
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {p.approvalComments || p.rejectionReason || p.infoRequestDetails || 'Pending Admin Review'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LABOUR ROSTER */}
      {activeTab === 'labourers' && (
        <div className="space-y-4">
          {/* Site Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <label className="text-xs font-semibold text-slate-400 uppercase">Filter by Site:</label>
              <select
                value={selectedLabourerSiteFilter}
                onChange={(e) => setSelectedLabourerSiteFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Project Sites ({labourers.length})</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedLabourerSiteFilter && (
              <button
                type="button"
                onClick={() => setSelectedLabourerSiteFilter('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {labourers.filter((l) => {
              if (selectedLabourerSiteFilter && l.siteId !== selectedLabourerSiteFilter && l.siteName !== selectedLabourerSiteFilter) return false;
              return true;
            }).map((l) => (
              <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-lg">
                    {l.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-base">{l.name}</h4>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      Wage: ₹{l.dailyWageRate.toFixed(2)} / day
                    </span>
                    <span className="text-xs text-blue-400 font-semibold flex items-center mt-0.5">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-blue-400 shrink-0" />
                      {l.siteName || 'Unassigned Site'}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Added by: <span className="text-slate-300 font-medium">{l.createdByUserName || 'Supervisor'}</span> ({l.createdByUserRole || 'Supervisor'})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ₹{(l.totalWagesApproved || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Days Worked</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {l.totalDaysWorked || 0} Days
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {l.isActive ? 'Active Worker' : 'Inactive'}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingLabourer(l)}
                      className="inline-flex items-center px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      title="Edit worker wage rate or reassign site"
                    >
                      <Edit3 className="w-3 h-3 mr-1 text-blue-400" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuditLabourerId(l.id)}
                      className="inline-flex items-center px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      title="Audit transparent payout records for this worker"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Audit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleLabourerStatusMutation.mutate({ id: l.id, isActive: !l.isActive })}
                      className={`p-1 rounded text-xs transition-colors ${
                        l.isActive
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                      title={l.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                    >
                      {l.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MATERIAL EXPENSES */}
      {activeTab === 'material_requests' && (
        <div className="space-y-4">
          {/* MOBILE CARD GRID FOR MATERIAL & SITE EXPENSES (Phone view < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {materialPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                No material expense claims recorded yet. Click "Claim Material Expense" above.
              </div>
            ) : (
              materialPayments.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                      {p.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
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
                      ₹{(p.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{p.title}</div>
                    {p.description && (
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    )}
                  </div>

                  {p.siteName && (
                    <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl p-2.5 text-[11px] font-mono text-slate-400 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      <span>Site: <strong className="text-white">{p.siteName}</strong></span>
                    </div>
                  )}

                  {(p.approvalComments || p.rejectionReason || p.infoRequestDetails) && (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300">
                      <span className="font-bold block text-slate-400 mb-0.5">Note:</span>
                      {p.approvalComments || p.rejectionReason || p.infoRequestDetails}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Claim</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {materialPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-xs text-slate-400">{p.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{p.category}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-amber-300">{p.status}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {p.approvalComments || 'Awaiting Review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD LABOURER */}
      {showOnboardLabourerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Onboard Labourer</h3>
              <button onClick={() => setShowOnboardLabourerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onboardLabourerMutation.mutate({
                  name: labourerName,
                  wageRate: parseFloat(labourerWageRate),
                  siteId: labourerSiteId || undefined,
                  photoUrl: labourerPhotoUrl || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Labourer Name</label>
                <input
                  type="text"
                  required
                  value={labourerName}
                  onChange={(e) => setLabourerName(e.target.value)}
                  placeholder="e.g. Ramesh Yadav"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Daily Wage Rate (₹/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={labourerWageRate}
                  onChange={(e) => setLabourerWageRate(e.target.value)}
                  placeholder="e.g. 650"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Assigned Project Site
                </label>
                <select
                  value={labourerSiteId}
                  onChange={(e) => setLabourerSiteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Project Site (Optional) --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={labourerPhotoUrl}
                  onChange={(e) => setLabourerPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardLabourerModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardLabourerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm shadow disabled:opacity-50"
                >
                  {onboardLabourerMutation.isPending ? 'Saving...' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WAGE REQUEST (FORCES LABOURER ID & SITE ID) */}
      {showWageRequestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Submit Labour Wage Request</h3>
                <p className="text-xs text-slate-400">Strictly separates wage claims from materials</p>
              </div>
              <button onClick={() => setShowWageRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitWageRequestMutation.mutate({
                  labourerId: wageLabourerId,
                  siteId: wageSiteId,
                  amount: parseFloat(wageAmount),
                  expenseYear: currentCalendarYear,
                  startDate: wageStartDate,
                  endDate: wageEndDate,
                  title: wageTitle,
                  description: wageDesc,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Labourer</label>
                <select
                  required
                  value={wageLabourerId}
                  onChange={(e) => {
                    setWageLabourerId(e.target.value);
                    const selected = labourers.find((l) => l.id === e.target.value);
                    if (selected && !wageTitle) {
                      setWageTitle(`Weekly Wages - ${selected.name}`);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Worker --</option>
                  {labourers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (₹{l.dailyWageRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Project Site</label>
                <select
                  required
                  value={wageSiteId}
                  onChange={(e) => setWageSiteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Project Site --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Wage Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={wageAmount}
                  onChange={(e) => setWageAmount(e.target.value)}
                  placeholder="e.g. 7800"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={wageStartDate}
                    onChange={(e) => setWageStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={wageEndDate}
                    onChange={(e) => setWageEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={wageTitle}
                  onChange={(e) => setWageTitle(e.target.value)}
                  placeholder="Weekly Wages - Ramesh Yadav"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Work Description</label>
                <textarea
                  rows={2}
                  required
                  value={wageDesc}
                  onChange={(e) => setWageDesc(e.target.value)}
                  placeholder="Bar-bending, slab casting muster roll..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowWageRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitWageRequestMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm shadow disabled:opacity-50"
                >
                  {submitWageRequestMutation.isPending ? 'Submitting...' : 'Submit Wage Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MATERIAL EXPENSE CLAIM */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Claim Material Expense</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMaterialMutation.mutate({
                  title: matTitle,
                  description: matDesc,
                  amount: parseFloat(matAmount),
                  category: matCategory || 'General Materials',
                  currency: 'INR',
                  siteId: matSiteId || undefined,
                  expenseYear: currentCalendarYear,
                  startDate: matStartDate,
                  endDate: matEndDate,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. 50 Bags Ultratech Cement"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value)}
                  placeholder="Cement, Sariya, Diesel, Transport..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Project Site</label>
                <select
                  value={matSiteId}
                  onChange={(e) => setMatSiteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Project Site (Optional) --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={matAmount}
                  onChange={(e) => setMatAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={matStartDate}
                    onChange={(e) => setMatStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={matEndDate}
                    onChange={(e) => setMatEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Details / Invoice No</label>
                <textarea
                  rows={2}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Invoice details, supplier name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMaterialMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow disabled:opacity-50"
                >
                  {submitMaterialMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: LABOURER WAGE & ANTI-EXPLOITATION AUDIT */}
      {auditLabourerId && (
        <LabourerAuditModal
          labourerId={auditLabourerId}
          onClose={() => setAuditLabourerId(null)}
        />
      )}

      {/* MODAL: INITIATE SUPERVISOR WAGES / FEE */}
      {showInitiateSupervisorWageModal && (
        <InitiatePaymentModal
          onClose={() => setShowInitiateSupervisorWageModal(false)}
          defaultCategory="Supervisor Wages"
          defaultTitle="Supervisor Monthly Wage / Site Supervision"
          targetRoleLabel="Request My Supervisor Wages / Fee"
        />
      )}

      {/* MODAL: EDIT LABOURER & REASSIGN SITE */}
      {editingLabourer && (
        <EditLabourerModal
          labourer={editingLabourer}
          isAdmin={false}
          onClose={() => setEditingLabourer(null)}
        />
      )}
    </div>
  );
};
