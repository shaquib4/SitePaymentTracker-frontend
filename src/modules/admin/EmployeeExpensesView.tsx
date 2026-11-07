import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../core/api/client';
import { UserHistoryResponse, UserHistoryItem, Site } from '../../core/types';
import { ExpensePieChart } from '../../components/ExpensePieChart';
import {
  ArrowLeft,
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Search,
  Layers,
  Building2
} from 'lucide-react';

interface EmployeeExpensesViewProps {
  userId: string;
  onBack: () => void;
  year?: number;
}

export const EmployeeExpensesView: React.FC<EmployeeExpensesViewProps> = ({
  userId,
  onBack,
  year = 2026,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('');

  // Query Project Sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await apiClient.get<Site[]>('/sites');
      return res.data;
    },
  });

  // Quick preset helper (Simplified to Full Year & Last 30 Days)
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

  // Query User History with Date Filtering
  const { data: userProfile, isLoading } = useQuery<UserHistoryResponse>({
    queryKey: ['employee-history', userId, startDate, endDate],
    queryFn: async () => {
      let url = `/users/${userId}/history`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiClient.get<UserHistoryResponse>(url);
      return res.data;
    },
  });

  const historyItems: UserHistoryItem[] = userProfile?.history || userProfile?.historicalRequests || [];

  // Filter items by site, status & search
  const filteredItems = historyItems.filter((item) => {
    if (selectedSiteFilter && item.siteId !== selectedSiteFilter && item.siteName !== selectedSiteFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.siteName && item.siteName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate Category breakdown for this employee in this period (Strictly approved/completed only)
  const categoryMap = new Map<string, { total: number; count: number }>();
  filteredItems
    .filter((i) => i.status === 'Approved' || (i.status as any) === 'Completed')
    .forEach((item) => {
      const cat = item.category || 'General';
      const curr = categoryMap.get(cat) || { total: 0, count: 0 };
      categoryMap.set(cat, { total: curr.total + (item.amount || 0), count: curr.count + 1 });
    });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    totalAmount: val.total,
    count: val.count,
  }));

  const periodApproved = filteredItems
    .filter((i) => i.status === 'Approved' || (i.status as any) === 'Completed')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const periodPending = filteredItems
    .filter((i) => i.status === 'Pending' || i.status === 'InfoRequested')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const periodGrandTotal = filteredItems.reduce((sum, i) => sum + (i.amount || 0), 0);

  const cleanPhone = (userProfile?.phoneNumber || '').replace(/[^0-9]/g, '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-semibold text-sm transition-colors shadow"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Master Dashboard
        </button>

        <span className="text-xs text-slate-400">
          Showing Individual Expense Ledger for Active Year {year}
        </span>
      </div>

      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Loading employee profile and expense records...
        </div>
      ) : !userProfile ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-rose-400">
          Employee profile not found.
        </div>
      ) : (
        <>
          {/* Employee Hero Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-black">
                {userProfile.fullName ? userProfile.fullName.charAt(0) : 'E'}
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl font-black text-white">{userProfile.fullName}</h1>
                  <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded border border-slate-700">
                    ID: {userProfile.sixDigitUserId || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {userProfile.role} • {userProfile.department} {userProfile.email ? `• ${userProfile.email}` : ''}
                </p>

                {/* Contact Bar with click to call & WhatsApp */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <a
                    href={`tel:${userProfile.phoneNumber}`}
                    className="inline-flex items-center text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    title="Click to Call Employee Directly"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Call: {userProfile.phoneNumber}
                  </a>

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors"
                      title="Open WhatsApp chat with Employee"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      WhatsApp
                    </a>
                  )}

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      userProfile.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {userProfile.isActive ? 'Active Employee' : 'Deactivated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifetime totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Lifetime Approved</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  ₹{(userProfile.totalApprovedAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Lifetime Pending</span>
                <span className="text-xl font-mono font-bold text-amber-300">
                  ₹{(userProfile.totalPendingAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Claims</span>
                <span className="text-xl font-mono font-bold text-white">
                  {userProfile.totalRequestsCount || historyItems.length}
                </span>
              </div>
            </div>
          </div>

          {/* CALENDAR DATE FILTER CONTROL BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Calendar Date Range Filter
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filter this employee's expenses to any specific date range or period
                </p>
              </div>

              {/* Quick Presets */}
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
                  All Year ({year})
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

            {/* Date Pickers & Site Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Filter by Site:
                </label>
                <select
                  value={selectedSiteFilter}
                  onChange={(e) => setSelectedSiteFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Project Sites (Full View)</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  From Date (Start):
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
                  To Date (End):
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
                  Filter by Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="InfoRequested">Info Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter('');
                    setSearchFilter('');
                    setSelectedSiteFilter('');
                  }}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm border border-slate-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>

          {/* PERIOD EXPENSE SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {startDate || endDate ? 'Period Approved Expense' : 'Total Approved Expense'}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-400">
                ₹{periodApproved.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {startDate && endDate ? `${startDate} to ${endDate}` : `Full active year ${year}`}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {startDate || endDate ? 'Period Pending Claims' : 'Pending Claims'}
                </span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-300">
                ₹{periodPending.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">Awaiting approval in this period</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Period Grand Total</span>
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                ₹{periodGrandTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Across {filteredItems.length} transactions in this timeframe
              </p>
            </div>
          </div>

          {/* Interactive Expense Pie Chart for this Employee's Approved Spend */}
          {categoryBreakdown.length > 0 && (
            <ExpensePieChart
              categoryBreakdowns={categoryBreakdown}
            />
          )}

          {/* DETAILED PAYMENT LEDGER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Payment Records ({filteredItems.length})
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Mobile Card Grid (Phone view < md) */}
            <div className="p-4 grid grid-cols-1 gap-3 md:hidden">
              {filteredItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No expense records found for this employee in the selected period.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded text-xs">
                          {item.category}
                        </span>
                        {item.siteName && (
                          <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center">
                            <Building2 className="w-3 h-3 mr-1 text-blue-400" />
                            {item.siteName}
                          </span>
                        )}
                        {item.labourerName && (
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Worker: {item.labourerName}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.status === 'InfoRequested'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xl font-black font-mono text-white">
                        ₹{(item.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">{item.title}</div>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="text-slate-200">{item.startDate} → {item.endDate}</span>
                      </div>
                      {item.approvalDate && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Approved:</span>
                          <span>{new Date(item.approvalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    {item.approvalComments && (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                        Approval Note: {item.approvalComments}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (md and above) */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category & Site</th>
                  <th className="py-3 px-4">Calendar Dates Record</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Audit / Approval Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No expense records found for this employee in the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-slate-400 line-clamp-1">{item.description}</span>
                        )}
                        {item.labourerName && (
                          <span className="inline-block mt-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Worker: {item.labourerName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-xs font-medium">
                          {item.category}
                        </span>
                        {item.siteName && (
                          <span className="block text-[11px] text-slate-400 mt-1">
                            Site: {item.siteName}
                          </span>
                        )}
                      </td>

                      {/* PAYMENT DATE RECORD FOR EACH APPROVAL REQUESTED & APPROVED */}
                      <td className="py-3 px-4 text-xs font-mono space-y-1">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">Expense Duration:</span>
                          <span className="text-slate-200">
                            {item.startDate} → {item.endDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">Requested Date:</span>
                          <span className="text-amber-400/90">
                            {item.requestDate ? new Date(item.requestDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'N/A'}
                          </span>
                        </div>
                        {item.approvalDate && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase block">Approved On:</span>
                            <span className="text-emerald-400">
                              {new Date(item.approvalDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white text-base">
                        ₹{(item.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

                      <td className="py-3 px-4 text-xs text-slate-400">
                        {item.approvalComments ? (
                          <span className="text-emerald-400 font-medium">{item.approvalComments}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}
    </div>
  );
};
