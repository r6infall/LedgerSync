import { useState, useEffect } from 'react';
import api from '../services/api';
import Label from '../components/ui/Label';
import NotificationRow from '../components/ui/NotificationRow';
import Button from '../components/ui/Button';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const filtered = filter ? notifications.filter(n => n.type === filter) : notifications;

  const typeGroups = {
    all: notifications.length,
    success: notifications.filter(n => n.type === 'success').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    danger: notifications.filter(n => n.type === 'danger').length,
    info: notifications.filter(n => n.type === 'info').length,
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Notifications</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            Activity Feed
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--accent)', color: '#fff',
                fontSize: 10, fontWeight: 600,
                borderRadius: 20, padding: '1px 7px'
              }}>{unreadCount} unread</span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            System events, reconciliation alerts, and payment updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button id="mark-all-read-btn" variant="secondary" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {Object.entries(typeGroups).map(([type, count]) => (
          <button key={type}
            className={`btn btn-sm ${filter === (type === 'all' ? '' : type) ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(type === 'all' ? '' : type)}
            style={{ textTransform: 'capitalize' }}>
            {type} {count > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" style={{ width: 20, height: 20 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 24, marginBottom: 8 }}>◉</div>
          <div>No notifications yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Actions like uploads, reconciliations, and payments will appear here</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px' }}>
          {filtered.map(n => (
            <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}>
              <NotificationRow notification={n} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
