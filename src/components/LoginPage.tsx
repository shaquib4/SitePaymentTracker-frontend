import React, { useState } from 'react';
import { useAuth } from '../core/auth/AuthContext';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Calculator, HardHat, AlertCircle, Briefcase } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('khanshaquib21@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 text-slate-950 mb-4 font-bold">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">KE Payment Tracker</h2>
        <p className="mt-2 text-sm text-slate-400">
          Khan Enterprises • Construction & Infrastructure Financial Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address or 6-Digit User ID
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="name@company.com or 6-digit ID (e.g. 749201)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <p className="text-xs text-slate-400 mb-3 font-medium">Quick Demo Credentials (Khan Enterprises):</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('khanshaquib21@gmail.com')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                  email === 'khanshaquib21@gmail.com'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold block">Shaquib Khan (Admin)</span>
                    <span className="text-[11px] text-slate-400">khanshaquib21@gmail.com (ID: 749201)</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('521402')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                  email === '521402'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold block">Ramesh Sharma (Accountant)</span>
                    <span className="text-[11px] text-slate-400">User ID: 521402 (No Email Login)</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('616244')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                  email === '616244'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <HardHat className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-semibold block">Surendra Kumar (Supervisor)</span>
                    <span className="text-[11px] text-slate-400">User ID: 616244 • Metro Project</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('400004')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                  email === '400004' || email === 'officeworker@khanenterprises.com'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-semibold block">Neha Sharma (Office Worker)</span>
                    <span className="text-[11px] text-slate-400">User ID: 400004 • Personal Claims & Period Audit</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('918234')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                  email === '918234'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-semibold block">Apex Supplies (Vendor)</span>
                    <span className="text-[11px] text-slate-400">User ID: 918234 • Material Supplier</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Select</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
