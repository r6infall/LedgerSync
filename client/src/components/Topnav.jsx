import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topnav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#FFFFFF', borderBottom: '1px solid #E8E5E0',
      height: '56px', padding: '0 24px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A1A', letterSpacing: '-0.3px' }}>LedgerSync</span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#B8935A', letterSpacing: '-0.3px' }}>AI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button onClick={() => navigate(`/${user?.role || 'buyer'}/notifications`)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <span style={{ fontSize: '16px' }}>🔔</span>
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#C0392B', color: '#FFF', fontSize: '9px', fontWeight: 700,
            width: '14px', height: '14px', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>3</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #E8E5E0', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>{user?.businessName || user?.name}</span>
            <span style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', 
              color: user?.role === 'seller' ? '#B8935A' : '#2D7D4E',
              background: user?.role === 'seller' ? '#FFF3E0' : '#E9F5EC', 
              padding: '2px 8px', borderRadius: '20px', marginTop: '2px',
              border: `1px solid ${user?.role === 'seller' ? '#FFE0B2' : '#C3E6CB'}`
            }}>
              {user?.role === 'seller' ? 'Seller' : 'Buyer'} Portal
            </span>
          </div>
          <button onClick={() => navigate(`/${user?.role || 'buyer'}/profile`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', color: '#555', border: '1px solid #E8E5E0' }}>
               {user?.name?.charAt(0)?.toUpperCase() || 'U'}
             </div>
          </button>
        </div>

        <button onClick={handleLogout} style={{
          background: '#1A1A1A', border: 'none', fontSize: '11px', color: '#FFFFFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, padding: '6px 12px', transition: 'opacity 0.2s'
        }}>Logout</button>
      </div>
    </nav>
  );
}
