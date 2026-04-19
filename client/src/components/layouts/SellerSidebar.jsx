import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/seller/dashboard', label: 'Dashboard' },
  { to: '/seller/invoices', label: 'Invoices Uploaded' },
  { to: '/seller/upload', label: 'Upload Invoices' },
  { to: '/seller/missing-requests', label: 'Missing Requests' },
  { to: '/seller/payments', label: 'Payments' },
  { to: '/seller/notifications', label: 'Notifications' }
];

export default function SellerSidebar() {
  return (
    <aside style={{ width: '220px', background: '#FAFAF8', borderRight: '1px solid #E8E5E0', height: 'calc(100vh - 56px)', position: 'sticky', top: '56px', padding: '24px 16px', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: '16px', paddingLeft: '12px', fontWeight: 600 }}>Seller Nav</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {ITEMS.map(i => (
          <NavLink key={i.to} to={i.to} style={({isActive}) => ({
            padding: '8px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: isActive ? 600 : 500,
            color: isActive ? '#1A1A1A' : '#555', background: isActive ? '#E8E5E0' : 'transparent', transition: 'all 0.2s'
          })}>
            {i.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
