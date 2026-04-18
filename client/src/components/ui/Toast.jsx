import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade in after mount
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation before unmounting
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  let borderColor = '#2D7D4E'; // success green
  if (type === 'error') borderColor = '#C0392B';
  if (type === 'warning') borderColor = '#B8935A';

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6,
      borderLeft: `3px solid ${borderColor}`,
      padding: '12px 16px', fontSize: 12, color: '#333',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-10px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }}>
      {message}
    </div>
  );
}
