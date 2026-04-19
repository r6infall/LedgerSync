import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* --- Helpers for Animation --- */
const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
};

export default function HowItWorks() {
  const navigate = useNavigate();

  // Stats
  const stat1 = useCountUp(2.3); 
  const stat2 = useCountUp(43);
  const stat3 = useCountUp(12);

  const [expandedLayer, setExpandedLayer] = useState(null);

  const STEPS = [
    { num: '1', title: 'Upload', desc: 'Buyer uploads purchase invoices (CSV/XLSX). Seller uploads their invoices. Both are validated.', icon: '📁' },
    { num: '2', title: 'Reconcile', desc: 'Our engine compares buyer invoices against GSTR-2A from the GST portal. AI finds and explains every mismatch.', icon: '⚙️' },
    { num: '3', title: 'Resolve', desc: 'Buyer approves, rejects, or requests changes. Seller responds. Payments are tracked. Missing invoices are requested.', icon: '🤝' },
    { num: '4', title: 'File', desc: 'GSTR summary is auto-generated. Compliance score is calculated. You are ready to file.', icon: '📄' }
  ];

  const TECH_LAYERS = [
    { id: 1, name: 'Frontend', color: '#EBF8FF', techs: ['React.js', 'Tailwind CSS', 'Chart.js'], desc: 'Responsive, component-driven UI ensuring a seamless experience across devices.' },
    { id: 2, name: 'AI Engine', color: '#FAF5FF', techs: ['Gemini 1.5 Flash API', '10 AI Features'], desc: 'Google\'s advanced LLM translates complex GST mismatches into plain English and forecasts ITC.' },
    { id: 3, name: 'Backend', color: '#F0FFF4', techs: ['Node.js', 'Express.js', 'node-cron'], desc: 'Robust REST APIs handling data validation, reconciliation logic, and scheduled smart reminders.' },
    { id: 4, name: 'Data Layer', color: '#FFF5F5', techs: ['MongoDB', 'Redis', 'Firebase Auth', 'Mock GST Portal'], desc: 'Secure data persistence, fast caching, and simulated 3rd party integrations.' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', system-ui, sans-serif", color: '#1A1A1A' }}>
      
      {/* Navbar */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E5E0', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', letterSpacing: '-0.3px' }}>LedgerSync</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#B8935A', letterSpacing: '-0.3px' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/ai-features" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#7E22CE', background: '#F3E8FF', border: '1px solid #E9D5FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
            <span>✨</span> See AI in action
          </Link>
          <Link to="/login" style={{ padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#1A1A1A', background: '#FFFFFF', border: '1px solid #E8E5E0', textDecoration: 'none' }}>Login</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 32px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>How LedgerSync works</h1>
          <p style={{ fontSize: '18px', color: '#555', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            An inside look at the reconciliation engine stopping ITC leakage and automating GST compliance.
          </p>
        </div>

        {/* SECTION 1: The Problem */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>The Problem</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#FFF', padding: '32px', borderRadius: '8px', border: '1px solid #E8E5E0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#C0392B', marginBottom: '8px' }}>₹{stat1 === 2 ? '2.3' : stat1}L Cr</div>
              <p style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>ITC blocked annually in India due to invoice mismatches</p>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '16px' }}>*Mock statistic for demonstration</div>
            </div>
            <div style={{ background: '#FFF', padding: '32px', borderRadius: '8px', border: '1px solid #E8E5E0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#E67E22', marginBottom: '8px' }}>{stat2}%</div>
              <p style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>of GST notices are triggered by reconciliation errors</p>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '16px' }}>*Mock statistic for demonstration</div>
            </div>
            <div style={{ background: '#FFF', padding: '32px', borderRadius: '8px', border: '1px solid #E8E5E0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#3498DB', marginBottom: '8px' }}>8-{stat3} hrs</div>
              <p style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>spent per month by SMBs on manual manual invoice matching</p>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '16px' }}>*Mock statistic for demonstration</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: The Solution */}
        <section style={{ marginBottom: '80px', position: 'relative' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>How LedgerSync Solves It</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', position: 'relative' }}>
            {/* Background connecting line */}
            <div style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: '#E8E5E0', zIndex: 0, display: window.innerWidth > 768 ? 'block' : 'none' }}></div>
            
            {STEPS.map((step) => (
              <div key={step.num} style={{ position: 'relative', zIndex: 1, background: '#FFF', padding: '32px 24px', borderRadius: '8px', border: '1px solid #E8E5E0', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#1A1A1A', color: '#FFF', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 700 }}>
                  {step.icon}
                </div>
                <div style={{ position: 'absolute', top: '-10px', left: '10px', fontSize: '60px', fontWeight: 900, color: '#F0EDE8', zIndex: -1 }}>{step.num}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>{step.desc}</p>
                <div style={{ fontSize: '10px', color: '#999', marginTop: '16px', background: '#FAFAF8', padding: '4px', borderRadius: '4px' }}>Mock data powers this demo</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: Tech Stack */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Our Tech Stack</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '700px', margin: '0 auto' }}>
            {TECH_LAYERS.map(layer => (
              <div 
                key={layer.id} 
                onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                style={{ background: layer.color, border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px' }}>Layer {layer.id}: {layer.name}</strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {layer.techs.map(tech => (
                      <span key={tech} style={{ background: '#FFF', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(0,0,0,0.1)' }}>{tech}</span>
                    ))}
                  </div>
                </div>
                {expandedLayer === layer.id && (
                  <div style={{ marginTop: '16px', fontSize: '13px', color: '#555', lineHeight: '1.6', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '4px' }}>
                    {layer.desc}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Data Flow */}
        <section style={{ marginBottom: '80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '40px' }}>Data Flow Animation</h2>
          <div className="flow-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', maxWidth: '800px', margin: '0 auto', background: '#FFF', padding: '40px', borderRadius: '8px', border: '1px solid #E8E5E0', overflow: 'hidden' }}>
            
            {/* Animated Dot Background Track */}
            <div style={{ position: 'absolute', top: '50%', left: '40px', right: '40px', height: '2px', background: '#E8E5E0', zIndex: 1 }}></div>
            
            {/* Moving Dot */}
            <div className="moving-dot" style={{ position: 'absolute', top: 'calc(50% - 6px)', left: '40px', width: '12px', height: '12px', background: '#6B46C1', borderRadius: '50%', zIndex: 2 }}></div>

            {/* Nodes */}
            {['Upload CSV', 'Backend Validate', 'Reconciliation', 'AI Analysis', 'Dashboard'].map((node, i) => (
              <div key={node} style={{ position: 'relative', zIndex: 3, background: '#FFF', padding: '8px 12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '12px', fontWeight: 600 }}>
                {node}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: Mock Data Transparency */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Mock Data Transparency</h2>
          <div style={{ background: '#FFF', border: '1px solid #E8E5E0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#FAFAF8', borderBottom: '1px solid #E8E5E0', fontWeight: 700 }}>
               <div style={{ padding: '16px' }}>🟢 Real Production Tech</div>
               <div style={{ padding: '16px', borderLeft: '1px solid #E8E5E0' }}>🟠 Mocked for Demo</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
               <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ fontSize: '13px' }}>✅ <strong>Gemini AI</strong> (Real live API calls)</div>
                 <div style={{ fontSize: '13px' }}>✅ <strong>MongoDB</strong> (Real database persistence)</div>
                 <div style={{ fontSize: '13px' }}>✅ <strong>Firebase Auth</strong> (Real authentication)</div>
                 <div style={{ fontSize: '13px' }}>✅ <strong>React Frontend</strong> (Real implementation)</div>
                 <div style={{ fontSize: '13px' }}>✅ <strong>Razorpay UI</strong> (Real test-mode SDK)</div>
               </div>
               <div style={{ padding: '16px', borderLeft: '1px solid #E8E5E0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ fontSize: '13px' }}>⚠️ <strong>GST Portal Data</strong> (Simulated NIC JSON, not live govt API)</div>
                 <div style={{ fontSize: '13px' }}>⚠️ <strong>Payments</strong> (No real money transferred)</div>
                 <div style={{ fontSize: '13px' }}>⚠️ <strong>GSTIN Validation</strong> (Regex validated, not govt matched)</div>
                 <div style={{ fontSize: '13px' }}>⚠️ <strong>SMS/WhatsApp</strong> (Displayed in-app only, no real SMS)</div>
               </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: CTA */}
        <section style={{ textAlign: 'center', background: '#1A1A1A', color: '#FFF', padding: '64px 32px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Ready to explore the platform?</h2>
          <p style={{ fontSize: '15px', color: '#CCC', marginBottom: '32px' }}>
            20 purchase invoices, 4 mismatches, 4 missing — all pre-loaded and ready to explore.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>Demo Credentials</div>
            <div style={{ fontSize: '15px', color: '#B8935A', marginTop: '4px' }}>demo@taxsync.ai <span style={{ color: '#666', margin: '0 8px' }}>|</span> Demo@1234</div>
          </div>
          <div>
            <button onClick={() => navigate('/login')} style={{ background: '#FFF', color: '#1A1A1A', border: 'none', padding: '14px 32px', borderRadius: '30px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              See it in action
            </button>
          </div>
        </section>

      </div>

      <style>{`
        @keyframes moveDot {
          0% { left: 40px; }
          25% { left: calc(25% + 20px); }
          50% { left: calc(50%); }
          75% { left: calc(75% - 20px); }
          100% { left: calc(100% - 50px); }
        }
        .moving-dot {
          animation: moveDot 4s infinite ease-in-out;
        }
        @media (max-width: 768px) {
          .flow-container {
            flex-direction: column;
            gap: 24px;
            padding: 24px !important;
          }
          .flow-container > div:nth-child(1) { width: 2px !important; height: auto !important; top: 40px !important; bottom: 40px !important; left: 50% !important; right: auto !important; }
          .moving-dot { display: none; } /* Disable dot on mobile for simplicity */
        }
      `}</style>
    </div>
  );
}
