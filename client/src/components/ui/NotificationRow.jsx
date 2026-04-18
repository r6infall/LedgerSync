function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationRow({ notification }) {
  const accentCls = {
    info:    'notif-accent-info',
    warning: 'notif-accent-warning',
    danger:  'notif-accent-danger',
    success: 'notif-accent-success',
  }[notification.type] || 'notif-accent-info';

  return (
    <div className="notif-row" style={{ opacity: notification.isRead ? 0.6 : 1 }}>
      <div className={`notif-accent ${accentCls}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="notif-message">{notification.message}</div>
        <div className="notif-time">{timeAgo(notification.createdAt)}</div>
      </div>
      {!notification.isRead && (
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0, marginTop: 6
        }} />
      )}
    </div>
  );
}
