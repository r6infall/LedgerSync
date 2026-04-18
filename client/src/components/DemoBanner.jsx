import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DemoBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show for demo user and only if not dismissed
  if (!user || user.email !== 'demo@taxsync.ai' || dismissed) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 999,
      background: '#FEF6E7',
      borderBottom: '1px solid #E8D5A8',
      padding: '6px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 11, color: '#8A6A30' }}>
        <strong>Demo Mode</strong> — Ravi Textiles · demo@taxsync.ai · Password: Demo@1234
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', fontSize: 16,
          color: '#B8935A', cursor: 'pointer', padding: '0 4px',
          lineHeight: 1, fontWeight: 400,
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
