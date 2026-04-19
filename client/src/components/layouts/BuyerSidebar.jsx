import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/buyer/dashboard', label: 'Dashboard' },
  { to: '/buyer/invoices', label: 'Invoices' },
  { to: '/buyer/reconcile', label: 'Reconcile' },
  { to: '/buyer/gstr-summary', label: 'GSTR Summary' },
  { to: '/buyer/payments', label: 'Payments' },
  { to: '/buyer/missing', label: 'Missing Logs' },
  { to: '/buyer/notifications', label: 'Notifications' },
  { to: '/buyer/ai-chat', label: 'AI Chat' },
  { to: '/buyer/compliance', label: 'Compliance Score' },
  { to: '/buyer/ai-features', label: '✨ AI Features' }
];

export default function BuyerSidebar() {
  return (
    <aside style={{ width: '220px', background: '#FAFAF8', borderRight: '1px solid #E8E5E0', height: 'calc(100vh - 56px)', position: 'sticky', top: '56px', padding: '24px 16px', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: '16px', paddingLeft: '12px', fontWeight: 600 }}>Buyer Nav</div>
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
