import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DemoBanner() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (user?.email !== 'demo@taxsync.ai') return null;

  return (
    <>
      <div style={{
        width: '100%',
        background: '#FFF3CD',
        borderBottom: '1px solid #FFEAA7',
        color: '#856404',
        padding: '12px 24px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong>Demo mode</strong> — You are viewing Ravi Textiles Pvt Ltd (GSTIN: 27ABCDE1234F1Z5). All invoices, payments, and AI responses use simulated data.
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', color: '#856404', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
        >
          What is demo mode?
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Demo Mode Explained</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              You are currently logged into our seeded demonstration environment. Instead of connecting to the live Government NIC APIs, this environment acts against localized test data allowing you to immediately evaluate the AI capabilities without providing real business identifiers.
            </p>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              You can view the exact technical breakdown of the generated seed data by visiting the <Link to="/about-data" onClick={() => setShowModal(false)} style={{ color: '#B8935A' }}>Seed Data Manifest</Link>.
            </p>
            <button onClick={() => setShowModal(false)} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
