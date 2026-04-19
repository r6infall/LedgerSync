import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'ai_reminder', label: 'AI Reminders' },
  { key: 'deadlines', label: 'Deadlines' },
  { key: 'payments', label: 'Payments' },
  { key: 'invoices', label: 'Invoice Actions' }
];

const priorityColors = { critical: '#C0392B', high: '#E67E22', medium: '#3498DB', low: '#95A5A6' };
const priorityBg = { critical: '#FCEAEA', high: '#FFF3E0', medium: '#EBF5FB', low: '#F8F9FA' };

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BuyerNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const fetchNotifs = async () => {
    try {
      const params = filter ? `?filter=${filter}` : '';
      const res = await api.get(`/notifications${params}`);
      setNotifs(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, [filter]);

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); } catch(e) { try { await api.put(`/notifications/${id}/read`); } catch(e2) {} }
    fetchNotifs();
  };

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); } catch(e) { try { await api.put('/notifications/read-all'); } catch(e2) {} }
    fetchNotifs();
  };

  const deleteNotif = async (id) => {
    try { await api.delete(`/notifications/${id}`); fetchNotifs(); } catch(e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>Notifications</h2>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ background: '#1A1A1A', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Mark all read ({unread})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#1A1A1A' : '#FFF', color: filter === f.key ? '#FFF' : '#555', border: '1px solid #E8E5E0', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading notifications...</div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No notifications found.</div>
        ) : (
          <div>
            {notifs.map(n => (
              <div key={n._id} style={{ padding: '16px 20px', borderBottom: '1px solid #F5F5F0', borderLeft: `4px solid ${priorityColors[n.priority] || '#95A5A6'}`, background: n.isRead ? 'transparent' : priorityBg[n.priority] || '#FAFAF8', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {!n.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColors[n.priority] || '#3498DB', flexShrink: 0 }} />}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{n.title || n.type?.replace(/_/g, ' ')}</span>
                    {(n.type === 'ai_reminder' || n.type === 'anomaly_detected') && (
                      <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>✨ AI</span>
                    )}
                    <span style={{ fontSize: '10px', color: '#999', marginLeft: 'auto' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>{n.message}</div>
                  {n.type === 'ai_reminder' && (
                    <div style={{ fontSize: '10px', color: '#7E22CE', marginTop: '4px', fontWeight: 500 }}>Generated by Gemini 2.5 Flash</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {!n.isRead && (
                    <button onClick={() => markRead(n._id)} style={{ background: 'none', border: '1px solid #E8E5E0', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: '#555' }}>Read</button>
                  )}
                  <button onClick={() => deleteNotif(n._id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
