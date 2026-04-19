import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerMissingInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/missing-invoices/buyer');
      setInvoices(res.data.missingInvoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRequest = async (inv) => {
    if (!window.confirm(`Request Invoice ${inv.invoiceNumber} (₹${inv.totalAmount?.toLocaleString('en-IN')}) from supplier ${inv.sellerGstin}?`)) return;
    setRequesting(inv._id);
    try {
      await api.post('/missing-invoices/request', {
        gstr2aInvoiceId: inv._id,
        note: 'Please upload this invoice so I can verify and claim ITC.'
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Request failed');
    } finally {
      setRequesting(null);
    }
  };

  const getStatusBadge = (inv) => {
    if (inv.requestStatus === 'fulfilled') {
      return <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#C3E6CB', color: '#2D7D4E' }}>✓ Fulfilled</span>;
    }
    if (inv.isOverdue) {
      return (
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#F5C6CB', color: '#721C24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', display: 'inline-block' }} />
          Overdue
        </span>
      );
    }
    if (inv.requestStatus === 'requested') {
      return (
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#FFF3CD', color: '#856404', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B8935A', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          Requested
        </span>
      );
    }
    return <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#E8E5E0', color: '#555' }}>Not requested</span>;
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading missing invoices...</div>;

  return (
    <div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1A1A1A' }}>Missing Invoices</h2>

      {/* Info Banner */}
      <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', padding: '16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', color: '#1B4F72', lineHeight: '1.6' }}>
        <strong style={{ display: 'block', marginBottom: '4px' }}>ℹ️ Why are these invoices missing?</strong>
        These invoices appear in your GSTR-2A — meaning your supplier has already filed them with the government — but you have not received the physical invoice. You need the invoice to verify the purchase and claim ITC.
      </div>

      {/* Summary */}
      {invoices.length > 0 && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', color: '#E65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span><strong>{invoices.length} missing invoice{invoices.length !== 1 ? 's' : ''}</strong> detected by reconciliation engine</span>
          <span style={{ marginLeft: 'auto', background: '#F3E8FF', color: '#7E22CE', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>✨ AI-powered</span>
        </div>
      )}

      <Card>
        {invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            No missing invoices found. All your GSTR-2A records are matched with purchase invoices.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Invoice No</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Supplier GSTIN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Request Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Requested On</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #E8E5E0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: '#1A1A1A' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>{inv.sellerGstin}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(inv)}</td>
                    <td style={{ padding: '14px 16px', color: '#555', fontSize: '12px' }}>
                      {inv.requestedAt ? new Date(inv.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {inv.requestStatus === 'not_requested' ? (
                        <button
                          onClick={() => handleRequest(inv)}
                          disabled={requesting === inv._id}
                          style={{ background: '#1A1A1A', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                        >
                          {requesting === inv._id ? 'Requesting...' : 'Request from supplier'}
                        </button>
                      ) : inv.requestStatus === 'fulfilled' ? (
                        <span style={{ fontSize: '12px', color: '#2D7D4E', fontWeight: 500 }}>✓ Invoice received</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#B8935A', fontWeight: 500 }}>⏳ Awaiting supplier</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
