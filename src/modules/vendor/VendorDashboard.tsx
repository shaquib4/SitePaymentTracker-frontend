import React from 'react';
import { Store, Lock } from 'lucide-react';

export const VendorDashboard: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-flex p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
        <Store className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">Vendor Portal (Phase 2)</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          Direct supplier invoice submissions, GST input matching, and purchase order reconciliation are scheduled for Phase 2 expansion.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto text-left space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Status: Locked Down & Ready</span>
        </div>
        <p className="text-xs text-slate-300">
          Backend API endpoints and tenant isolation models are pre-wired for vendor role authentication.
        </p>
      </div>
    </div>
  );
};
