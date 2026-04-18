import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', businessName: '', gstin: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gstinStatus, setGstinStatus] = useState(''); // 'valid', 'invalid', ''

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  useEffect(() => {
    if (!form.gstin) {
      setGstinStatus('');
    } else if (gstinRegex.test(form.gstin.toUpperCase())) {
      setGstinStatus('valid');
    } else {
      setGstinStatus('invalid');
    }
  }, [form.gstin]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (gstinStatus === 'invalid') {
      setError('Please provide a valid GSTIN.');
      return;
    }
    setError(''); setLoading(true);
    try {
      await register({ ...form, gstin: form.gstin.toUpperCase() });
      navigate('/dashboard');
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already registered.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error; // Custom error from /sync route
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      let msg = 'Google registration failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') msg = '';
      else if (err.message) msg = err.message;
      if (msg) setError(msg);
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', border: '1px solid #E8E5E0', borderRadius: '5px', padding: '9px 12px',
    fontSize: '13px', background: '#FAFAF8', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: '8px', 
        padding: '36px', width: '380px', margin: '80px auto 0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '18px', color: '#1A1A1A' }}>LedgerSync </span>
            <span style={{ fontWeight: 600, fontSize: '18px', color: '#B8935A' }}>AI</span>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>GST Reconciliation Platform</div>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-bg)', border: '1px solid #F5C6C2',
            borderRadius: '5px', padding: '8px 12px', marginBottom: '16px',
            fontSize: '12px', color: 'var(--red)'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Full Name</label>
            <input
              type="text" placeholder="Priya Sharma" value={form.name} onChange={set('name')} required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Business Name</label>
            <input
              type="text" placeholder="Sharma Enterprises" value={form.businessName} onChange={set('businessName')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>GSTIN</label>
            <input
              type="text" placeholder="27AAPFU0939F1ZV" value={form.gstin} onChange={set('gstin')}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
            {form.gstin ? (
              gstinStatus === 'valid' ? (
                <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '4px' }}>Valid GSTIN</div>
              ) : (
                <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>Invalid GSTIN format</div>
              )
            ) : (
              <div style={{ fontSize: '10px', color: '#BBBBBB', marginTop: '4px' }}>Format: 27AAPFU0939F1ZV</div>
            )}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Email address</label>
            <input
              type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Password</label>
            <input
              type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#B8935A'} onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#1A1A1A', color: 'white', border: 'none',
            borderRadius: '5px', padding: '10px', fontSize: '13px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            marginBottom: '12px'
          }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#E8E5E0' }} />
            <span style={{ padding: '0 10px', fontSize: '11px', color: '#999' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#E8E5E0' }} />
          </div>

          <button type="button" onClick={handleGoogle} disabled={loading} style={{
            width: '100%', background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #E8E5E0',
            borderRadius: '5px', padding: '9px', fontSize: '13px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            transition: 'background 0.2s'
          }} onMouseOver={e => e.target.style.background = '#FAFAF8'} onMouseOut={e => e.target.style.background = '#FFFFFF'}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#B8935A', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
