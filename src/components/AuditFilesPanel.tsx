import React from 'react';
import { AuditReportJobItem, EmailConfigurationStatus } from '../core/types';
import {
  FileText,
  FileSpreadsheet,
  Mail,
  Download,
  RefreshCw,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderArchive,
  X
} from 'lucide-react';

interface AuditFilesPanelProps {
  auditFiles: AuditReportJobItem[];
  emailStatus?: EmailConfigurationStatus;
  isLoading: boolean;
  onRefresh: () => void;
  onDownload: (jobId: string, format: 'pdf' | 'xlsx', fileName: string) => void;
  onRegenerate: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  downloadingKey: string | null;
  regeneratingId: string | null;
  recipientEmailOverride: string;
  onChangeRecipientEmailOverride: (email: string) => void;
  defaultAdminEmail?: string;
}

export const AuditFilesPanel: React.FC<AuditFilesPanelProps> = ({
  auditFiles,
  emailStatus,
  isLoading,
  onRefresh,
  onDownload,
  onRegenerate,
  onDelete,
  downloadingKey,
  regeneratingId,
  recipientEmailOverride,
  onChangeRecipientEmailOverride,
  defaultAdminEmail,
}) => {
  const renderStatusBadge = (statusName: string) => {
    switch (statusName) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'Processing':
      case 'Queued':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {statusName}...
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3 mr-1" />
            {statusName}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Notification Email Preference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30 flex-shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Admin Audit Files &amp; Background Reports</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates a <strong className="text-slate-200">Breakdown-only PDF</strong> + <strong className="text-slate-200">Expenses Excel</strong> (100k-row streamed). Binaries are automatically cleared from PostgreSQL once downloaded—filename, date range &amp; filters stay saved so you can click <strong className="text-amber-300">Regenerate</strong> anytime.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[240px]">
              <Mail className="w-3.5 h-3.5 text-amber-400 mr-2 flex-shrink-0" />
              <input
                type="email"
                value={recipientEmailOverride}
                onChange={(e) => onChangeRecipientEmailOverride(e.target.value)}
                placeholder={`Notify email (${defaultAdminEmail || 'admin email'})`}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                title="Recipient email for new & regenerated Audit Pack notifications"
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Mail Provider Status Diagnostic Banner */}
        {emailStatus && (
          <div
            className={`flex items-start space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs border ${
              emailStatus.isConfigured
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}
          >
            <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">
                Mail Delivery Status ({emailStatus.provider}):{' '}
              </strong>
              <span>{emailStatus.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
          Loading audit history...
        </div>
      ) : auditFiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <FolderArchive className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Audit Packs Generated Yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong className="text-amber-300">Breakdown PDF + Excel</strong> beside the Expense Category Distribution chart (or inside any Site view) to queue a background report for your active filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditFiles.map((file) => {
            const pdfLoading = downloadingKey === `${file.id}:pdf`;
            const xlsxLoading = downloadingKey === `${file.id}:xlsx`;
            const isRegenerating =
              regeneratingId === file.id ||
              file.statusName === 'Queued' ||
              file.statusName === 'Processing';

            return (
              <div
                key={file.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{file.reportTitle}</span>
                    {renderStatusBadge(file.statusName)}
                    <span className="text-[11px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {file.periodLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Filters: <strong className="text-slate-200">{file.filterSummary}</strong>
                  </p>

                  {/* Saved Filenames & Storage/Download State */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    {file.pdfFileName && (
                      <span>
                        PDF File:{' '}
                        <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">
                          {file.pdfFileName}
                        </code>
                        {!file.hasPdf && file.pdfDownloadedAtUtc && (
                          <span className="ml-1 text-slate-400 italic">
                            (Downloaded &amp; cleared {new Date(file.pdfDownloadedAtUtc).toLocaleTimeString('en-IN')})
                          </span>
                        )}
                      </span>
                    )}
                    {file.excelFileName && (
                      <span>
                        Excel File:{' '}
                        <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">
                          {file.excelFileName}
                        </code>
                        {!file.hasExcel && file.excelDownloadedAtUtc && (
                          <span className="ml-1 text-slate-400 italic">
                            (Downloaded &amp; cleared {new Date(file.excelDownloadedAtUtc).toLocaleTimeString('en-IN')})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span>
                      Records: <strong className="text-white">{file.totalRecords.toLocaleString('en-IN')}</strong>
                    </span>
                    <span>
                      Requested:{' '}
                      <strong className="text-indigo-300 font-mono">
                        ₹{(file.totalRequestedAmount ?? 0).toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span>
                      Approved/Disbursed:{' '}
                      <strong className="text-emerald-300 font-mono">
                        ₹{(file.totalApprovedAmount ?? 0).toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span>
                      Queued: <span className="text-slate-300">{new Date(file.queuedAtUtc).toLocaleString('en-IN')}</span>
                    </span>
                  </div>

                  {file.emailDeliveryNote && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1 inline-flex">
                      <Mail className={`w-3.5 h-3.5 flex-shrink-0 ${file.emailDispatched ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>{file.emailDeliveryNote}</span>
                    </div>
                  )}

                  {file.errorMessage && (
                    <p className="text-xs text-rose-400 font-medium">{file.errorMessage}</p>
                  )}
                </div>

                {/* Download, Regenerate & Delete Actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={!file.hasPdf || pdfLoading}
                    onClick={() => onDownload(file.id, 'pdf', file.pdfFileName)}
                    className="inline-flex items-center px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors"
                    title={
                      file.hasPdf
                        ? 'Download Breakdown PDF (binary clears from DB after download)'
                        : 'Already downloaded & cleared — click Regenerate to rebuild'
                    }
                  >
                    {pdfLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {file.hasPdf
                      ? 'Breakdown PDF'
                      : file.pdfDownloadedAtUtc
                        ? 'PDF Cleared'
                        : 'Breakdown PDF'}
                    {file.hasPdf && <Download className="w-3 h-3 ml-1.5 opacity-80" />}
                  </button>

                  <button
                    type="button"
                    disabled={!file.hasExcel || xlsxLoading}
                    onClick={() => onDownload(file.id, 'xlsx', file.excelFileName)}
                    className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs shadow transition-colors"
                    title={
                      file.hasExcel
                        ? 'Download Expenses Excel (binary clears from DB after download)'
                        : 'Already downloaded & cleared — click Regenerate to rebuild'
                    }
                  >
                    {xlsxLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {file.hasExcel
                      ? 'Expenses Excel'
                      : file.excelDownloadedAtUtc
                        ? 'Excel Cleared'
                        : 'Expenses Excel'}
                    {file.hasExcel && <Download className="w-3 h-3 ml-1.5 opacity-80" />}
                  </button>

                  <button
                    type="button"
                    disabled={isRegenerating}
                    onClick={() => onRegenerate(file.id)}
                    className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-colors"
                    title="Regenerate fresh PDF & Excel files in background using saved date range & filter details"
                  >
                    {isRegenerating ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Regenerate
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(file.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/40 transition"
                    title="Delete entry & saved filter history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface AuditFilesModalProps extends AuditFilesPanelProps {
  onClose: () => void;
}

export const AuditFilesModal: React.FC<AuditFilesModalProps> = ({ onClose, ...panelProps }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FolderArchive className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Audit Files &amp; Downloads</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <AuditFilesPanel {...panelProps} />
        </div>
      </div>
    </div>
  );
};
