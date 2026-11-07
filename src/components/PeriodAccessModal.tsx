import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import { PeriodAccessRequestDto } from '../core/types';
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  Send
} from 'lucide-react';

interface PeriodAccessModalProps {
  onClose: () => void;
  isAdmin?: boolean;
}

export const PeriodAccessModal: React.FC<PeriodAccessModalProps> = ({ onClose, isAdmin = false }) => {
  const queryClient = useQueryClient();
  const [targetYear, setTargetYear] = useState<number>(2025);
  const [reason, setReason] = useState<string>('');

  // Queries
  const { data: accountantRequests = [], isLoading: accountantLoading } = useQuery<PeriodAccessRequestDto[]>({
    queryKey: ['my-period-access-requests'],
    queryFn: async () => {
      const res = await apiClient.get<PeriodAccessRequestDto[]>('/period-access/my-requests');
      return res.data;
    },
    enabled: !isAdmin,
  });

  const { data: adminPendingRequests = [], isLoading: adminLoading } = useQuery<PeriodAccessRequestDto[]>({
    queryKey: ['admin-period-access-requests'],
    queryFn: async () => {
      const res = await apiClient.get<PeriodAccessRequestDto[]>('/period-access/pending');
      return res.data;
    },
    enabled: isAdmin,
  });

  // Mutations
  const submitRequestMutation = useMutation({
    mutationFn: async ({ year, reqReason }: { year: number; reqReason: string }) => {
      const res = await apiClient.post<PeriodAccessRequestDto>('/period-access/request', {
        targetYear: year,
        reason: reqReason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-period-access-requests'] });
      setReason('');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ reqId, approve, notes }: { reqId: string; approve: boolean; notes?: string }) => {
      const res = await apiClient.post<PeriodAccessRequestDto>(`/period-access/${reqId}/review`, {
        approve,
        adminNotes: notes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-period-access-requests'] });
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAdmin ? 'Accountant Period Access Requests' : 'Request Historical Period Access'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Approve or reject Accountant requests to audit historical locked financial years.'
                  : 'Accountant view is restricted to active year by default. Request Admin clearance to audit past years.'}
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

        {/* Accountant Form (Submit new request) */}
        {!isAdmin && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Send className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              Submit Out-of-Bounds Year Request
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Historical Year:</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={2025}>2025 (Previous Fiscal Year)</option>
                  <option value={2024}>2024 (Archive Year)</option>
                  <option value={2023}>2023 (Archive Year)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Business Justification / Reason:</label>
                <input
                  type="text"
                  placeholder="e.g. Income Tax Audit / Reconciliation with Client MB"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!reason.trim() || submitRequestMutation.isPending}
                onClick={() => submitRequestMutation.mutate({ year: targetYear, reqReason: reason })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center"
              >
                {submitRequestMutation.isPending ? 'Sending Request...' : 'Send Request to Admin'}
              </button>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'All Period Access Requests' : 'Your Submitted Period Requests'}
          </h4>

          {(isAdmin ? adminLoading : accountantLoading) ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading period requests...</div>
          ) : (isAdmin ? adminPendingRequests : accountantRequests).length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
              No historical period requests on record.
            </div>
          ) : (
            <div className="space-y-2.5">
              {(isAdmin ? adminPendingRequests : accountantRequests).map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">Target Year: {req.targetYear}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Reason: <span className="text-slate-400">{req.reason}</span>
                    </p>

                    <div className="text-[11px] text-slate-500">
                      Requested by: {req.requestedByUserName} on{' '}
                      {new Date(req.createdAtUtc).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>

                    {req.adminNotes && (
                      <div className="text-[11px] text-emerald-400 italic">
                        Admin Note: {req.adminNotes}
                      </div>
                    )}
                  </div>

                  {isAdmin && req.status === 'Pending' && (
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      <button
                        onClick={() => reviewMutation.mutate({ reqId: req.id, approve: true, notes: 'Approved for audit' })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ reqId: req.id, approve: false, notes: 'Rejected by Admin' })}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
