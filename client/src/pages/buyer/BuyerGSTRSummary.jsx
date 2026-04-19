import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerGSTRSummary() {
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const [aiRes, reconRes] = await Promise.all([
        api.get('/ai/gstr-summary'),
        api.get('/reconciliation/summary')
      ]);
      setSummary(aiRes.data);
      setStats(reconRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/ai/gstr-summary');
      setSummary(res.data);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchSummary(); }, []);

  // Derive ITC from stats
  const matchedITC = stats?.matchCounts?.matched ? stats.matchCounts.matched * 4500 : 54000;
  const mismatchITC = stats?.matchCounts?.mismatch ? stats.matchCounts.mismatch * 5400 : 21600;
  const missingITC = stats?.matchCounts?.missing ? stats.matchCounts.missing * 8100 : 32400;
  const totalGross = matchedITC + mismatchITC + missingITC;
  const totalIneligible = mismatchITC + missingITC;
  const totalNet = matchedITC;
  const taxLiability = Math.round(totalGross * 0.33);
  const cashToPay = Math.max(0, taxLiability - totalNet);

  const handlePrint = () => window.print();

  return (
    <div>
      <style>{`@media print { .no-print { display: none !important; } body { background: #FFF !important; } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: '0 0 4px' }}>GSTR-3B Summary — March 2025</h2>
          <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Mock return preview — not submitted to GST portal</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
          <span style={{ background: '#FFF3CD', color: '#856404', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #FFE0B2' }}>MOCK DATA</span>
          <button onClick={handlePrint} style={{ background: '#1A1A1A', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🖨 Export as PDF</button>
        </div>
      </div>

      <div className="no-print" style={{ background: '#EBF5FB', border: '1px solid #AED6F1', padding: '12px 16px', borderRadius: '6px', fontSize: '12px', marginBottom: '24px', color: '#1B4F72', lineHeight: '1.5' }}>
        This is a simulated GSTR-3B view for demonstration. In production, this data would be submitted to the GST portal via NIC APIs.
      </div>

      {/* Section 1: AI Summary */}
      <Card style={{ marginBottom: '24px', border: '2px solid #E9D5FF', background: '#FAF5FF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E9D5FF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '14px', color: '#7E22CE' }}>AI-Generated Summary</strong>
            <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>✨ Gemini 2.5 Flash</span>
          </div>
          <button className="no-print" onClick={regenerate} disabled={refreshing} style={{ background: '#7E22CE', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? '⟳ Regenerating...' : '⟳ Regenerate'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#7E22CE', fontStyle: 'italic' }}>Generating your personalized GST readiness report...</div>
        ) : !summary || summary.error ? (
          <div style={{ color: '#C0392B' }}>Summary unavailable. Please reconcile invoices first.</div>
        ) : (
          <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '12px', fontWeight: 500, color: '#1A1A1A' }}>{summary.paragraph1}</p>
            <p style={{ marginBottom: '12px', background: '#FFF', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>{summary.paragraph2}</p>
            <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: '#10B981' }}>Action Plan:</strong>
              {summary.paragraph3}
            </div>
          </div>
        )}
      </Card>

      {/* Section 3: Table 4 - Eligible ITC */}
      <Card title="Table 4 — Eligible ITC" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '2px solid #E8E5E0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>ITC Source</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#555' }}>Gross ITC</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#555' }}>Ineligible</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#555' }}>Net ITC</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#555' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E8E5E0' }}>
              <td style={{ padding: '12px' }}>GSTR-2A matched invoices</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#2D7D4E' }}>₹{matchedITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>₹0</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#2D7D4E' }}>₹{matchedITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: '#E8E5E0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Mock</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E8E5E0', background: '#FFFBF0' }}>
              <td style={{ padding: '12px' }}>Mismatched (Rule 37A risk)</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#B8935A' }}>₹{mismatchITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#C0392B' }}>₹{mismatchITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>₹0</td>
              <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: '#E8E5E0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Mock</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E8E5E0', background: '#FFF5F5' }}>
              <td style={{ padding: '12px' }}>Missing invoices</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#C0392B' }}>₹{missingITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#C0392B' }}>₹{missingITC.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>₹0</td>
              <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: '#E8E5E0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Mock</span></td>
            </tr>
            <tr style={{ background: '#F5F5F0', fontWeight: 700 }}>
              <td style={{ padding: '12px' }}>Total</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>₹{totalGross.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#C0392B' }}>₹{totalIneligible.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#2D7D4E' }}>₹{totalNet.toLocaleString('en-IN')}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ background: '#E8E5E0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Mock</span></td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Section 4: Tax Payment Summary */}
      <Card title="Payment of Tax Summary" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Tax Liability</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A' }}>₹{taxLiability.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: '#E9F5EC', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#2D7D4E', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>ITC Available</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2D7D4E' }}>₹{totalNet.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: '#FFF3E0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#E65100', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Cash to Pay</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#E65100' }}>₹{cashToPay.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>Mock calculation based on 18% GST rate</div>
      </Card>
    </div>
  );
}
