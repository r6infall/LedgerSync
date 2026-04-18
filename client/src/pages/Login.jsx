import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

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
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{
        width: 420, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--text-primary)', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 700
          }}>L</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>LedgerSync</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>GST Reconciliation Platform</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
          Sign in to your account to continue
        </p>

        {error && (
          <div style={{
            background: 'var(--red-bg)', border: '1px solid #F5C6C2',
            borderRadius: 5, padding: '8px 12px', marginBottom: 16,
            fontSize: 12, color: 'var(--red)'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>Email address</div>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>Password</div>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full" style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Signing in…</> : 'Sign in'}
          </Button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>

      {/* Right panel — decorative */}
      <div style={{
        flex: 1, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48
      }}>
        <div style={{ maxWidth: 360, width: '100%' }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Platform highlights</div>
          {[
            { icon: '⇄', title: 'Automated Reconciliation', desc: 'Match purchase invoices against GSTR-2A in seconds' },
            { icon: '✦', title: 'AI-Powered Insights', desc: 'Gemini AI explains mismatches and suggests fixes' },
            { icon: '◎', title: 'ITC Unlock Payments', desc: 'Pay suppliers and unlock Input Tax Credit instantly' },
            { icon: '◈', title: 'Compliance Scoring', desc: 'Real-time GST health score with risk indicators' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 16, marginTop: 1, color: 'var(--accent)' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
