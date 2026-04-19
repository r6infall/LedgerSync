import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import StatusTimeline from '../../components/ui/StatusTimeline';
import api from '../../services/api';

export default function SellerInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [resubmitText, setResubmitText] = useState('');
  
  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.invoice);
      setHistory(res.data.invoice.statusHistory || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitText) return alert('Please enter note regarding corrections.');
    setActionLoading(true);
    try {
      // simulate file upload implicitly via Note submission
      await api.post(`/invoices/${id}/resubmit`, { note: resubmitText, correctedFileUrl: 'mock_uploaded_file.pdf' });
      alert('Invoice resubmitted to buyer for review!');
      setResubmitText('');
      await fetchInvoice();
    } catch (err) {
      alert('Resubmission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/invoices/${id}`);
      navigate('/seller/invoices');
    } catch (err) {
      alert('Failed to delete invoice');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading invoice details...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  const isRejected = invoice.status === 'rejected';
  const isChangeRequested = invoice.status === 'change_requested';
  
  // Find latest rejection or change note explicitly from history
  const activeNotice = [...history].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .find(h => h.status === invoice.status)?.note || '';

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#B8935A', cursor: 'pointer', marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>← Back to Invoices</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>
          Invoice Detail <span style={{fontSize:'14px', color:'#555', fontWeight: 500}}>#{invoice.invoiceNumber}</span>
        </h2>
        <button 
          disabled={actionLoading} 
          onClick={handleDelete} 
          style={{ background: 'none', color: '#C0392B', border: '1px solid #F5C6CB', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          Delete Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
         <div>
            <Card title="GSTR-2A Record (Your Submission)" showMockBadge={true} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8E5E0' }}>📄</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{invoice.invoiceNumber}.pdf</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>Processed strictly via simulated backend parsers</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '6px 12px', borderRadius: '4px', background: isRejected ? '#FCEAEA' : isChangeRequested ? '#FFF3CD' : invoice.status === 'approved' ? '#C3E6CB' : '#F8F9FA', color: isRejected ? '#C0392B' : isChangeRequested ? '#856404' : invoice.status === 'approved' ? '#2D7D4E' : '#6C757D', fontWeight: 600 }}>{invoice.status.replace('_', ' ')}</span>
                </div>

                <div style={{ background: '#FAFAF8', border: '1px solid #E8E5E0', borderRadius: '6px', padding: '16px', fontSize: '13px', lineHeight: '2', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div><span style={{color: '#555'}}>Buyer GSTIN:</span> <strong>{invoice.buyerGstin}</strong></div>
                    <div><span style={{color: '#555'}}>Date:</span> <strong>{new Date(invoice.invoiceDate).toLocaleDateString()}</strong></div>
                    <div><span style={{color: '#555'}}>Taxable:</span> <strong>₹{invoice.taxableAmount?.toLocaleString()}</strong></div>
                    <div><span style={{color: '#555'}}>GST:</span> <strong>₹{invoice.gstAmount?.toLocaleString()}</strong></div>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #E8E5E0', marginTop: '8px', paddingTop: '8px' }}><span style={{color: '#555'}}>Total:</span> <strong>₹{invoice.totalAmount?.toLocaleString()}</strong></div>
                </div>
            </Card>

            {isRejected && (
              <div style={{ background: '#FCEAEA', border: '1px solid #F5C6CB', padding: '16px', borderRadius: '6px', color: '#C0392B', marginBottom: '24px' }}>
                 <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Invoice Rejected by Buyer</h4>
                 <p style={{ margin: 0, fontSize: '13px' }}>{activeNotice}</p>
              </div>
            )}

            {isChangeRequested && (
              <div style={{ background: '#FFF3CD', border: '1px solid #FFEAA7', padding: '16px', borderRadius: '6px', color: '#856404', marginBottom: '24px' }}>
                 <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Change Requested by Buyer</h4>
                 <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{activeNotice}</p>
              </div>
            )}

            {(isRejected || isChangeRequested) && (
              <Card title="Upload Corrected Invoice" showMockBadge={false}>
                 <form onSubmit={handleResubmit}>
                   <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 500 }}>Select File (CSV/PDF)</label>
                      <input type="file" required style={{ width: '100%', fontSize: '13px', padding: '8px', border: '1px dashed #E8E5E0', borderRadius: '4px', background: '#FAFAF8' }} />
                   </div>
                   <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 500 }}>Correction Notes</label>
                      <textarea 
                        required value={resubmitText} onChange={e => setResubmitText(e.target.value)}
                        placeholder="Detail the corrections made per the buyer's request..."
                        style={{ width: '100%', height: '80px', padding: '12px', fontSize: '13px', border: '1px solid #E8E5E0', borderRadius: '4px', resize: 'none', outline: 'none' }}
                      />
                   </div>
                   <button disabled={actionLoading} type="submit" style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                     {actionLoading ? 'Uploading...' : 'Upload Corrected Invoice & Resubmit'}
                   </button>
                 </form>
              </Card>
            )}
         </div>

         <Card title="Approval Timeline" showMockBadge={true}>
            <StatusTimeline history={history} />
         </Card>
      </div>
    </div>
  );
}
