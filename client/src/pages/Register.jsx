import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', gstin: '', businessName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
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

        <div className="card" style={{ padding: '28px 28px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>Start reconciling your GST invoices today</p>

          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid #F5C6C2',
              borderRadius: 5, padding: '8px 12px', marginBottom: 16,
              fontSize: 12, color: 'var(--red)'
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 5 }}>Full Name</div>
                <input id="reg-name" className="input" placeholder="Priya Sharma" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: 5 }}>Email</div>
                <input id="reg-email" className="input" type="email" placeholder="priya@company.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="section-label" style={{ marginBottom: 5 }}>Business Name</div>
              <input id="reg-biz" className="input" placeholder="Sharma Enterprises Pvt. Ltd." value={form.businessName} onChange={set('businessName')} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="section-label" style={{ marginBottom: 5 }}>GSTIN</div>
              <input id="reg-gstin" className="input mono" placeholder="27AAPFU0939F1ZV" value={form.gstin} onChange={set('gstin')}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.5px' }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div className="section-label" style={{ marginBottom: 5 }}>Password</div>
              <input id="reg-password" className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>

            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Creating account…</> : 'Create account'}
            </Button>
          </form>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
