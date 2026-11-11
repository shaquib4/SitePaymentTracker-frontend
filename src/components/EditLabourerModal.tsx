import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';
import { LabourerDto, PagedUsersResponse, Site } from '../core/types';
import {
  X,
  UserCheck,
  Building2,
  Coins,
  AlertCircle,
  Users
} from 'lucide-react';

interface EditLabourerModalProps {
  labourer: LabourerDto;
  onClose: () => void;
  isAdmin?: boolean;
}

export const EditLabourerModal: React.FC<EditLabourerModalProps> = ({
  labourer,
  onClose,
  isAdmin = false,
}) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(labourer.name);
  const [dailyWageRate, setDailyWageRate] = useState<string>(String(labourer.dailyWageRate));
  const [siteId, setSiteId] = useState<string>(labourer.siteId || '');
  const [supervisorId, setSupervisorId] = useState<string>(labourer.supervisorId);
  const [isActive, setIsActive] = useState<boolean>(labourer.isActive);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active project sites for reassignment
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await apiClient.get<Site[]>('/sites');
      return res.data;
    },
  });

  // Fetch active supervisors for Admin reassignment
  const { data: supervisorsData } = useQuery<PagedUsersResponse>({
    queryKey: ['users-supervisors-all'],
    queryFn: async () => {
      const res = await apiClient.get<PagedUsersResponse>('/users?role=Supervisor&all=true');
      return res.data;
    },
    enabled: isAdmin,
  });

  const activeSupervisors = (supervisorsData?.items || []).filter((u) => u.isActive);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const parsedRate = parseFloat(dailyWageRate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        throw new Error('Daily wage rate must be greater than zero.');
      }

      if (!name.trim()) {
        throw new Error('Worker name cannot be blank.');
      }

      const payload = {
        name: name.trim(),
        dailyWageRate: parsedRate,
        siteId: siteId || null,
        supervisorId: isAdmin && supervisorId ? supervisorId : null,
        isActive: isActive,
      };

      const res = await apiClient.put<LabourerDto>(`/labourers/${labourer.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourers'] });
      queryClient.invalidateQueries({ queryKey: ['labourer-wage-history', labourer.id] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || err.message || 'Failed to update labourer details.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    updateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Edit Labourer & Site Assignment</h2>
              <p className="text-xs text-slate-400">
                Update daily rate, reassign to a new project site, or change active status
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
          {/* Worker Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Labourer Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Daily Wage Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
              <Coins className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Registered Daily Wage Rate (₹ / Day) *
            </label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={dailyWageRate}
              onChange={(e) => setDailyWageRate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reassign Project Site */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Assigned Project Site (Reassign Location)
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned (No Fixed Site)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.location ? `(${s.location})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently assigned: <span className="text-white font-medium">{labourer.siteName || 'Unassigned'}</span>
            </p>
          </div>

          {/* Reassign Supervisor (Admin Only) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-blue-400" />
                Assigned Supervisor (Admin Transfer)
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activeSupervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.phoneNumber}) - ID: {s.sixDigitUserId}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="labourerActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
            <label htmlFor="labourerActiveCheck" className="text-sm font-medium text-slate-300 cursor-pointer">
              Active Worker (Eligible for wage claims)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

