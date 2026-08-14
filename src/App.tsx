import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { db } from './lib/database';
import { useSupabase } from './lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Layout
import { AppLayout } from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductList from './pages/Products/ProductList';
import CustomerList from './pages/Customers/CustomerList';
import TransactionDetail from './pages/Transactions/TransactionDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-main, #0f172a)',
          color: 'var(--text-main, #f8fafc)',
          gap: '1rem',
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary, #3b82f6)' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)' }}>
          Đang tải hệ thống...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    // Only seed demo data if NOT using Supabase
    if (!useSupabase()) {
      db.seedDemoData();
    }
    // Restore auth state
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
