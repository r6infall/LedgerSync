import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: user?.role || 'buyer',
    name: user?.name || '',
    businessName: user?.businessName || '',
    gstin: user?.gstin || ''
  });
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Check if anything changed
      const changed = form.role !== user.role || form.name !== user.name || form.businessName !== user.businessName || form.gstin !== user.gstin;
      if (changed) {
        await updateUser(form);
        setSuccess('Profile successfully updated!');
        if (form.role !== user.role) {
          setTimeout(() => {
            navigate(`/${form.role}/dashboard`);
          }, 1200);
        }
      } else {
        setSuccess('No changes were made.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', border: '1px solid #E8E5E0', borderRadius: '5px', padding: '9px 12px',
    fontSize: '13px', background: '#FAFAF8', outline: 'none'
  };

  return (
    <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: '8px', padding: '36px', width: '100%', maxWidth: '440px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', marginBottom: '6px' }}>Your Profile</h2>
        <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>Manage your account settings and preferences.</p>

        {success && <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '5px', padding: '10px 12px', fontSize: '12px', color: '#137333', marginBottom: '16px' }}>{success}</div>}
        {error && <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', borderRadius: '5px', padding: '10px 12px', fontSize: '12px', color: '#C5221F', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Email Address</label>
            <input type="text" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#F5F5F5', color: '#888' }} />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Business Name</label>
            <input type="text" value={form.businessName} onChange={set('businessName')} style={inputStyle} onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>GSTIN</label>
            <input type="text" value={form.gstin} onChange={set('gstin')} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'} />
          </div>

          <div style={{ margin: '24px 0', height: '1px', background: '#E8E5E0' }} />

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Account Type (Role)</label>
            <select
              value={form.role}
              onChange={set('role')}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#1A1A1A', color: 'white', border: 'none',
            borderRadius: '5px', padding: '10px', fontSize: '13px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1,
            transition: 'opacity 0.2s'
          }}>
            {loading ? 'Saving changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
