import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { InstallPwaBanner } from './components/InstallPwaModal';
import { Loader2 } from 'lucide-react';

// Code Splitting with React.lazy() to protect Admin and Accountant bundles
const AdminDashboard = lazy(() =>
  import('./modules/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AccountantDashboard = lazy(() =>
  import('./modules/accountant/AccountantDashboard').then((m) => ({ default: m.AccountantDashboard }))
);
const SupervisorDashboard = lazy(() =>
  import('./modules/supervisor/SupervisorDashboard').then((m) => ({ default: m.SupervisorDashboard }))
);
const VendorDashboard = lazy(() =>
  import('./modules/vendor/VendorDashboard').then((m) => ({ default: m.VendorDashboard }))
);
const OfficeWorkerDashboard = lazy(() =>
  import('./modules/officeworker/OfficeWorkerDashboard').then((m) => ({ default: m.OfficeWorkerDashboard }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('ke_auth_token');
    localStorage.removeItem('ke_auth_user');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-center text-slate-100">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-rose-400">Application Error Encountered</h2>
            <p className="text-sm text-slate-300">
              {this.state.error?.message || 'An unexpected error occurred while rendering the dashboard.'}
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold text-white"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm"
              >
                Clear Session & Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DashboardRouter: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isAccountant, isSupervisor, isOfficeWorker } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <InstallPwaBanner />
      {!isAuthenticated || !user ? (
        <LoginPage />
      ) : (
        <>
          <Navbar />
          <main className="flex-1">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[60vh] text-slate-400 space-x-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-sm font-medium">Loading Module Bundle...</span>
                </div>
              }
            >
              {isAdmin && <AdminDashboard />}
              {isAccountant && <AccountantDashboard />}
              {isSupervisor && <SupervisorDashboard />}
              {isOfficeWorker && <OfficeWorkerDashboard />}
              {!isAdmin && !isAccountant && !isSupervisor && !isOfficeWorker && <VendorDashboard />}
            </Suspense>
          </main>
        </>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
