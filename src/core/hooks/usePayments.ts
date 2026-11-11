import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  PaymentRequest,
  PaymentFilterQuery,
  PagedPaymentsResponse,
  CreatePaymentDto,
  FinanceMetrics,
  ExportJobStatusResponse,
} from '../types';

export const usePaymentsQuery = (query: PaymentFilterQuery) => {
  return useQuery<PagedPaymentsResponse>({
    queryKey: ['payments', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', query.year.toString());
      if (query.status) params.append('status', query.status);
      if (query.category) params.append('category', query.category);
      if (query.siteId) params.append('siteId', query.siteId);
      if (query.requesterId) params.append('requesterId', query.requesterId);
      if (query.search) params.append('search', query.search);
      if (query.startDate) params.append('startDate', query.startDate);
      if (query.endDate) params.append('endDate', query.endDate);
      if (query.page) params.append('page', query.page.toString());
      if (query.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query.onlyMine) params.append('onlyMine', 'true');
      if (query.scope) params.append('scope', query.scope);

      const res = await apiClient.get<PagedPaymentsResponse>(`/payments?${params.toString()}`);
      return res.data;
    },
  });
};

export const usePaymentDetailQuery = (id: string | null) => {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<PaymentRequest>(`/payments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreatePaymentDto) => {
      const res = await apiClient.post<PaymentRequest>('/payments', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });
};

export const useApprovePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comments, version }: { id: string; comments?: string; version: number }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${id}/approve`, { comments, version });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });
};

export const useRejectPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, version }: { id: string; reason: string; version: number }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${id}/reject`, { reason, version });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });
};

export const useMarkPaidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comments, version }: { id: string; comments?: string; version: number }) => {
      const res = await apiClient.post<PaymentRequest>(`/payments/${id}/mark-paid`, { comments, version });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });
};

export const useFinanceMetricsQuery = (year: number) => {
  return useQuery({
    queryKey: ['admin-metrics', year],
    queryFn: async () => {
      const res = await apiClient.get<FinanceMetrics>(`/admin/metrics?year=${year}`);
      return res.data;
    },
  });
};

export const useExportReportMutation = () => {
  return useMutation({
    mutationFn: async (year: number) => {
      const res = await apiClient.post<ExportJobStatusResponse>('/reports/export-async', { year });
      return res.data;
    },
  });
};

export const useExportStatusQuery = (jobId: string | null) => {
  return useQuery({
    queryKey: ['export-status', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiClient.get<ExportJobStatusResponse>(`/reports/status/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'Completed' || data?.status === 'Failed') {
        return false;
      }
      return 1500; // Poll every 1.5s until ready
    },
  });
};
