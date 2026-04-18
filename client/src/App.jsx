import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Invoices from './pages/Invoices';
import Reconciliation from './pages/Reconciliation';
import AIInsights from './pages/AIInsights';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes (inside Layout) */}
          <Route element={<Layout />}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/upload"         element={<Upload />} />
            <Route path="/invoices"       element={<Invoices />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
            <Route path="/ai-insights"    element={<AIInsights />} />
            <Route path="/payments"       element={<Payments />} />
            <Route path="/notifications"  element={<Notifications />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
