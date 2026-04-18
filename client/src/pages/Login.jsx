import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
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
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#B8935A', textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
    </div>
  );
}
