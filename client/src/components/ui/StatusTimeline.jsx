import React from 'react';

export default function StatusTimeline({ history = [] }) {
  // Safe sort newest first based on timestamps
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getColor = (status) => {
    switch (status) {
      case 'matched':
      case 'approved':
      case 'itc-unlocked':
      case 'paid':
        return '#2D7D4E'; // Green
      case 'mismatch':
      case 'missing':
      case 'extra':
      case 'rejected':
        return '#C0392B'; // Red
      case 'pending':
      case 'under-review':
      case 'change-requested':
        return '#B8935A'; // Amber
      case 'preprocessing':
      case 'corrected':
      default:
        return '#8A92A6'; // Gray matches System workflows natively
    }
  };

  const getLabel = (status) => {
    if (status === 'preprocessing') return 'Reconciliation run';
    if (status === 'mismatch') return 'Mismatch detected';
    if (status === 'matched') return 'Matched successfully';
    if (status === 'extra') return 'Extra Invoice Found';
    if (status === 'itc-unlocked') return 'ITC unlocked';
    if (status === 'change-requested') return 'Change requested';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!history || history.length === 0) {
    return <div style={{ fontSize: '13px', color: '#999' }}>No timeline data available.</div>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #E8E5E0', marginLeft: '8px' }}>
      {sortedHistory.map((entry, idx) => (
        <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{
            position: 'absolute',
            left: '-23px', // align with the borderLeft native explicit
            top: '4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getColor(entry.status),
            border: '2px solid #FFF'
          }} />
          
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
            {getLabel(entry.status)} <span style={{ fontWeight: 400, color: '#555' }}>— {entry.actor}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
            {new Date(entry.timestamp).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </div>
          {entry.note && (
            <div style={{ fontSize: '12px', color: '#555', background: '#FAFAF8', padding: '8px 12px', borderRadius: '4px', border: '1px solid #E8E5E0', marginTop: '6px' }}>
              {entry.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
