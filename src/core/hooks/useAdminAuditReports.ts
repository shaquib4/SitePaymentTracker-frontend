import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { AdminAuditPackRequest, AuditReportJobItem } from '../types';

export function useAdminAuditReports(enabled: boolean) {
  const queryClient = useQueryClient();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
      setBannerMessage({
        type: 'success',
        text: `Audit pack queued in background (${created.periodLabel}). Breakdown PDF + Expenses Excel will be emailed to ${created.requestedByEmail} and saved in Audit Files.`,
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
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail || err?.message || `Failed to download ${format.toUpperCase()} file.`;
        setBannerMessage({ type: 'error', text: String(detail) });
      } finally {
        setDownloadingKey(null);
      }
    },
    []
  );

  const activeJobsCount = auditFiles.filter(
    (f) => f.statusName === 'Queued' || f.statusName === 'Processing'
  ).length;

  return {
    auditFiles,
    isLoading,
    refetch,
    activeJobsCount,
    isQueueing: queueMutation.isPending,
    queueAuditPack: queueMutation.mutate,
    deleteAuditFile: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    downloadingKey,
    downloadAuditFile,
    bannerMessage,
    clearBannerMessage: () => setBannerMessage(null),
  };
}
