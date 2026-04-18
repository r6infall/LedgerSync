import { useState, useEffect } from 'react';
import api from '../services/api';
import Label from '../components/ui/Label';
import StatusBadge from '../components/ui/StatusBadge';
import Bar from '../components/ui/Bar';
import NotificationRow from '../components/ui/NotificationRow';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filter, setFilter] = useState('All');

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard/kpis');
      setData(res.data);
      setLastUpdated(new Date());
      
      api.get('/ai/insights').then(r => {
        if (r.data && r.data.insights) setInsights(r.data.insights);
      }).catch(e => console.error(e));
    } catch (err) {
      console.error('Failed to fetch dashboard KPIs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        {/* Header skeleton */}
        <div className="skeleton skeleton-title" style={{ width: 160, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 100, marginBottom: 24 }} />
        {/* KPI cards skeleton */}
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 10 }} />
              <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: 6 }} />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E8E5E0', background: '#FAFAF8' }}>
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '1px solid #F5F2EE', alignItems: 'center' }}>
              <div className="skeleton skeleton-text" style={{ width: '15%' }} />
              <div className="skeleton skeleton-text" style={{ width: '25%' }} />
              <div className="skeleton skeleton-text" style={{ width: '20%' }} />
              <div className="skeleton skeleton-text" style={{ width: '15%' }} />
              <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filteredInvoices = (data.recentInvoices || []).filter(inv => {
    if (filter === 'All') return true;
    return inv.status?.toLowerCase() === filter.toLowerCase();
  }).slice(0, 5);

  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const minsAgo = Math.floor((new Date() - lastUpdated) / 60000);

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Dashboard</h1>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>{monthYear}</div>

      <Label style={{ fontSize: 9, textTransform: 'uppercase', color: '#999', letterSpacing: '0.8px' }}>Reconciliation overview</Label>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {/* Total */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: 6, fontWeight: 600 }}>Total Invoices</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#1A1A1A' }}>{data.totalInvoices}</div>
          <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 3 }}>From Purchase Register</div>
        </div>
        {/* Matched */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: 6, fontWeight: 600 }}>Matched</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#2D7D4E' }}>{data.matchedCount}</div>
          <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 3 }}>Perfect or fuzzy matches</div>
        </div>
        {/* Mismatches */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: 6, fontWeight: 600 }}>Mismatches</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#C0392B' }}>{data.mismatchCount}</div>
          <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 3 }}>Amount discrepancies</div>
        </div>
        {/* ITC at risk */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: 6, fontWeight: 600 }}>ITC At Risk</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#B8935A', fontFamily: "'JetBrains Mono', monospace" }}>{fmtAmt(data.itcAtRisk)}</div>
          <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 3 }}>From missing & mismatches</div>
        </div>
      </div>

      <div className="ai-insights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 20 }}>
        {/* Compliance Score Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 16 }}>
          <div className="section-label" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 10 }}>Compliance score</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>{data.complianceScore}</div>
          
          <div style={{ marginTop: 8 }}>
            <span style={{ 
              borderRadius: 20, fontSize: 9, fontWeight: 600, padding: '2px 8px', textTransform: 'uppercase',
              background: data.riskLevel === 'low' ? '#EAF5EE' : data.riskLevel === 'medium' ? '#FEF6E7' : '#FDECEA',
              color: data.riskLevel === 'low' ? '#2D7D4E' : data.riskLevel === 'medium' ? '#B8935A' : '#C0392B'
            }}>
              {data.riskLevel} risk
            </span>
          </div>
          
          <div style={{ fontSize: 9, color: '#BBBBBB', marginTop: 4, marginBottom: 14 }}>
            Updated {minsAgo === 0 ? 'just now' : `${minsAgo} min ago`}
          </div>

          <div style={{ marginBottom: 16 }}>
            <Bar label="ITC Claimed" value={data.itcClaimed} max={Math.max(data.itcAvailable, 1)} colorClass="bar-fill-green" />
            <div style={{ marginBottom: 6 }} />
            <Bar label="ITC Available" value={data.itcAvailable} max={Math.max(data.itcAvailable, 1)} colorClass="bar-fill-amber" />
            <div style={{ marginBottom: 6 }} />
            <Bar label="ITC at Risk" value={data.itcAtRisk} max={Math.max(data.itcAvailable, 1)} colorClass="bar-fill-red" />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F0EDE8', margin: '0 0 12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GSTR-1 due</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: data.gstr1DaysLeft <= 5 ? '#B8935A' : '#2D7D4E' }}>In {data.gstr1DaysLeft} days</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GSTR-3B due</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: data.gstr3bDaysLeft <= 5 ? '#B8935A' : '#2D7D4E' }}>In {data.gstr3bDaysLeft} days</span>
          </div>
        </div>

        {/* Right card — two panels */}
        <div className="upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #E8E5E0', borderRadius: 6, overflow: 'hidden', background: '#FFFFFF' }}>
          {/* Recent alerts */}
          <div style={{ padding: 14, borderRight: '1px solid #E8E5E0' }}>
            <div className="section-label" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 10 }}>Recent alerts</div>
            {(data.recentAlerts || []).length === 0 ? (
              <div style={{ fontSize: 11, color: '#BBBBBB' }}>No new alerts</div>
            ) : (
              (data.recentAlerts || []).map(a => <NotificationRow key={a._id} notification={a} />)
            )}
          </div>
          {/* AI advisor */}
          <div style={{ padding: 14 }}>
            <div className="section-label" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 10 }}>AI advisor</div>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.6, background: '#FAFAF8', borderRadius: 4, border: '1px solid #F0EDE8', borderLeft: '2px solid #B8935A', padding: 10, marginBottom: 10 }}>
              "Your compliance score is {data.complianceScore}/100. Resolving your {data.mismatchCount} mismatches could unlock {fmtAmt(data.itcAtRisk)} in pending ITC claims."
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['How to fix mismatches?', 'What is GSTR-2A?'].map(q => (
                <div key={q} onClick={() => navigate('/ai-insights')} style={{ fontSize: 9, background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 20, padding: '3px 8px', color: '#666', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#B8935A'; e.currentTarget.style.color = '#B8935A'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E8E5E0'; e.currentTarget.style.color = '#666'; }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Label style={{ fontSize: 9, textTransform: 'uppercase', color: '#999', letterSpacing: '0.8px' }}>Invoice ledger</Label>
      
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['All', 'Mismatch', 'Missing', 'Matched'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#1A1A1A' : '#FFFFFF',
            color: filter === f ? '#FFFFFF' : '#999',
            border: filter === f ? '1px solid #1A1A1A' : '1px solid #E8E5E0',
            borderRadius: 20, fontSize: 9, padding: '3px 10px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            {f}
          </button>
        ))}
      </div>

      <div className="table-scroll-hint">Scroll horizontally to view more →</div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier GSTIN</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Taxable Amount</th>
              <th>GST Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: 11 }}>No invoices found</td></tr>
            ) : filteredInvoices.map(inv => (
              <tr key={inv._id}>
                <td><span className="mono">{inv.sellerGstin}</span></td>
                <td><span className="mono">{inv.invoiceNumber}</span></td>
                <td style={{ fontSize: 11, color: '#999' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmtAmt(inv.taxableAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmtAmt(inv.gstAmount)}</td>
                <td><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => navigate('/invoices')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#B8935A', cursor: 'pointer', padding: 0 }}>
          View all invoices →
        </button>
      </div>

      {/* AI Insights Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 16, marginTop: 20 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600, marginBottom: 12 }}>
          AI insights
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.length > 0 ? insights.map((insight, idx) => (
            <div key={idx} style={{
              borderLeft: '2px solid #B8935A', background: '#FAFAF8',
              padding: '10px 12px', borderRadius: 4, fontSize: 12, color: '#555', lineHeight: 1.6
            }}>
              {insight}
            </div>
          )) : (
            <div style={{ fontSize: 12, color: '#999' }}>Loading AI insights...</div>
          )}
        </div>
        <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 12 }}>
          Powered by Gemini
        </div>
      </div>

    </div>
  );
}
