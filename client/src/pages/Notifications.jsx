import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Info, Warnings, Alerts
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    // Simple navigation rule based on content
    if (notif.message.includes('invoice') || notif.message.includes('mismatch')) navigate('/invoices');
    else if (notif.message.includes('payment') || notif.message.includes('ITC unlocked')) navigate('/payments');
    else if (notif.message.includes('GSTR')) navigate('/compliance');
  };

  const getAccentColor = (type) => {
    if (type === 'danger') return '#C0392B';
    if (type === 'warning') return '#B8935A';
    if (type === 'success') return '#2D7D4E';
    return '#888888'; // info
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Alerts') return n.type === 'danger';
    if (filter === 'Warnings') return n.type === 'warning';
    if (filter === 'Info') return n.type === 'info' || n.type === 'success';
    return true;
  });

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>Notifications</h1>
        {unreadCount > 0 && (
          <div style={{ background: '#C0392B', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
            {unreadCount} unread
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['All', 'Info', 'Warnings', 'Alerts'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#1A1A1A' : '#FFFFFF',
            color: filter === f ? '#FFFFFF' : '#999',
            border: filter === f ? '1px solid #1A1A1A' : '1px solid #E8E5E0',
            borderRadius: 20, fontSize: 10, padding: '4px 12px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 12 }}>No notifications found in this category.</div>
        ) : (
          filteredNotifications.map(n => (
            <div 
              key={n._id} 
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: '16px 20px', borderBottom: '1px solid #F0EDE8',
                background: n.isRead ? '#FFFFFF' : '#FAFAF8',
                borderLeft: `4px solid ${getAccentColor(n.type)}`,
                cursor: 'pointer', transition: 'background 0.2s',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#F5F2EE'}
              onMouseOut={e => e.currentTarget.style.background = n.isRead ? '#FFFFFF' : '#FAFAF8'}
            >
              <div>
                <div style={{ fontSize: 12, color: '#1A1A1A', lineHeight: 1.5, fontWeight: n.isRead ? 400 : 500 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 6 }}>
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B8935A', flexShrink: 0 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
