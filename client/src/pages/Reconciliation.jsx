import { useState, useEffect } from 'react';
import api from '../services/api';
import Label from '../components/ui/Label';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function DetailModal({ result, onClose }) {
  if (!result) return null;
  const inv = result.invoiceId;
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Reconciliation Detail</div>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>{inv?.invoiceNumber || 'N/A'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <StatusBadge status={result.matchStatus} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Confidence: {result.confidenceScore}%
          </span>
        </div>

        {/* Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Card style={{ background: 'var(--green-bg)', border: '1px solid #B8D9C4' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Our Record</div>
            <div style={{ fontSize: 11, lineHeight: 1.8 }}>
              <div>Total: <strong className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(result.ourRecord?.totalAmount)}</strong></div>
              <div>GST: <strong className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(result.ourRecord?.gstAmount)}</strong></div>
              <div>Buyer GSTIN: <span className="mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{result.ourRecord?.buyerGstin || '—'}</span></div>
            </div>
          </Card>
          <Card style={{ background: result.matchStatus === 'matched' ? 'var(--green-bg)' : 'var(--red-bg)', border: result.matchStatus === 'matched' ? '1px solid #B8D9C4' : '1px solid #F5C6C2' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Portal Record</div>
            {result.portalRecord ? (
              <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                <div>Total: <strong className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(result.portalRecord?.totalAmount)}</strong></div>
                <div>GST: <strong className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(result.portalRecord?.gstAmount)}</strong></div>
                <div>Buyer GSTIN: <span className="mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{result.portalRecord?.buyerGstin || '—'}</span></div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Not found in GSTR-2A</div>
            )}
          </Card>
        </div>

        {result.differenceAmount > 0 && (
          <div style={{ background: 'var(--amber-bg)', border: '1px solid #EDD8B4', borderRadius: 5, padding: '10px 14px', marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 3 }}>Difference</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--amber)', fontWeight: 600 }}>
              {fmt(result.differenceAmount)}
            </div>
          </div>
        )}

        <div style={{ background: 'var(--bg)', borderRadius: 5, padding: '10px 14px', marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 3 }}>Remarks</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{result.remarks}</div>
        </div>

        <Button variant="secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Close</Button>
      </div>
    </div>
  );
}

export default function Reconciliation() {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const [resRes, sumRes] = await Promise.all([
        api.get(`/reconciliation/results?${params}`),
        api.get('/reconciliation/summary')
      ]);
      setResults(resRes.data.results);
      setTotal(resRes.data.total);
      setPages(resRes.data.pages);
      setSummary(sumRes.data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResults(); }, [page, statusFilter]);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const res = await api.post('/reconciliation/run');
      const s = res.data.stats || res.data.summary?.stats || {};
      setToast({ msg: `Done: ${s.matched || 0} matched · ${s.mismatch || 0} mismatches · ${s.missing || 0} missing`, type: 'success' });
      setTimeout(() => setToast({ msg: '', type: '' }), 5000);
      fetchResults();
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Reconciliation failed', type: 'error' });
      setTimeout(() => setToast({ msg: '', type: '' }), 4000);
    } finally { setRunning(false); }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="fade-in">
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: toast.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${toast.type === 'success' ? '#B8D9C4' : '#F5C6C2'}`,
          borderRadius: 6, padding: '10px 16px', fontSize: 12,
          color: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          maxWidth: 360, animation: 'fadeIn 0.2s ease'
        }}>{toast.msg}</div>
      )}

      {selected && <DetailModal result={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Reconciliation</div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>GST Reconciliation</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Match purchase invoices against GSTR-2A portal data
          </p>
        </div>
        <Button id="run-recon-btn" variant="primary" onClick={runReconciliation} disabled={running}>
          {running ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Running…</> : '⇄ Run Reconciliation'}
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <>
          <Label>Summary</Label>
          <div className="stat-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Total Invoices', value: summary.totalInvoices || 0, color: 'var(--text-primary)' },
              { label: 'Matched',        value: summary.matchCounts?.matched || 0,  color: 'var(--green)' },
              { label: 'Mismatches',     value: summary.matchCounts?.mismatch || 0, color: 'var(--red)' },
              { label: 'Missing',        value: summary.matchCounts?.missing || 0,  color: 'var(--amber)' },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['', 'matched', 'mismatch', 'missing'].map(s => (
          <button key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="table-scroll-hint">Scroll horizontally to view more →</div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Seller GSTIN</th>
              <th>Our Amount</th>
              <th>Portal Amount</th>
              <th>Difference</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">
                No reconciliation results yet. Upload both purchase invoices and GSTR-2A data, then run reconciliation.
              </td></tr>
            ) : results.map(r => (
              <tr key={r._id} onClick={() => setSelected(r)}>
                <td><span className="mono">{r.ourRecord?.invoiceNumber || r.portalRecord?.invoiceNumber || '—'}</span></td>
                <td><span className="mono">{r.ourRecord?.sellerGstin || r.portalRecord?.sellerGstin || '—'}</span></td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{fmt(r.ourRecord?.totalAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{r.portalRecord ? fmt(r.portalRecord?.totalAmount) : <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: r.differenceAmount > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                  {r.differenceAmount > 0 ? fmt(r.differenceAmount) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 40, height: 2, background: '#F0EDE8', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: r.confidenceScore >= 90 ? 'var(--green)' : r.confidenceScore >= 60 ? 'var(--amber)' : 'var(--red)', width: `${r.confidenceScore}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.confidenceScore}%</span>
                  </div>
                </td>
                <td><StatusBadge status={r.matchStatus} /></td>
                <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="secondary" size="xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <Button variant="secondary" size="xs" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
