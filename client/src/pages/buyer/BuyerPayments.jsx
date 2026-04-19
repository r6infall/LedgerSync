import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import MockRazorpayModal from '../../components/ui/MockRazorpayModal';
import api from '../../services/api';

export default function BuyerPayments() {
  const [payments, setPayments] = useState([]);
  const [payable, setPayable] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/payments/buyer');
      setPayments(res.data.payments || []);
      setPayable(res.data.payableInvoices || []);
      setOverdue(res.data.overdueInvoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePaySuccess = async (paymentData) => {
    try {
      await api.post('/payments/mock-confirm', paymentData);
      // Refresh after short delay to let DB update
      setTimeout(() => {
        setPayingInvoice(null);
        fetchData();
      }, 1500);
    } catch (err) {
      alert('Payment error: ' + (err.response?.data?.error || err.message));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (status) => {
    const styles = {
      paid: { bg: '#C3E6CB', color: '#2D7D4E' },
      pending: { bg: '#FFF3CD', color: '#856404' },
      processing: { bg: '#D1ECF1', color: '#0C5460' },
      failed: { bg: '#F5C6CB', color: '#721C24' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading payment data...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1A1A1A' }}>Payment Tracking</h2>

      {/* Mock Banner */}
      <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#E65100' }}>
        <span style={{ fontSize: '16px' }}>⚠️</span>
        <span><strong>Demo Mode:</strong> All payments in this demo are simulated. No real transactions occur.</span>
        <span style={{ marginLeft: 'auto', background: '#C0392B', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>MOCK</span>
      </div>

      {/* Payable Invoices */}
      {payable.length > 0 && (
        <Card title="Pending Payments" style={{ marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Invoice No</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Supplier</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payable.map(inv => {
                const isOverdue = overdue.some(o => o._id === inv._id);
                return (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #E8E5E0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>{inv.sellerGstin}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {isOverdue ? (
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#F5C6CB', color: '#721C24' }}>Overdue</span>
                      ) : (
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#FFF3CD', color: '#856404' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setPayingInvoice(inv)}
                        style={{ background: '#2D7D4E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >
                        Pay Supplier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Completed Payments */}
      <Card title="Payment History">
        {payments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            No payments recorded yet. Complete a mock payment to see it here.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Invoice No</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Supplier</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Transaction ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Paid On</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>ITC Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr
                  key={p._id}
                  onClick={() => setSelectedPayment(p)}
                  style={{ borderBottom: '1px solid #E8E5E0', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{p.invoiceId?.invoiceNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{p.invoiceId?.sellerGstin || '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {statusBadge(p.status)}
                    <span style={{ marginLeft: '6px', fontSize: '10px', background: '#E8E5E0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>MOCK</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>
                    {p.transactionId}
                    <span style={{ marginLeft: '6px', background: '#C0392B', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px' }}>MOCK PAYMENT</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>
                    {p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {p.itcUnlocked ? (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#C3E6CB', color: '#2D7D4E' }}>✓ Unlocked ₹{p.itcAmount?.toLocaleString('en-IN')}</span>
                    ) : (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#FFF3CD', color: '#856404' }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Payment Detail Card (click to expand) */}
      {selectedPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '500px', maxWidth: '95vw', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Payment Detail</h3>
              <button onClick={() => setSelectedPayment(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#555' }}>Invoice</span><strong>{selectedPayment.invoiceId?.invoiceNumber}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#555' }}>Amount</span><strong>₹{selectedPayment.amount?.toLocaleString('en-IN')}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#555' }}>Method</span><strong>{selectedPayment.paymentMethod?.replace('mock_', 'Mock ').toUpperCase()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555' }}>Transaction ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '11px', background: '#F5F5F0', padding: '2px 6px', borderRadius: '4px' }}>{selectedPayment.transactionId}</code>
                  <button onClick={() => copyToClipboard(selectedPayment.transactionId)} style={{ background: 'none', border: '1px solid #E8E5E0', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555' }}>Mock Razorpay Signature</span>
                <code style={{ fontSize: '9px', background: '#F5F5F0', padding: '2px 6px', borderRadius: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedPayment.mockSignature}>
                  {selectedPayment.mockSignature}
                </code>
              </div>
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <span style={{ fontSize: '10px', color: '#C0392B', fontWeight: 600 }}>↑ Simulated — not a real HMAC</span>
              </div>
            </div>

            {/* Payment Timeline */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #E8E5E0', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>Payment Timeline</div>
              <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #E8E5E0', marginLeft: '8px' }}>
                {(selectedPayment.timeline || []).map((t, idx) => {
                  const colors = {
                    payment_initiated: '#B8935A',
                    payment_processing: '#8A92A6',
                    payment_confirmed: '#2D7D4E',
                    itc_unlocked: '#2D7D4E'
                  };
                  const labels = {
                    payment_initiated: 'Payment initiated',
                    payment_processing: 'Mock payment processing',
                    payment_confirmed: 'Payment confirmed',
                    itc_unlocked: 'ITC unlocked'
                  };
                  return (
                    <div key={idx} style={{ position: 'relative', marginBottom: '20px' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: colors[t.event] || '#8A92A6', border: '2px solid #FFF' }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                        {labels[t.event] || t.event} <span style={{ fontWeight: 400, color: '#555' }}>— {t.actor}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {new Date(t.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      {t.note && (
                        <div style={{ fontSize: '12px', color: '#555', background: '#FAFAF8', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E8E5E0', marginTop: '4px' }}>
                          {t.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ITC Confirmation */}
            {selectedPayment.itcUnlocked && (
              <div style={{ background: '#E9F5EC', border: '1px solid #C3E6CB', padding: '12px 16px', borderRadius: '6px', marginTop: '16px', fontSize: '13px', color: '#2D7D4E' }}>
                <strong>✓ ITC Unlocked:</strong> ₹{selectedPayment.itcAmount?.toLocaleString('en-IN')} is now claimable.
                <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                  Confirmed at: {selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleString('en-IN') : '—'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mock Razorpay Modal */}
      {payingInvoice && (
        <MockRazorpayModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
