import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const fetchedUser = await login('demo@taxsync.ai', 'Demo@1234');
      navigate(`/${fetchedUser?.role || 'buyer'}/dashboard`);
    } catch (err) {
      console.error('Demo login failed:', err);
      setDemoLoading(false);
    }
  };

  const features = [
    {
      label: 'AI Reconciliation',
      title: 'AI Reconciliation',
      desc: 'Match invoices instantly. Catch mismatches before they cost you.',
    },
    {
      label: 'ITC Optimizer',
      title: 'ITC Optimizer',
      desc: 'Know exactly which ITC you can claim and which is at risk.',
    },
    {
      label: 'Compliance Score',
      title: 'Compliance Score',
      desc: 'A live health score for your GST — no CA needed to understand it.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E5E0',
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', letterSpacing: '-0.3px' }}>LedgerSync</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#B8935A', letterSpacing: '-0.3px' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/login" style={{
            padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500,
            color: '#1A1A1A', background: '#FFFFFF', border: '1px solid #E8E5E0',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'}
            onMouseOut={e => e.currentTarget.style.background = '#FFFFFF'}
          >Login</Link>
          <Link to="/register" style={{
            padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500,
            color: '#FFFFFF', background: '#1A1A1A', border: 'none',
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '80px 24px 0' }}>
        {/* Tag pill */}
        <div style={{
          display: 'inline-block',
          fontSize: 10, background: '#F0EDE8', color: '#B8935A',
          padding: '4px 12px', borderRadius: 20, fontWeight: 600,
          letterSpacing: '0.4px', marginBottom: 16,
        }}>
          GST Compliance · Made Simple
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 32, fontWeight: 700, color: '#1A1A1A',
          lineHeight: 1.3, letterSpacing: '-0.5px', margin: '16px 0 0',
        }}>
          Reconcile invoices.<br />Unlock ITC. File with confidence.
        </h1>

        {/* Sub-text */}
        <p style={{
          fontSize: 14, color: '#666', lineHeight: 1.7,
          marginTop: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
        }}>
          LedgerSync AI automates GST reconciliation for small businesses — so you stop chasing mismatches and start claiming what's yours.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            style={{
              padding: '10px 22px', borderRadius: 5, fontSize: 13, fontWeight: 500,
              background: '#1A1A1A', color: '#FFFFFF', border: 'none',
              cursor: demoLoading ? 'not-allowed' : 'pointer',
              opacity: demoLoading ? 0.7 : 1, transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {demoLoading ? (
              <>
                <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Loading demo…
              </>
            ) : '▶ Try Demo'}
          </button>
          <a href="#features" style={{
            padding: '10px 22px', borderRadius: 5, fontSize: 13, fontWeight: 500,
            background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #E8E5E0',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'}
            onMouseOut={e => e.currentTarget.style.background = '#FFFFFF'}
          >
            Learn More
          </a>
        </div>

        {/* Demo hint */}
        <p style={{ fontSize: 10, color: '#BBBBBB', marginTop: 10 }}>
          demo@taxsync.ai · Demo@1234 · No signup required
        </p>
      </div>

      {/* Feature cards */}
      <div id="features" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
        maxWidth: 700, margin: '48px auto 0', padding: '0 24px 80px',
      }}>
        {features.map((f) => (
          <div key={f.label} style={{
            background: '#FFFFFF', border: '1px solid #E8E5E0',
            borderRadius: 6, padding: 20,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.8px', color: '#B8935A', marginBottom: 8,
            }}>{f.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
