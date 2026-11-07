import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import { LabourerWageAuditResponse } from '../core/types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Calendar,
  CheckCircle2,
  HelpCircle,
  UserCheck
} from 'lucide-react';

interface LabourerAuditModalProps {
  labourerId: string;
  onClose: () => void;
}

export const LabourerAuditModal: React.FC<LabourerAuditModalProps> = ({ labourerId, onClose }) => {
  const { data: audit, isLoading } = useQuery<LabourerWageAuditResponse>({
    queryKey: ['labourer-wage-history', labourerId],
    queryFn: async () => {
      const res = await apiClient.get<LabourerWageAuditResponse>(`/labourers/${labourerId}/wage-history`);
      return res.data;
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Labourer Wage & Anti-Exploitation Audit</h2>
              <p className="text-xs text-slate-400">
                Transparent payout ledger: Verify when this worker was paid, total working days, and supervisor wage parity.
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

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Auditing worker payouts and calculating wage rate parity...
          </div>
        ) : !audit ? (
          <div className="py-12 text-center text-rose-400 text-sm">
            Unable to load wage audit record for this worker.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Worker & Supervisor Profile Banner */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Labourer Details */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Worker Profile</span>
                <div className="text-lg font-black text-white">{audit.name}</div>
                <div className="text-xs text-amber-400 font-mono font-bold">
                  Registered Wage: ₹{audit.dailyWageRate.toLocaleString('en-IN')} / day
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    audit.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {audit.isActive ? 'Active Worker' : 'Inactive'}
                </span>
              </div>

              {/* Assigned Supervisor */}
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Supervisor</span>
                <div className="text-sm font-bold text-white">{audit.supervisorName}</div>
                <div className="text-xs text-slate-400 font-mono">ID: {audit.supervisorSixDigitId || 'N/A'}</div>
                {audit.supervisorPhone && (
                  <a
                    href={`tel:${audit.supervisorPhone}`}
                    className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-mono mt-1"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    {audit.supervisorPhone}
                  </a>
                )}
              </div>

              {/* Who Added Whom */}
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Onboarding Authority</span>
                <div className="text-sm font-semibold text-white flex items-center">
                  <UserCheck className="w-4 h-4 mr-1 text-blue-400" />
                  Added by: {audit.createdByUserName}
                </div>
                <div className="text-xs text-slate-400">
                  Role: <span className="text-blue-300 font-medium">{audit.createdByUserRole}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Date: {new Date(audit.createdAtUtc).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Anti-Exploitation Wage Health Card */}
            <div
              className={`border rounded-2xl p-5 space-y-3 ${
                audit.exploitationRisk === 'Clean / Verified'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : audit.exploitationRisk === 'Under-Payment Risk'
                  ? 'bg-violet-950/20 border-violet-500/30'
                  : audit.exploitationRisk === 'Over-Claim Anomaly'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {audit.exploitationRisk === 'Clean / Verified' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : audit.exploitationRisk === 'No History' ? (
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Anti-Exploitation Status: {audit.exploitationRisk}
                  </h4>
                </div>

                <div className="font-mono text-xs font-bold text-slate-300">
                  Total Discrepancy Variance:{' '}
                  <span
                    className={
                      audit.totalVariance === 0
                        ? 'text-emerald-400'
                        : audit.totalVariance > 0
                        ? 'text-amber-400'
                        : 'text-violet-400'
                    }
                  >
                    {audit.totalVariance > 0 ? `+₹${audit.totalVariance.toLocaleString('en-IN')}` : `₹${audit.totalVariance.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {audit.exploitationRiskDescription}
              </p>

              {/* 4 Financial KPI boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Days Claimed</span>
                  <span className="text-base font-black text-white font-mono">{audit.totalDaysClaimed} Days</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expected Wages</span>
                  <span className="text-base font-black text-white font-mono">₹{audit.expectedTotalWages.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Claimed</span>
                  <span className="text-base font-black text-amber-300 font-mono">₹{audit.totalClaimedAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approved & Disbursed</span>
                  <span className="text-base font-black text-emerald-400 font-mono">₹{audit.totalApprovedAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payouts Ledger ("When They Got What") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-amber-400" />
                  Chronological Payout Ledger ("When They Got What")
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{audit.payouts.length} Payment Claims</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Claim & Site</th>
                      <th className="py-3 px-3">Work Duration</th>
                      <th className="py-3 px-3">Expected vs Claimed</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Submission & Approval Timestamps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {audit.payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No wage payment claims have been requested for this worker yet.
                        </td>
                      </tr>
                    ) : (
                      audit.payouts.map((p) => (
                        <tr key={p.paymentId} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block text-sm">{p.title}</span>
                            {p.siteName && (
                              <span className="text-[11px] text-amber-400/90 font-medium block">
                                Project: {p.siteName}
                              </span>
                            )}
                            {p.description && (
                              <span className="text-slate-400 text-[11px] line-clamp-1">{p.description}</span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono space-y-0.5">
                            <div className="text-white">
                              {p.startDate} → {p.endDate}
                            </div>
                            <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {p.claimDays} Days
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono space-y-0.5">
                            <div className="text-slate-400 text-[11px]">
                              Expected: ₹{p.expectedWage.toLocaleString('en-IN')}
                            </div>
                            <div className="text-sm font-bold text-white">
                              Claimed: ₹{p.actualAmount.toLocaleString('en-IN')}
                            </div>
                            {p.hasDiscrepancy && (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  p.variance > 0
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-violet-500/20 text-violet-300'
                                }`}
                              >
                                {p.variance > 0 ? `+₹${p.variance}` : `₹${p.variance}`} Variance
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

                          <td className="py-3 px-3 font-mono text-[11px] space-y-1">
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase block">Requested:</span>
                              <span className="text-amber-400/90">
                                {new Date(p.requestDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                by {p.requestedBySupervisorName}
                              </span>
                            </div>

                            {p.approvalDate && (
                              <div>
                                <span className="text-slate-500 text-[10px] uppercase block">Approved:</span>
                                <span className="text-emerald-400">
                                  {new Date(p.approvalDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  by {p.approvedByUserName || 'Admin'}
                                </span>
                              </div>
                            )}

                            {p.approvalComments && (
                              <div className="text-[10px] text-emerald-300 font-sans italic">
                                Note: {p.approvalComments}
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
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Audit Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
