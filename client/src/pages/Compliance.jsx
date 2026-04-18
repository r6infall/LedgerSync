import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';

export default function Compliance() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    api.get('/compliance/score')
      .then(res => {
        setData(res.data);
        setLastUpdated(new Date());
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const minsAgo = Math.floor((new Date() - lastUpdated) / 60000);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) return null;

  // SVG Circle calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;
  
  let strokeColor = '#C0392B'; // High risk (red)
  if (data.riskLevel === 'low') strokeColor = '#2D7D4E'; // Green
  else if (data.riskLevel === 'medium') strokeColor = '#B8935A'; // Amber

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Compliance</h1>
        <div style={{ fontSize: 12, color: '#999' }}>Your GST health at a glance</div>
      </div>

      {/* Section 1 — Score hero card */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6,
        padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="50" cy="50" r={radius}
              fill="none" stroke="#F0EDE8" strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r={radius}
              fill="none" stroke={strokeColor} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#1A1A1A'
          }}>
            {data.score}
          </div>
        </div>

        <div>
          <span style={{ 
            borderRadius: 20, fontSize: 9, fontWeight: 600, padding: '2px 8px', textTransform: 'uppercase',
            background: data.riskLevel === 'low' ? '#EAF5EE' : data.riskLevel === 'medium' ? '#FEF6E7' : '#FDECEA',
            color: data.riskLevel === 'low' ? '#2D7D4E' : data.riskLevel === 'medium' ? '#B8935A' : '#C0392B'
          }}>
            {data.riskLevel} risk
          </span>
          <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 4, marginBottom: 12 }}>
            Last calculated {minsAgo === 0 ? 'just now' : `${minsAgo} minutes ago`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px 24px' }}>
            <div style={{ fontSize: 11, color: '#999' }}>ITC Claimed</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{fmtAmt(data.itcClaimed)}</div>
            
            <div style={{ fontSize: 11, color: '#999' }}>ITC Available</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{fmtAmt(data.itcAvailable)}</div>
            
            <div style={{ fontSize: 11, color: '#999' }}>ITC at Risk</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#C0392B' }}>{fmtAmt(data.itcAtRisk)}</div>
          </div>
        </div>
      </div>

      {/* Section 2 — Two cards side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Left card — Filing deadlines */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 12 }}>
            Filing deadlines
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8 }}>Return Type</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8 }}>Due Date</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8 }}>Days Left</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.filingDeadlines.map((deadline, i) => {
                let color = '#2D7D4E'; // safe
                if (deadline.status === 'warning') color = '#B8935A';
                else if (deadline.status === 'urgent') color = '#C0392B';

                return (
                  <tr key={i}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #F5F2EE', fontSize: 12, fontWeight: 500, color: '#1A1A1A' }}>
                      {deadline.returnType}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #F5F2EE', fontSize: 11, color: '#555' }}>
                      {new Date(deadline.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #F5F2EE', fontSize: 11, fontWeight: 600, color }}>
                      {deadline.daysRemaining} days
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #F5F2EE' }}>
                      <StatusBadge status={deadline.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right card — Penalty estimate */}
        <div style={{ background: '#FDECEA', border: '1px solid #F5C6C2', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#C0392B', fontWeight: 600, marginBottom: 12 }}>
            Estimated penalty risk
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#C0392B', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {fmtAmt(data.penaltyEstimate)}
          </div>
          <div style={{ fontSize: 10, color: '#E8857A', marginTop: 4 }}>
            Based on 18% penalty on unresolved ITC at risk
          </div>
          <div style={{ fontSize: 11, color: '#C0392B', marginTop: 12 }}>
            Resolving all mismatches would reduce this to ₹0
          </div>
          <div 
            onClick={() => navigate('/invoices?status=mismatch')}
            style={{ fontSize: 11, color: '#C0392B', textDecoration: 'underline', cursor: 'pointer', marginTop: 8, display: 'inline-block' }}
          >
            Resolve mismatches →
          </div>
        </div>
      </div>

      {/* Section 3 — Risky suppliers card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 12 }}>
          Suppliers at risk
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8, borderBottom: '1px solid #E8E5E0' }}>Supplier GSTIN</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8, borderBottom: '1px solid #E8E5E0' }}>Mismatches</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8, borderBottom: '1px solid #E8E5E0' }}>Amount at risk</th>
                <th style={{ textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#BBBBBB', paddingBottom: 8, borderBottom: '1px solid #E8E5E0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.topRiskySuppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px 0', textAlign: 'center', fontSize: 11, color: '#999' }}>
                    No risky suppliers found.
                  </td>
                </tr>
              ) : data.topRiskySuppliers.map((supplier, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid #F5F2EE' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#888' }}>
                      {supplier.gstin}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid #F5F2EE', fontSize: 12, fontWeight: 600, color: '#C0392B' }}>
                    {supplier.mismatchCount}
                  </td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid #F5F2EE' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#B8935A' }}>
                      {fmtAmt(supplier.amountAtRisk)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid #F5F2EE' }}>
                    <span 
                      onClick={() => navigate(`/invoices?gstin=${supplier.gstin}`)}
                      style={{ fontSize: 10, color: '#B8935A', cursor: 'pointer', fontWeight: 500 }}
                    >
                      View invoices →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
