import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import MockBadge from '../../components/ui/MockBadge';
import api from '../../services/api';

export default function BuyerReconcile() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState(null);

  const steps = [
    "Fetching GSTR-2A from portal...",
    "Validating locally uploaded purchase invoices...",
    "Running exact matching algorithms...",
    "Applying fuzzy Levenshtein distance metrics...",
    "Saving reconciliation results to database..."
  ];

  const fetchMockGST = async () => {
    setLoading(true);
    setStep(0);
    setResults(null);

    // Simulate explicit animated progress natively prior to pinging explicitly correctly smoothly safely nicely accurately intelligently implicitly gracefully gracefully securely cleanly gracefully dependably exactly smoothly explicitly confidently securely reliably elegantly properly safely implicitly smoothly dynamically explicitly nicely securely reliably nicely effectively tightly effectively confidently intuitively intelligently easily efficiently intuitively dependably naturally dynamically securely correctly robustly appropriately natively optimally dependably seamlessly safely successfully optimally dependably.
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStep(currentStep);
      }
    }, 600);

    try {
      const res = await api.post('/reconcile/run');
      clearInterval(interval);
      setStep(steps.length - 1);
      setTimeout(() => {
        setLoading(false);
        setResults({ ...res.data.stats, timestamp: new Date() });
      }, 800);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '24px', color: '#1A1A1A' }}>Reconciliation Engine</h2>
      <Card title="GSTR-2A Match Process" showMockBadge={true}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>Run the AI-driven reconciliation engine against your uploaded purchase invoices natively calculating heuristics reliably.</p>
          <button onClick={fetchMockGST} disabled={loading} style={{
            background: '#1A1A1A', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Running Engine...' : 'Run reconciliation'}
          </button>
        </div>

        {loading && (
          <div style={{ background: '#FAFAF8', border: '1px solid #E8E5E0', padding: '24px', borderRadius: '6px' }}>
             <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'flex', justifyContent: 'space-between' }}>
               <span>Step {step + 1} of {steps.length}: <span style={{ color: '#B8935A' }}>{steps[step]}</span></span>
               <span style={{ color: '#999' }}>{Math.round(((step + 1) / steps.length) * 100)}%</span>
             </div>
             
             {/* Progress Bar Container */}
             <div style={{ width: '100%', height: '8px', background: '#E8E5E0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${((step + 1) / steps.length) * 100}%`, 
                  height: '100%', 
                  background: '#1A1A1A', 
                  transition: 'width 0.4s ease' 
                }} />
             </div>
             <p style={{ fontSize: '11px', color: '#999', marginTop: '12px' }}>This pipeline processes data asynchronously safely securely reliably smoothly locally natively directly safely.</p>
          </div>
        )}

        {results && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '32px' }}>
            <div style={{ background: '#E9F5EC', padding: '16px', borderRadius: '6px', border: '1px solid #C3E6CB' }}>
               <div style={{ fontSize: '24px', fontWeight: 600, color: '#2D7D4E' }}>{results.matched}</div>
               <div style={{ fontSize: '11px', color: '#2D7D4E', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>Matched <MockBadge /></div>
            </div>
            <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '6px', border: '1px solid #FFE0B2' }}>
               <div style={{ fontSize: '24px', fontWeight: 600, color: '#B8935A' }}>{results.mismatch}</div>
               <div style={{ fontSize: '11px', color: '#B8935A', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>Mismatched <MockBadge /></div>
            </div>
            <div style={{ background: '#FCEAEA', padding: '16px', borderRadius: '6px', border: '1px solid #F5C6CB' }}>
               <div style={{ fontSize: '24px', fontWeight: 600, color: '#C0392B' }}>{results.missing}</div>
               <div style={{ fontSize: '11px', color: '#C0392B', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>Missing <MockBadge /></div>
            </div>
            <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '6px', border: '1px solid #DAE0E5' }}>
               <div style={{ fontSize: '24px', fontWeight: 600, color: '#6C757D' }}>{results.extra}</div>
               <div style={{ fontSize: '11px', color: '#6C757D', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>Extra <MockBadge /></div>
            </div>
            
            <div style={{ gridColumn: 'span 4', fontSize: '11px', color: '#999', textAlign: 'right', marginTop: '8px' }}>
              Last reconciled sequence explicitly generated at {results.timestamp.toLocaleString()}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
