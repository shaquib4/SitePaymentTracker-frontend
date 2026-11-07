import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import { ExpenseCategory, Site, PaymentRequest } from '../core/types';
import { useAuth } from '../core/auth/AuthContext';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Coins
} from 'lucide-react';

interface InitiatePaymentModalProps {
  onClose: () => void;
  defaultCategory?: string;
  defaultTitle?: string;
  defaultSiteId?: string;
  targetRoleLabel?: string; // e.g. "Supervisor Wage Claim" or "Accountant Salary Request" or "Admin Payment Request"
}

export const InitiatePaymentModal: React.FC<InitiatePaymentModalProps> = ({
  onClose,
  defaultCategory = '',
  defaultTitle = '',
  defaultSiteId = '',
  targetRoleLabel,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>(
    defaultCategory ? 'new' : 'existing'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState(defaultCategory);
  const [siteId, setSiteId] = useState(defaultSiteId);
  const [expenseYear, setExpenseYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active categories
  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<ExpenseCategory[]>('/categories');
      return res.data;
    },
  });

  // Fetch active project sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await apiClient.get<Site[]>('/sites');
      return res.data;
    },
  });

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = parseFloat(amount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new Error('Please enter a valid payment amount greater than zero.');
      }

      if (!title.trim()) {
        throw new Error('Please provide an expense / wage claim title.');
      }

      if (!startDate || !endDate) {
        throw new Error('Start and End dates are required.');
      }

      const finalCategory =
        categoryMode === 'existing'
          ? categories.find((c) => c.id === selectedCategoryId)?.name || 'General'
          : customCategory.trim() || 'General';

      const payload = {
        title: title.trim(),
        description: description.trim(),
        amount: finalAmount,
        currency: 'INR',
        category: finalCategory,
        categoryId: categoryMode === 'existing' && selectedCategoryId ? selectedCategoryId : null,
        siteId: siteId || null,
        expenseYear: expenseYear,
        startDate,
        endDate,
        invoiceNumber: invoiceNumber.trim() || null,
        receiptAttachmentPath: null,
      };

      const res = await apiClient.post<PaymentRequest>('/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sites-profitability'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || err.message || 'Failed to submit payment request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    initiateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {targetRoleLabel || 'Initiate Payment / Wage Claim'}
              </h2>
              <p className="text-xs text-slate-400">
                Submitted by <span className="text-amber-400 font-bold">{user?.fullName || 'User'}</span> ({user?.role})
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

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Claim Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Title / Purpose *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Supervisor Fee - Metro Site / Head Office IT Equipment"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Amount & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
                <Coins className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Amount (₹ INR) *
              </label>
              <input
                type="number"
                step="any"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Expense Fiscal Year
              </label>
              <input
                type="number"
                required
                value={expenseYear}
                onChange={(e) => setExpenseYear(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Date Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Project Site (Optional / Assigned Site) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Project Site (Optional / Linked Location)
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">General / Head Office (No Specific Site)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.location ? `(${s.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Expense / Wage Category *
            </label>

            <div className="flex space-x-4 text-xs">
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="modalCategoryMode"
                  checked={categoryMode === 'existing'}
                  onChange={() => setCategoryMode('existing')}
                  className="mr-1.5 text-amber-500 focus:ring-amber-500"
                />
                Choose Pre-existing
              </label>
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="modalCategoryMode"
                  checked={categoryMode === 'new'}
                  onChange={() => setCategoryMode('new')}
                  className="mr-1.5 text-amber-500 focus:ring-amber-500"
                />
                Type New Category (e.g. Salary / Wages)
              </label>
            </div>

            {categoryMode === 'existing' ? (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Salary, Supervisor Wages, Travel Allowance"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Description & Work Justification
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context, hours/days breakdown, or purchase order details..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Optional Invoice # */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Invoice / Voucher # (Optional)
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-089"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Multi-Admin Peer Approval Note */}
          {user?.role === 'Admin' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start space-x-2">
              <span className="font-bold shrink-0">🛡️ Peer Approval Rule:</span>
              <span>
                As an Admin, once you initiate this payment request, it requires review and approval by one of the other 3 Admins. Self-approval is strictly prevented.
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={initiateMutation.isPending}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors flex items-center"
            >
              {initiateMutation.isPending ? 'Submitting...' : 'Submit Payment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
