import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return 'Yesterday';
  return `${Math.floor(s / 86400)}d ago`;
}

const priorityColors = { critical: '#C0392B', high: '#E67E22', medium: '#3498DB', low: '#95A5A6' };

export default function Topnav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data.notifications?.slice(0, 10) || []);
      setUnread(res.data.unreadCount || 0);
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchNotifs(); const i = setInterval(fetchNotifs, 30000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); fetchNotifs(); } catch(e) { /* try PUT fallback */ try { await api.put('/notifications/read-all'); fetchNotifs(); } catch(e2) {} }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const portal = user?.role === 'seller' ? 'seller' : 'buyer';

  return (
    <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E5E0', height: '56px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A1A', letterSpacing: '-0.3px' }}>LedgerSync</span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#B8935A', letterSpacing: '-0.3px' }}>AI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={() => navigate(`/${portal}/ai-features`)} style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', color: '#7E22CE', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
          <span>✨</span> See AI in action
        </button>

        {/* Notification Bell */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px' }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#C0392B', color: '#FFF', fontSize: '9px', fontWeight: 700, minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div style={{ position: 'absolute', top: '40px', right: 0, width: '380px', background: '#FFF', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #E8E5E0', zIndex: 200, maxHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#7E22CE', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>}
                  <button onClick={() => { setOpen(false); navigate(`/${portal}/notifications`); }} style={{ background: 'none', border: 'none', color: '#B8935A', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View all</button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No notifications yet</div>
                ) : notifs.map(n => (
                  <div
                    key={n._id}
                    onClick={() => { setOpen(false); if (n.relatedInvoiceId) navigate(`/${portal}/invoice/${n.relatedInvoiceId}`); }}
                    style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F0', borderLeft: `3px solid ${priorityColors[n.priority] || '#95A5A6'}`, background: n.isRead ? 'transparent' : '#FAFAF8', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F5F5F0'}
                    onMouseOut={e => e.currentTarget.style.background = n.isRead ? 'transparent' : '#FAFAF8'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A', flex: 1 }}>
                        {!n.isRead && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', marginRight: '6px' }} />}
                        {n.title || n.type?.replace(/_/g, ' ')}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {(n.type === 'ai_reminder' || n.type === 'anomaly_detected') && (
                          <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 600 }}>AI</span>
                        )}
                        <span style={{ fontSize: '10px', color: '#999' }}>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message?.slice(0, 60)}{n.message?.length > 60 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #E8E5E0', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>{user?.businessName || user?.name}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: user?.role === 'seller' ? '#B8935A' : '#2D7D4E', background: user?.role === 'seller' ? '#FFF3E0' : '#E9F5EC', padding: '2px 8px', borderRadius: '20px', marginTop: '2px', border: `1px solid ${user?.role === 'seller' ? '#FFE0B2' : '#C3E6CB'}` }}>
              {user?.role === 'seller' ? 'Seller' : 'Buyer'} Portal
            </span>
          </div>
          <button onClick={() => navigate(`/${portal}/profile`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', color: '#555', border: '1px solid #E8E5E0' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>
        </div>

        <button onClick={handleLogout} style={{ background: '#1A1A1A', border: 'none', fontSize: '11px', color: '#FFFFFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, padding: '6px 12px' }}>Logout</button>
      </div>
    </nav>
  );
}
