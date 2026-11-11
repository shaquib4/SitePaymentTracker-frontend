import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  AdminAuditPackRequest,
  AuditReportJobItem,
  EmailConfigurationStatus,
} from '../types';

export function useAdminAuditReports(enabled: boolean) {
  const queryClient = useQueryClient();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data: emailStatus } = useQuery<EmailConfigurationStatus>({
    queryKey: ['admin-email-status'],
    queryFn: async () => {
      const res = await apiClient.get<EmailConfigurationStatus>('/reports/email-status');
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });

  const {
    data: auditFiles = [],
    isLoading,
    refetch,
  } = useQuery<AuditReportJobItem[]>({
    queryKey: ['admin-audit-files'],
    queryFn: async () => {
      const res = await apiClient.get<AuditReportJobItem[]>('/reports/admin-files');
      return res.data;
    },
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        Array.isArray(data) &&
        data.some((item) => item.statusName === 'Queued' || item.statusName === 'Processing')
      ) {
        return 2500;
      }
      return false;
    },
  });

  const queueMutation = useMutation({
    mutationFn: async (payload: AdminAuditPackRequest) => {
      const res = await apiClient.post<AuditReportJobItem>('/reports/admin-audit-pack', payload);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-audit-files'] });
      const mailNote =
        emailStatus?.isConfigured
          ? `Email will be dispatched to ${created.requestedByEmail} once ready.`
          : `Note: Server SMTP/Resend email is not configured yet — download directly from Audit Files once ready.`;
      setBannerMessage({
        type: 'success',
        text: `Audit pack queued in background (${created.periodLabel}). ${mailNote}`,
      });
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        'Failed to queue background audit pack.';
      setBannerMessage({ type: 'error', text: String(detail) });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({
      jobId,
      recipientEmail,
    }: {
      jobId: string;
      recipientEmail?: string;
    }) => {
      setRegeneratingId(jobId);
      const res = await apiClient.post<AuditReportJobItem>(
        `/reports/admin-files/${jobId}/regenerate`,
        recipientEmail ? { recipientEmail } : {}
      );
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-audit-files'] });
      setBannerMessage({
        type: 'success',
        text: `Regenerating "${updated.reportTitle}" in background using saved period (${updated.periodLabel}) & filters.`,
      });
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        'Failed to regenerate audit pack.';
      setBannerMessage({ type: 'error', text: String(detail) });
    },
    onSettled: () => {
      setRegeneratingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiClient.delete(`/reports/admin-files/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-audit-files'] });
    },
  });

  const downloadAuditFile = useCallback(
    async (jobId: string, format: 'pdf' | 'xlsx', fileName: string) => {
      const key = `${jobId}:${format}`;
      setDownloadingKey(key);
      try {
        const res = await apiClient.get(`/reports/admin-files/${jobId}/download/${format}`, {
          responseType: 'blob',
        });
        const blob = new Blob([res.data], {
          type:
            format === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `audit-report.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        // Immediately reflect DB binary purge in UI cache, then confirm with fresh server state
        const nowIso = new Date().toISOString();
        queryClient.setQueryData<AuditReportJobItem[]>(['admin-audit-files'], (prev) =>
          Array.isArray(prev)
            ? prev.map((item) =>
                item.id === jobId
                  ? format === 'pdf'
                    ? { ...item, hasPdf: false, pdfDownloadedAtUtc: nowIso }
                    : { ...item, hasExcel: false, excelDownloadedAtUtc: nowIso }
                  : item
              )
            : prev
        );
        await queryClient.invalidateQueries({ queryKey: ['admin-audit-files'] });

        setBannerMessage({
          type: 'success',
          text: `Downloaded "${fileName}". Binary deleted from DB to save space — click Regenerate anytime to rebuild it.`,
        });
      } catch (err: any) {
        await queryClient.invalidateQueries({ queryKey: ['admin-audit-files'] });
        const status = err?.status ?? err?.response?.status;
        if (status === 410) {
          setBannerMessage({
            type: 'error',
            text: `This ${format.toUpperCase()} file was already downloaded and cleared from DB. Click "Regenerate" to rebuild it from saved filters.`,
          });
        } else {
          const detail =
            err?.response?.data?.detail || err?.message || `Failed to download ${format.toUpperCase()} file.`;
          setBannerMessage({ type: 'error', text: String(detail) });
        }
      } finally {
        setDownloadingKey(null);
      }
    },
    [queryClient]
  );

  const activeJobsCount = auditFiles.filter(
    (f) => f.statusName === 'Queued' || f.statusName === 'Processing'
  ).length;

  return {
    auditFiles,
    emailStatus,
    isLoading,
    refetch,
    activeJobsCount,
    isQueueing: queueMutation.isPending,
    queueAuditPack: queueMutation.mutate,
    regeneratingId,
    regenerateAuditPack: (jobId: string, recipientEmail?: string) =>
      regenerateMutation.mutate({ jobId, recipientEmail }),
    deleteAuditFile: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    downloadingKey,
    downloadAuditFile,
    bannerMessage,
    clearBannerMessage: () => setBannerMessage(null),
  };
}
