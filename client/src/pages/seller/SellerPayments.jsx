import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function SellerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/payments/seller');
        setPayments(res.data.payments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading payments...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1A1A1A' }}>Payments Received</h2>

      {/* Mock Banner */}
      <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#E65100' }}>
        <span style={{ fontSize: '16px' }}>⚠️</span>
        <span><strong>Demo Mode:</strong> All payments shown are simulated. No real money was transferred.</span>
        <span style={{ marginLeft: 'auto', background: '#C0392B', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>MOCK</span>
      </div>

      <Card title="Received Payments">
        {payments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            No payments received yet. Buyers will see your invoices here once they make mock payments.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Invoice No</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Buyer</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Payment Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid #E8E5E0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{p.invoiceId?.invoiceNumber || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>
                    <div>{p.buyerId?.businessName || p.buyerId?.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{p.buyerId?.gstin || ''}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#C3E6CB', color: '#2D7D4E' }}>
                      Payment received (mock)
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>
                    {p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
