import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/reconciliation', label: 'Compliance' }, // Usually reconciliation goes under compliance or its own tab, but user asked for "Compliance" in nav
  { to: '/ai-insights', label: 'AI Insights' }, // Reusing the same paths as before, matching labels requested by user where possible
  { to: '/payments', label: 'Payments' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => setUnreadCount(res.data.unreadCount || 0))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#FFFFFF', borderBottom: '1px solid #E8E5E0',
      padding: '0 24px', height: '48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>LedgerSync </span>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#B8935A', marginLeft: '3px' }}>AI</span>
      </div>

      {/* Center */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Dashboard</NavLink>
        <NavLink to="/invoices" style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Invoices</NavLink>
        <NavLink to="/reconciliation" style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Compliance</NavLink>
        <NavLink to="/ai-insights" style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>AI Insights</NavLink>
        <NavLink to="/payments" style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Payments</NavLink>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user?.businessName && (
          <div style={{ background: '#F0EDE8', color: '#999', fontSize: '10px', padding: '3px 10px', borderRadius: '20px' }}>
            {user.businessName}
          </div>
        )}
        
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
          <span style={{ fontSize: '16px', color: '#999' }}>🔔</span>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-4px',
              background: 'var(--red)', color: 'white', fontSize: '9px',
              borderRadius: '50%', minWidth: '14px', height: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600
            }}>
              {unreadCount}
            </div>
          )}
        </div>

        <button onClick={handleLogout} style={{
          background: 'none', border: 'none', fontSize: '10px', color: '#BBBBBB', cursor: 'pointer', padding: 0
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
