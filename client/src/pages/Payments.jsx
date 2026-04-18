import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import Label from '../components/ui/Label';
import Toast from '../components/ui/Toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/payments/history');
      setPayments(res.data.payments);
      setPendingInvoices(res.data.pendingInvoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handlePayNow = async (invoice) => {
    setProcessingId(invoice._id);
    try {
      // 1. Create order
      const createRes = await api.post('/payments/create', {
        invoiceId: invoice._id,
        amount: invoice.taxableAmount + invoice.gstAmount,
        supplierGstin: invoice.sellerGstin
      });

      // Simulating Razorpay modal checkout delay in test mode
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Verify payment (Mocked successful callback from Razorpay)
      const verifyRes = await api.post('/payments/verify', {
        razorpayOrderId: createRes.data.orderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        invoiceId: invoice._id
      });

      setToast({ message: `Payment complete! ₹${verifyRes.data.itcUnlocked.toLocaleString('en-IN')} ITC unlocked.`, type: 'success' });
      fetchHistory(); // Refresh tables

    } catch (err) {
      setToast({ message: 'Payment failed. Please try again.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Payments</h1>
        <div style={{ fontSize: 12, color: '#999' }}>Pay suppliers to unlock blocked ITC</div>
      </div>

      <div style={{ background: '#FEF6E7', border: '1px solid #E8D5A8', borderRadius: 6, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B8935A', marginTop: 5, flexShrink: 0 }} />
        <div style={{ fontSize: 11, color: '#8A6A30', lineHeight: 1.6 }}>
          Paying a supplier directly unlocks the ITC associated with their invoice. The tax credit reflects in your compliance score immediately.
        </div>
      </div>

      <Label style={{ fontSize: 9, textTransform: 'uppercase', color: '#999', letterSpacing: '0.8px' }}>Invoices pending payment</Label>
      <div className="table-container" style={{ marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Supplier GSTIN</th>
              <th>Invoice No</th>
              <th>Amount Due</th>
              <th>GST Amount</th>
              <th>ITC to Unlock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingInvoices.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: 11 }}>No pending invoices found</td></tr>
            ) : pendingInvoices.map(inv => (
              <tr key={inv._id}>
                <td><span className="mono">{inv.sellerGstin}</span></td>
                <td><span className="mono">{inv.invoiceNumber}</span></td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmtAmt(inv.taxableAmount + inv.gstAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmtAmt(inv.gstAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2D7D4E', fontWeight: 600 }}>{fmtAmt(inv.gstAmount)}</td>
                <td>
                  <button 
                    onClick={() => handlePayNow(inv)}
                    disabled={processingId === inv._id}
                    style={{
                      background: '#EAF5EE', color: '#2D7D4E', border: '1px solid #B8D4BC',
                      borderRadius: 5, padding: '5px 12px', fontSize: 11, fontWeight: 500,
                      cursor: processingId === inv._id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s', opacity: processingId === inv._id ? 0.6 : 1
                    }}
                    onMouseOver={e => { if(processingId !== inv._id) { e.currentTarget.style.background = '#2D7D4E'; e.currentTarget.style.color = 'white'; } }}
                    onMouseOut={e => { if(processingId !== inv._id) { e.currentTarget.style.background = '#EAF5EE'; e.currentTarget.style.color = '#2D7D4E'; } }}
                  >
                    {processingId === inv._id ? 'Processing...' : 'Pay Now'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Label style={{ fontSize: 9, textTransform: 'uppercase', color: '#999', letterSpacing: '0.8px', marginTop: 24 }}>Payment history</Label>
      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Supplier GSTIN</th>
              <th>Amount Paid</th>
              <th>ITC Unlocked</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: 11 }}>No payments found</td></tr>
            ) : payments.map(pay => (
              <tr key={pay._id}>
                <td><span className="mono">{pay.invoiceId?.invoiceNumber || 'Unknown'}</span></td>
                <td><span className="mono">{pay.invoiceId?.sellerGstin || 'Unknown'}</span></td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmtAmt(pay.amount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, color: '#2D7D4E' }}>{fmtAmt(pay.itcUnlocked)}</td>
                <td style={{ fontSize: 11, color: '#999' }}>{new Date(pay.createdAt).toLocaleDateString('en-IN')}</td>
                <td><StatusBadge status={pay.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
