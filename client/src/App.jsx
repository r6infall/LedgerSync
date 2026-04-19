import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

// Layouts
import BuyerLayout from './components/layouts/BuyerLayout';
import SellerLayout from './components/layouts/SellerLayout';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerInvoices from './pages/buyer/BuyerInvoices';
import BuyerInvoiceDetail from './pages/buyer/BuyerInvoiceDetail';
import BuyerReconcile from './pages/buyer/BuyerReconcile';
import BuyerGSTRSummary from './pages/buyer/BuyerGSTRSummary';
import BuyerPayments from './pages/buyer/BuyerPayments';
import BuyerMissingInvoices from './pages/buyer/BuyerMissingInvoices';
import BuyerNotifications from './pages/buyer/BuyerNotifications';
import BuyerAIChat from './pages/buyer/BuyerAIChat';
import BuyerCompliance from './pages/buyer/BuyerCompliance';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerInvoices from './pages/seller/SellerInvoices';
import SellerInvoiceDetail from './pages/seller/SellerInvoiceDetail';
import SellerUpload from './pages/seller/SellerUpload';
import SellerMissingRequests from './pages/seller/SellerMissingRequests';
import SellerNotifications from './pages/seller/SellerNotifications';
import SellerPayments from './pages/seller/SellerPayments';

import AboutData from './pages/AboutData';
import AIFeatures from './pages/AIFeatures';
import HowItWorks from './pages/HowItWorks';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about-data" element={<AboutData />} />
          <Route path="/ai-features" element={<AIFeatures />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* Protected Area */}
          <Route element={<PrivateRoute />}>

            {/* Buyer Portal */}
            <Route path="/buyer" element={<BuyerLayout />}>
              <Route path="dashboard"      element={<BuyerDashboard />} />
              <Route path="invoices"       element={<BuyerInvoices />} />
              <Route path="invoice/:id"    element={<BuyerInvoiceDetail />} />
              <Route path="reconcile"      element={<BuyerReconcile />} />
              <Route path="gstr-summary"   element={<BuyerGSTRSummary />} />
              <Route path="payments"       element={<BuyerPayments />} />
              <Route path="missing"        element={<BuyerMissingInvoices />} />
              <Route path="notifications"  element={<BuyerNotifications />} />
              <Route path="ai-chat"        element={<BuyerAIChat />} />
              <Route path="compliance"     element={<BuyerCompliance />} />
              <Route path="profile"        element={<Profile />} />
              <Route path=""               element={<Navigate to="/buyer/dashboard" replace />} />
            </Route>

            {/* Seller Portal */}
            <Route path="/seller" element={<SellerLayout />}>
              <Route path="dashboard"         element={<SellerDashboard />} />
              <Route path="invoices"          element={<SellerInvoices />} />
              <Route path="invoice/:id"       element={<SellerInvoiceDetail />} />
              <Route path="upload"            element={<SellerUpload />} />
              <Route path="missing-requests"  element={<SellerMissingRequests />} />
              <Route path="notifications"     element={<SellerNotifications />} />
              <Route path="payments"          element={<SellerPayments />} />
              <Route path="profile"           element={<Profile />} />
              <Route path=""                  element={<Navigate to="/seller/dashboard" replace />} />
            </Route>
            
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
