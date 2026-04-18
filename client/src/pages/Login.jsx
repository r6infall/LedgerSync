import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fetchedUser = await login(form.email, form.password);
      navigate(`/${fetchedUser?.role || 'buyer'}/dashboard`);
    } catch (err) {
      // Firebase throws errors with a code and message
      let msg = 'Login failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
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
      let msg = 'Google login failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') msg = ''; // Ignore if user closed popup
      else if (err.message) msg = err.message;
      if (msg) setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column' }}>
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
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
              style={{
                width: '100%', border: '1px solid #E8E5E0', borderRadius: '5px', padding: '9px 12px',
                fontSize: '13px', background: '#FAFAF8', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#B8935A'}
              onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#555', fontWeight: 500, marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              style={{
                width: '100%', border: '1px solid #E8E5E0', borderRadius: '5px', padding: '9px 12px',
                fontSize: '13px', background: '#FAFAF8', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#B8935A'}
              onBlur={e => e.target.style.borderColor = '#E8E5E0'}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#1A1A1A', color: 'white', border: 'none',
            borderRadius: '5px', padding: '10px', fontSize: '13px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            marginBottom: '12px'
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
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
            Sign in with Google
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#B8935A', textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
    </div>
  );
}
