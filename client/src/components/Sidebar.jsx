import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',      icon: '◈', label: 'Dashboard' },
  { to: '/invoices',       icon: '◧', label: 'Invoices' },
  { to: '/reconciliation', icon: '⇄', label: 'Reconciliation' },
  { to: '/ai-insights',    icon: '✦', label: 'AI Insights' },
  { to: '/payments',       icon: '◎', label: 'Payments' },
  { to: '/notifications',  icon: '◉', label: 'Notifications' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--text-primary)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0
          }}>L</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>LedgerSync</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>GST Platform</div>
          </div>
        </div>
      </div>

      {/* Business info */}
      {user && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.businessName || user.name}
          </div>
          <div className="mono" style={{ fontSize: 9 }}>{user.gstin || 'GSTIN not set'}</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        <div className="section-label" style={{ paddingLeft: 8, marginBottom: 6 }}>Navigation</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 8px', borderRadius: 5,
              textDecoration: 'none', marginBottom: 1,
              background: isActive ? 'var(--bg)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 500 : 400,
              fontSize: 12,
              transition: 'background 0.1s ease, color 0.1s ease',
            })}
          >
            <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
