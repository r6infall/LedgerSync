import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import Upload from './pages/Upload';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Reconciliation from './pages/Reconciliation';
import Compliance from './pages/Compliance';
import AIInsights from './pages/AIInsights';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes (inside PrivateRoute & Layout) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/:role/dashboard" element={<Dashboard />} />
              <Route path="/dashboard"      element={<Navigate to="/buyer/dashboard" replace />} />
            <Route path="/upload"         element={<Upload />} />
            <Route path="/invoices"       element={<Invoices />} />
            <Route path="/invoices/:id"   element={<InvoiceDetail />} />
            <Route path="/compliance"     element={<Compliance />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
            <Route path="/ai-insights"    element={<AIInsights />} />
            <Route path="/payments"       element={<Payments />} />
              <Route path="/notifications"  element={<Notifications />} />
              <Route path="/profile"        element={<Profile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


