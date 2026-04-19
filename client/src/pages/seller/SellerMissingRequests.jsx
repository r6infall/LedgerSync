import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function SellerMissingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState(null);
  const [uploadModal, setUploadModal] = useState(null);
  const [uploadNote, setUploadNote] = useState('');

  const fetchData = async () => {
    try {
      const res = await api.get('/missing-invoices/seller');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFulfill = async () => {
    if (!uploadModal) return;
    setFulfilling(uploadModal._id);
    try {
      await api.post(`/missing-invoices/${uploadModal._id}/fulfill`, { note: uploadNote || 'Invoice uploaded via LedgerSync' });
      setUploadModal(null);
      setUploadNote('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Fulfillment failed');
    } finally {
      setFulfilling(null);
    }
  };

  const getStatusBadge = (req) => {
    if (req.status === 'fulfilled') {
      return <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#C3E6CB', color: '#2D7D4E' }}>✓ Fulfilled</span>;
    }
    if (req.isOverdue) {
      return (
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#F5C6CB', color: '#721C24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', display: 'inline-block' }} />
          Overdue
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: '#FFF3CD', color: '#856404', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B8935A', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
        Pending
      </span>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading requests...</div>;

  return (
    <div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1A1A1A' }}>Missing Invoice Requests</h2>

      <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', padding: '16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', color: '#1B4F72', lineHeight: '1.6' }}>
        <strong>📩 Buyers have requested these invoices.</strong> They appear in your GSTR filings but the buyer hasn't received the physical invoice. Upload the invoice to help them verify the purchase and claim ITC.
      </div>

      <Card>
        {requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
            No missing invoice requests. All your buyers have received their invoices.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Invoice No</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Buyer Business</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Your Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Days Since</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#555' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #E8E5E0', background: req.isOverdue ? '#FFF5F5' : 'transparent' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: '#1A1A1A' }}>{req.gstr2aInvoiceData?.invoiceNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>
                      <div>{req.buyerId?.businessName || req.buyerId?.name || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>{req.buyerId?.gstin || ''}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{req.gstr2aInvoiceData?.totalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px', color: '#555' }}>
                      {req.gstr2aInvoiceData?.invoiceDate ? new Date(req.gstr2aInvoiceData.invoiceDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(req)}</td>
                    <td style={{ padding: '14px 16px', color: req.isOverdue ? '#C0392B' : '#555', fontWeight: req.isOverdue ? 600 : 400 }}>
                      {req.daysSinceRequest} day{req.daysSinceRequest !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {req.status === 'fulfilled' ? (
                        <span style={{ fontSize: '12px', color: '#2D7D4E', fontWeight: 500 }}>✓ Uploaded</span>
                      ) : (
                        <button
                          onClick={() => { setUploadModal(req); setUploadNote(''); }}
                          style={{ background: '#2D7D4E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                        >
                          Upload now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {uploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFF', borderRadius: '8px', padding: '24px', width: '440px', maxWidth: '95vw' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>Upload Invoice {uploadModal.gstr2aInvoiceData?.invoiceNumber}</h3>
            <p style={{ fontSize: '12px', color: '#555', margin: '0 0 20px' }}>
              Amount: ₹{uploadModal.gstr2aInvoiceData?.totalAmount?.toLocaleString('en-IN')} · Buyer: {uploadModal.buyerId?.businessName || uploadModal.buyerId?.name}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>Upload File (CSV/PDF)</label>
              <input
                type="file"
                accept=".csv,.pdf,.xlsx"
                style={{ width: '100%', fontSize: '13px', border: '1px solid #E8E5E0', borderRadius: '4px', padding: '8px' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>For demo purposes, file upload is simulated</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>Note (optional)</label>
              <textarea
                value={uploadNote}
                onChange={e => setUploadNote(e.target.value)}
                placeholder="e.g. Invoice was emailed on April 10th, please check your records."
                style={{ width: '100%', height: '70px', border: '1px solid #E8E5E0', borderRadius: '4px', padding: '10px', fontSize: '13px', fontFamily: 'inherit', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setUploadModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#555' }}>Cancel</button>
              <button
                onClick={handleFulfill}
                disabled={fulfilling}
                style={{ background: '#2D7D4E', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                {fulfilling ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
