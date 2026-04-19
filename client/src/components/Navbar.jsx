import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/reconciliation', label: 'Compliance' }, 
  { to: '/ai-insights', label: 'AI Insights' }, 
  { to: '/payments', label: 'Payments' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = () => {
    if (user) {
      api.get('/notifications')
        .then(res => {
          setUnreadCount(res.data.unreadCount || 0);
          setNotifications(res.data.notifications || []);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
        fetchNotifications();
      }
      setDropdownOpen(false);
      navigate('/notifications');
    } catch (err) {
      console.error(err);
    }
  };

  const getAccentColor = (type) => {
    if (type === 'danger') return '#C0392B';
    if (type === 'warning') return '#B8935A';
    if (type === 'success') return '#2D7D4E';
    return '#888888'; // info
  };

  return (
    <nav style={{
      background: '#FFFFFF', borderBottom: '1px solid #E8E5E0',
      padding: '0 24px', height: '48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', zIndex: 60 }} onClick={() => navigate('/dashboard')}>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>LedgerSync </span>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#B8935A', marginLeft: '3px' }}>AI</span>
      </div>

      {/* Hamburger */}
      <div className="mobile-only" style={{ zIndex: 60, cursor: 'pointer' }} onClick={() => setMenuOpen(!menuOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
          {menuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </div>

      {/* Center & Right Wrapper */}
      <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        {/* Center */}
        <div className="nav-links" style={{ display: 'flex', gap: '24px' }}>
          <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Dashboard</NavLink>
          <NavLink to="/upload" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Upload</NavLink>
          <NavLink to="/invoices" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Invoices</NavLink>
          <NavLink to="/compliance" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Compliance</NavLink>
          <NavLink to="/ai-insights" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>AI Insights</NavLink>
          <NavLink to="/payments" onClick={() => setMenuOpen(false)} style={({ isActive }) => ({ textDecoration: 'none', fontSize: '11px', cursor: 'pointer', color: isActive ? '#1A1A1A' : '#999', fontWeight: isActive ? 500 : 400 })}>Payments</NavLink>
        </div>

        {/* Right */}
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user?.businessName && (
            <div style={{ background: '#F0EDE8', color: '#999', fontSize: '10px', padding: '3px 10px', borderRadius: '20px' }}>
              {user.businessName}
            </div>
          )}
          
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-6px',
                  background: '#C0392B', color: 'white', fontSize: '9px',
                  borderRadius: '50%', width: '15px', height: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '44px', right: 0, width: '320px',
                background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: '6px',
                zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>Notifications</div>
                  {unreadCount > 0 && (
                    <div onClick={handleMarkAllRead} style={{ fontSize: 10, color: '#B8935A', cursor: 'pointer' }}>Mark all read</div>
                  )}
                </div>
                
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#BBBBBB', padding: 24, textAlign: 'center' }}>No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div 
                        key={n._id} 
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '12px 14px', borderBottom: '1px solid #F0EDE8',
                          background: n.isRead ? '#FFFFFF' : '#FAFAF8',
                          borderLeft: `3px solid ${getAccentColor(n.type)}`,
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#F5F2EE'}
                        onMouseOut={e => e.currentTarget.style.background = n.isRead ? '#FFFFFF' : '#FAFAF8'}
                      >
                        <div style={{ fontSize: 11, color: '#1A1A1A', lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div 
                  onClick={() => { setDropdownOpen(false); navigate('/notifications'); }}
                  style={{ padding: '8px 14px', borderTop: '1px solid #F0EDE8', textAlign: 'center', fontSize: 10, color: '#B8935A', cursor: 'pointer' }}
                >
                  View all &rarr;
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/profile')} style={{
            background: 'none', border: 'none', fontSize: '10px', color: '#1A1A1A', cursor: 'pointer', padding: 0, fontWeight: 500
          }}>
            Profile
          </button>

          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', fontSize: '10px', color: '#BBBBBB', cursor: 'pointer', padding: 0
          }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
