import { useState, useEffect } from 'react';
import api from '../services/api';
import Label from '../components/ui/Label';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

function PaymentModal({ invoice, onClose, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amount = invoice?.totalAmount || 0;
  const itcUnlock = (invoice?.gstAmount || 0);
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const initPayment = async () => {
    setError(''); setLoading(true);
    try {
      const orderRes = await api.post('/payments/create-order', {
        invoiceId: invoice._id,
        amount
      });
      const { orderId, keyId, paymentId } = orderRes.data;

      if (!window.Razorpay) {
        // Load Razorpay script dynamically
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'LedgerSync',
        description: `ITC Unlock — Invoice ${invoice.invoiceNumber}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId
            });
            onPaid();
          } catch { setError('Payment verification failed'); }
        },
        theme: { color: '#1A1A1A' },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Pay & Unlock ITC</div>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>{invoice?.invoiceNumber}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        {error && <div style={{ background: 'var(--red-bg)', border: '1px solid #F5C6C2', borderRadius: 5, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--red)' }}>{error}</div>}

        <div style={{ background: 'var(--bg)', borderRadius: 6, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Invoice Amount</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>{fmt(amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>ITC to Unlock</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{fmt(itcUnlock)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Paying this invoice will unlock ₹{itcUnlock.toLocaleString('en-IN', { maximumFractionDigits: 2 })} as Input Tax Credit. Payment processed securely via Razorpay.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Button>
          <Button variant="primary" onClick={initPayment} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Processing…</> : `Pay ${fmt(amount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices?status=mismatch&limit=10')
      ]);
      setPayments(payRes.data.payments || []);
      setInvoices(invRes.data.invoices || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePaid = () => {
    setSelectedInvoice(null);
    setToast('Payment verified! ITC unlocked successfully.');
    setTimeout(() => setToast(''), 5000);
    fetchData();
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const totalITCUnlocked = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.itcUnlocked || 0), 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: 'var(--green-bg)', border: '1px solid #B8D9C4',
          borderRadius: 6, padding: '10px 16px', fontSize: 12, color: 'var(--green)',
          animation: 'fadeIn 0.2s ease'
        }}>{toast}</div>
      )}

      {selectedInvoice && <PaymentModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onPaid={handlePaid} />}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>Payments</div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>ITC Unlock Payments</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          Pay suppliers to unlock Input Tax Credit on matched invoices
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <Card>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{fmt(totalITCUnlocked)}</div>
          <div className="stat-label">ITC Unlocked</div>
        </Card>
        <Card>
          <div className="stat-value">{fmt(totalPaid)}</div>
          <div className="stat-label">Total Paid</div>
        </Card>
        <Card>
          <div className="stat-value">{payments.filter(p => p.status === 'completed').length}</div>
          <div className="stat-label">Payments Complete</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending payments (mismatched invoices) */}
        <div>
          <Label>Invoices Requiring Payment</Label>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : invoices.length === 0 ? (
            <div className="card empty-state">No invoices requiring payment</div>
          ) : invoices.map(inv => (
            <Card key={inv._id} style={{ marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div className="mono" style={{ marginBottom: 3 }}>{inv.invoiceNumber}</div>
                  <div className="mono" style={{ fontSize: 9 }}>{inv.sellerGstin}</div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{fmt(inv.totalAmount)}</div>
                  <div style={{ fontSize: 10, color: 'var(--green)' }}>ITC: {fmt(inv.gstAmount)}</div>
                </div>
                <Button id={`pay-btn-${inv._id}`} variant="primary" size="sm" onClick={() => setSelectedInvoice(inv)}>
                  Pay & Unlock
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Payment history */}
        <div>
          <Label>Payment History</Label>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : payments.length === 0 ? (
            <div className="card empty-state">No payment history yet</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>ITC</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td><span className="mono">{p.invoiceId?.invoiceNumber || '—'}</span></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{fmt(p.amount)}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--green)' }}>{fmt(p.itcUnlocked)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
