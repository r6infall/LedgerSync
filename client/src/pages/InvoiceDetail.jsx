import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interactions state
  const [toast, setToast] = useState('');
  const [showFlagNotes, setShowFlagNotes] = useState(false);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}/detail`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        alert('Failed to load invoice details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemind = async () => {
    try {
      await api.post(`/invoices/${id}/remind`);
      setToast('Reminder queued — WhatsApp/email coming soon');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert('Failed to queue reminder');
    }
  };

  const handleFlagConfirm = async () => {
    setFlagging(true);
    try {
      await api.post(`/invoices/${id}/flag`, { notes: flagNotes });
      setShowFlagNotes(false);
      // Refresh data
      const res = await api.get(`/invoices/${id}/detail`);
      setData(res.data);
    } catch (err) {
      alert('Failed to flag invoice');
    } finally {
      setFlagging(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data || !data.invoice) return <div style={{ padding: 24 }}>Invoice not found</div>;

  const { invoice, reconciliation } = data;
  const our = reconciliation?.ourRecord || invoice; // Fallback to invoice if no reco
  const portal = reconciliation?.portalRecord || {};

  const fmt = (n) => n === undefined || n === null ? '—' : `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  // Helper to compare and render row
  const renderRow = (label, ourVal, portalVal, isAmount = false) => {
    const isDiff = String(ourVal) !== String(portalVal) && portalVal !== undefined && portalVal !== '—';
    const bg = isDiff ? '#FEF6F6' : 'transparent';
    const numStyle = isAmount ? { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 } : {};
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 14px', borderTop: '1px solid #F5F2EE', background: bg }}>
        <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#1A1A1A', textAlign: 'center', ...numStyle }}>{ourVal || '—'}</div>
        <div style={{ fontSize: 11, color: '#1A1A1A', textAlign: 'center', ...numStyle }}>
          {portalVal || '—'}
          {isDiff && isAmount && (
            <div style={{ fontSize: 10, color: '#C0392B', marginTop: 4 }}>
              Diff: {fmt(Number(ourVal) - Number(portalVal))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
      
      {toast && (
        <div className="fade-in" style={{
          position: 'absolute', top: 24, right: 24, background: '#FFFFFF',
          border: '1px solid #E8E5E0', borderRadius: 6, padding: '12px 16px',
          borderLeft: '3px solid #2D7D4E', fontSize: 12, color: '#555', zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {toast}
        </div>
      )}

      <div onClick={() => navigate('/invoices')} style={{ fontSize: 11, color: '#B8935A', marginBottom: 16, cursor: 'pointer', display: 'inline-block' }}>
        ← Back to invoices
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
          {invoice.invoiceNumber}
        </h1>
        <StatusBadge status={invoice.status} />
        {invoice.isFlagged && <StatusBadge status="flagged" label="Flagged" />}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
          <div style={{ background: '#FAFAF8', padding: '10px 14px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#BBBBBB' }}>
            Field
          </div>
          <div style={{ background: '#EAF5EE', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: '#2D7D4E', textAlign: 'center' }}>
            Your records
          </div>
          <div style={{ background: '#F0EDE8', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: '#999', textAlign: 'center' }}>
            GST portal
          </div>
        </div>

        {renderRow('Supplier GSTIN', our.sellerGstin, portal.sellerGstin)}
        {renderRow('Invoice Number', our.invoiceNumber, portal.invoiceNumber)}
        {renderRow('Invoice Date', fmtDate(our.invoiceDate), fmtDate(portal.invoiceDate))}
        {renderRow('Taxable Amount', fmt(our.taxableAmount), fmt(portal.taxableAmount), true)}
        {renderRow('GST Amount', fmt(our.gstAmount), fmt(portal.gstAmount), true)}
        {renderRow('Total Amount', fmt(our.totalAmount), fmt(portal.totalAmount), true)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={handleRemind} style={{ color: '#B8935A', borderColor: '#D4C4A0' }}>
          Send Reminder to Supplier
        </Button>
        <Button variant="primary" onClick={() => setShowFlagNotes(!showFlagNotes)}>
          Flag for CA Review
        </Button>
        {(invoice.status === 'mismatch' || invoice.status === 'missing') && (
          <button style={{
            background: '#EAF5EE', color: '#2D7D4E', border: '1px solid #B8D4BC',
            borderRadius: 5, padding: '8px 16px', fontSize: 12, cursor: 'pointer',
            fontWeight: 500
          }}>
            Pay Supplier to Unlock ITC
          </button>
        )}
      </div>

      {showFlagNotes && (
        <div className="fade-in" style={{ marginTop: 12, maxWidth: 400 }}>
          <textarea
            value={flagNotes}
            onChange={e => setFlagNotes(e.target.value)}
            placeholder="Notes for CA..."
            style={{
              width: '100%', border: '1px solid #E8E5E0', borderRadius: 5,
              padding: 8, fontSize: 12, background: '#FAFAF8', minHeight: 60,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical'
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Button variant="primary" size="sm" onClick={handleFlagConfirm} disabled={flagging}>
              {flagging ? 'Saving...' : 'Confirm Flag'}
            </Button>
          </div>
        </div>
      )}

      {invoice.isFlagged && invoice.notes && (
        <div style={{ marginTop: 24, padding: 16, background: '#FFFDF9', borderLeft: '3px solid #B8935A', borderRadius: '0 6px 6px 0', fontSize: 12, color: '#555' }}>
          <div style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>CA Notes:</div>
          {invoice.notes}
        </div>
      )}
    </div>
  );
}
