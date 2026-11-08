import React from 'react';
import { useAuth } from '../core/auth/AuthContext';
import { Building2, LogOut, ShieldCheck, Calculator, HardHat, Store, User as UserIcon, Smartphone, Briefcase } from 'lucide-react';
import { usePwaInstall, InstallPwaModal } from './InstallPwaModal';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isAccountant, isSupervisor, isOfficeWorker } = useAuth();
  const { isStandalone, showModal, setShowModal, triggerInstall } = usePwaInstall();

  if (!user) return null;

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Admin
        </span>
      );
    }
    if (isAccountant) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Calculator className="w-3.5 h-3.5 mr-1" />
          Accountant
        </span>
      );
    }
    if (isSupervisor) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <HardHat className="w-3.5 h-3.5 mr-1" />
          Supervisor
        </span>
      );
    }
    if (isOfficeWorker) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <Briefcase className="w-3.5 h-3.5 mr-1" />
          Office Worker
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
        <Store className="w-3.5 h-3.5 mr-1" />
        Vendor
      </span>
    );
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-950 font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white">KE Payment Tracker</span>
              <span className="text-[10px] uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Company: <span className="text-amber-400 font-medium">{user.tenantName || 'Khan Enterprises'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!isStandalone && (
            <button
              onClick={triggerInstall}
              title="Install KE Payment Tracker on your phone or desktop"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Install App</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-3 text-right">
            <div>
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm font-medium text-slate-200">{user.fullName}</span>
                {getRoleBadge()}
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      <InstallPwaModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </header>
  );
};
