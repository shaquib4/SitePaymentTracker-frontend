import React, { useState } from 'react';
import { ApprovePaymentDto, ExpenseCategory } from '../core/types';
import { X, ShieldCheck, AlertCircle, FileText, Coins } from 'lucide-react';

export interface ApprovableExpenseItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  categoryId?: string;
  amount: number;
  requestedAmount?: number;
  version?: number;
}

interface ApproveExpenseModalProps {
  payment: ApprovableExpenseItem;
  categories: ExpenseCategory[];
  currentUserId?: string;
  isPending: boolean;
  defaultComment?: string;
  serverError?: string;
  onClose: () => void;
  onConfirm: (paymentId: string, dto: ApprovePaymentDto) => void;
  onReject?: (paymentId: string, reason: string) => void;
}

export const ApproveExpenseModal: React.FC<ApproveExpenseModalProps> = ({
  payment,
  categories,
  currentUserId,
  isPending,
  defaultComment = 'Approved by Admin',
  serverError,
  onClose,
  onConfirm,
  onReject,
}) => {
  const maxRequestedAmount = Number(
    payment.requestedAmount && payment.requestedAmount > 0 ? payment.requestedAmount : payment.amount
  ) || 0;

  const [approvedAmountInput, setApprovedAmountInput] = useState<string>(String(maxRequestedAmount));
  const [updatedDescription, setUpdatedDescription] = useState<string>(payment.description ?? '');
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>('existing');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(payment.categoryId || '');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isRejectMode, setIsRejectMode] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  const parsedApproved = Number(approvedAmountInput);
  const isAmountValid =
    approvedAmountInput.trim() !== '' &&
    !Number.isNaN(parsedApproved) &&
    parsedApproved > 0 &&
    parsedApproved <= maxRequestedAmount;

  let amountValidationError = '';
  if (approvedAmountInput.trim() === '' || Number.isNaN(parsedApproved) || parsedApproved <= 0) {
    amountValidationError = 'Approved amount must be greater than ₹0.';
  } else if (parsedApproved > maxRequestedAmount) {
    amountValidationError = `Cannot exceed requested amount (₹${maxRequestedAmount.toLocaleString('en-IN')}). Only equal or lower amounts are allowed.`;
  }

  const savings = isAmountValid && parsedApproved < maxRequestedAmount
    ? maxRequestedAmount - parsedApproved
    : 0;

  const isSelfApproval = payment.userId === currentUserId;

  const handleSubmit = () => {
    if (!isAmountValid || isSelfApproval || isPending) return;

    onConfirm(payment.id, {
      version: payment.version ?? 1,
      comments: comments.trim() || defaultComment,
      approvedAmount: parsedApproved,
      updatedDescription: updatedDescription.trim(),
      overrideCategoryId:
        categoryMode === 'existing' && selectedCategoryId ? selectedCategoryId : undefined,
      newCategoryName:
        categoryMode === 'new' && newCategoryName.trim() ? newCategoryName.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header (Always Visible) */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-800/80 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Review, Edit & Approve Expense</h3>
            <p className="text-xs text-slate-400 mt-0.5">{payment.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {onReject && !isRejectMode && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsRejectMode(true)}
                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-lg text-xs transition-colors flex items-center"
                title="Reject this payment claim"
              >
                <X className="w-3.5 h-3.5 mr-1 text-rose-400" />
                Reject
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close approval modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

        {/* Requested vs Editable Approved Amount */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 uppercase font-semibold tracking-wider">Requested Amount</span>
            <span className="font-mono font-bold text-slate-200 text-sm">
              ₹{maxRequestedAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase mb-1 flex items-center justify-between">
              <span className="flex items-center">
                <Coins className="w-3.5 h-3.5 mr-1" />
                Approved Amount (₹)
              </span>
              <span className="text-[11px] font-normal text-slate-400 normal-case">
                Max: ₹{maxRequestedAmount.toLocaleString('en-IN')}
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxRequestedAmount}
              value={approvedAmountInput}
              onChange={(e) => setApprovedAmountInput(e.target.value)}
              className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 ${
                amountValidationError
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-700 focus:ring-amber-500'
              }`}
            />
            {amountValidationError && (
              <p className="text-xs text-rose-400 mt-1 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {amountValidationError}
              </p>
            )}
            {savings > 0 && !amountValidationError && (
              <p className="text-[11px] text-amber-300 mt-1 font-medium">
                Adjusted down by ₹{savings.toLocaleString('en-IN')} (Requested ₹{maxRequestedAmount.toLocaleString('en-IN')} → Approved ₹{parsedApproved.toLocaleString('en-IN')})
              </p>
            )}
          </div>
        </div>

        {/* Editable Expense Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Expense Description (Editable by Admin)
            </span>
            {!payment.description && (
              <span className="text-[10px] font-normal text-slate-400 normal-case">
                None provided by employee
              </span>
            )}
          </label>
          <textarea
            rows={2}
            value={updatedDescription}
            onChange={(e) => setUpdatedDescription(e.target.value)}
            placeholder="Edit employee description or add verification summary..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Categorization Strategy */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
            Categorization Strategy
          </label>
          <div className="flex space-x-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCategoryMode('existing')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                categoryMode === 'existing'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              Select Existing Category
            </button>
            <button
              type="button"
              onClick={() => setCategoryMode('new')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                categoryMode === 'new'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              Type New Category (Auto-Save)
            </button>
          </div>
        </div>

        {categoryMode === 'existing' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Select Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[42px]"
            >
              <option value="">Keep current ({payment.category})</option>
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
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
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
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Verified quote with site engineer..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {isSelfApproval && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Peer Review Required:</strong> You initiated this payment claim. In our 4-admin setup, you cannot approve your own request; one of the other 3 Admins must review and approve it.
            </span>
          </div>
        )}

        {serverError && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        </div>

        {/* Pinned Sticky Footer (Always Visible on Mobile & Desktop) */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 shrink-0">
          {isRejectMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase">Reject Request Reason</span>
                <button
                  type="button"
                  onClick={() => setIsRejectMode(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back to Review
                </button>
              </div>
              <textarea
                rows={2}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejectMode(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectReason.trim() || isPending}
                  onClick={() => onReject && onReject(payment.id, rejectReason.trim())}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {onReject && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsRejectMode(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition-colors flex items-center justify-center min-h-[42px] order-2 sm:order-1"
                >
                  <X className="w-4 h-4 mr-1.5 text-rose-400 shrink-0" />
                  Reject Claim
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending || isSelfApproval || !isAmountValid}
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors disabled:opacity-50 min-h-[42px]"
                >
                  {isPending ? 'Processing...' : `Approve ₹${isAmountValid ? parsedApproved.toLocaleString('en-IN') : '0'}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
