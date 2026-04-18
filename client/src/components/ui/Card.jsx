import MockBadge from './MockBadge';

export default function Card({ title, children, showMockBadge = true, style }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E5E0',
      borderRadius: '6px',
      padding: '24px',
      position: 'relative',
      ...style
    }}>
      {showMockBadge && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <MockBadge />
        </div>
      )}
      {title && <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{title}</h3>}
      {children}
    </div>
  );
}
