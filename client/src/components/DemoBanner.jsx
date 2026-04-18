import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DemoBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show for demo user
  if (!user || user.email !== 'demo@taxsync.ai') return null;

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
        <strong>Demo Mode</strong> — You are viewing demo data. All figures are simulated for demonstration purposes.
      </span>
    </div>
  );
}
