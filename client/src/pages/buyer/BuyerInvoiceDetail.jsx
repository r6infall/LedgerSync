import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import StatusTimeline from '../../components/ui/StatusTimeline';
import MockRazorpayModal from '../../components/ui/MockRazorpayModal';
import api from '../../services/api';

export default function BuyerInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalType, setModalType] = useState(null); // 'reject' | 'change'
  const [modalText, setModalText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [correctionPlan, setCorrectionPlan] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}/detail`);
      setInvoice(res.data.invoice);
      setHistory(res.data.invoice.statusHistory || []);
      setReconciliation(res.data.reconciliation);
      
      if (res.data.invoice.status === 'mismatch' || res.data.invoice.status === 'missing') {
          api.get(`/ai/analyze-invoice/${id}`).then(aiRes => {
              if (aiRes.data?.analysis) setAiAnalysis(aiRes.data.analysis);
              if (aiRes.data?.correctionPlan) setCorrectionPlan(aiRes.data.correctionPlan);
          }).catch(console.error);
      }
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleApprove = async () => {
    if (!window.confirm(`Approve this invoice? This will unlock ITC of ₹${invoice?.gstAmount?.toLocaleString()}`)) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/approve`);
      await fetchInvoice();
      alert('Invoice Approved successfully!');
    } catch (err) {
      alert('Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const submitModal = async () => {
    if (!modalText) return alert('Please enter reasoning/details.');
    setActionLoading(true);
    try {
      if (modalType === 'reject') {
        await api.post(`/invoices/${id}/reject`, { reason: modalText });
        alert('Invoice Rejected successfully.');
      } else {
        await api.post(`/invoices/${id}/request-change`, { changeRequest: modalText });
        alert('Change requested successfully.');
      }
      setModalType(null);
      setModalText('');
      await fetchInvoice();
    } catch (err) {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaySuccess = async (paymentData) => {
    try {
      await api.post('/payments/mock-confirm', paymentData);
      setTimeout(() => {
        setShowPayModal(false);
        fetchInvoice();
      }, 1500);
    } catch (err) {
      alert('Payment error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading invoice details...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  const gstr2aData = reconciliation?.portalRecord || {};
  const isMismatch = invoice.status === 'mismatch';
  const valDiffers = (field1, field2) => String(field1 || '').trim() !== String(field2 || '').trim();

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#B8935A', cursor: 'pointer', marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>← Back to Invoices</button>
      <h2 style={{ fontSize: '20px', marginBottom: '24px', color: '#1A1A1A' }}>
        Invoice Detail <span style={{fontSize:'14px', color:'#555', fontWeight: 500}}>#{invoice.invoiceNumber}</span>
        <span style={{ marginLeft: '12px', fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', background: invoice.status === 'approved' ? '#C3E6CB' : '#FFF3CD', color: invoice.status === 'approved' ? '#2D7D4E' : '#856404' }}>{invoice.status.replace('_', ' ')}</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
         <div>
           {invoice.status === 'under_review' && (
             <div style={{ background: '#E9F5EC', border: '1px solid #C3E6CB', padding: '16px', borderRadius: '6px', color: '#2D7D4E', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Supplier Resubmitted Corrections</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>The supplier updated the GST data mapping. <strong>Note:</strong> {history.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).find(h => h.status === 'resubmitted')?.note}</p>
             </div>
           )}
           <Card title="Comparative Data Output" showMockBadge={true} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #E8E5E0', borderRadius: '6px', overflow: 'hidden' }}>
                 {/* Left Column: Purchase */}
                 <div style={{ borderRight: '1px solid #E8E5E0' }}>
                    <div style={{ background: '#FAFAF8', padding: '12px 16px', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #E8E5E0' }}>Your purchase record</div>
                    <div style={{ padding: '16px', fontSize: '13px', lineHeight: '2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#555'}}>GSTIN</span> <strong>{invoice.sellerGstin}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#555'}}>Invoice No</span> <strong>{invoice.invoiceNumber}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#555'}}>Date</span> <strong>{new Date(invoice.invoiceDate).toLocaleDateString()}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#555'}}>Taxable</span> <strong>₹{invoice.taxableAmount?.toLocaleString()}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#555'}}>GST</span> <strong>₹{invoice.gstAmount?.toLocaleString()}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E8E5E0', marginTop: '8px', paddingTop: '8px' }}><span style={{color: '#555'}}>Total</span> <strong>₹{invoice.totalAmount?.toLocaleString()}</strong></div>
                    </div>
                 </div>

                 {/* Right Column: Portal */}
                 <div>
                    <div style={{ background: '#F8F9FA', padding: '12px 16px', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #E8E5E0' }}>GSTR-2A record</div>
                    <div style={{ padding: '16px', fontSize: '13px', lineHeight: '2' }}>
                      {!reconciliation?.portalRecord ? (
                        <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '30px' }}>No supplier upload found</div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: valDiffers(invoice.sellerGstin, gstr2aData.sellerGstin) ? '#FCEAEA' : 'transparent', padding: '0 4px' }}><span style={{color: '#555'}}>GSTIN</span> <strong>{gstr2aData.sellerGstin}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: valDiffers(invoice.invoiceNumber, gstr2aData.invoiceNumber) ? '#FCEAEA' : 'transparent', padding: '0 4px' }}><span style={{color: '#555'}}>Invoice No</span> <strong>{gstr2aData.invoiceNumber}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: valDiffers(new Date(invoice.invoiceDate).toLocaleDateString(), new Date(gstr2aData.invoiceDate).toLocaleDateString()) ? '#FCEAEA' : 'transparent', padding: '0 4px' }}><span style={{color: '#555'}}>Date</span> <strong>{new Date(gstr2aData.invoiceDate).toLocaleDateString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: valDiffers(invoice.taxableAmount, gstr2aData.taxableAmount) ? '#FCEAEA' : 'transparent', padding: '0 4px' }}><span style={{color: '#555'}}>Taxable</span> <strong>₹{gstr2aData.taxableAmount?.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: valDiffers(invoice.gstAmount, gstr2aData.gstAmount) ? '#FCEAEA' : 'transparent', padding: '0 4px' }}><span style={{color: '#555'}}>GST</span> <strong>₹{gstr2aData.gstAmount?.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E8E5E0', marginTop: '8px', paddingTop: '8px', background: valDiffers(invoice.totalAmount, gstr2aData.totalAmount) ? '#FCEAEA' : 'transparent', padding: '8px 4px 0' }}><span style={{color: '#555'}}>Total</span> <strong>₹{gstr2aData.totalAmount?.toLocaleString()}</strong></div>
                        </>
                      )}
                    </div>
                 </div>
              </div>
           </Card>

           {isMismatch && (
             <div style={{ marginBottom: '24px' }}>
               <Card title={<div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>AI Discrepancy Analysis <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered (Gemini 1.5 Flash)</span></div>} showMockBadge={false} style={{ marginBottom: '16px', border: '1px solid #E9D5FF', background: '#FAFAFA' }}>
                  {!aiAnalysis ? (
                    <div style={{ color: '#7e22ce', fontSize: '13px', fontStyle: 'italic', padding: '12px' }}>Analyzing mismatches across ledger entries computationally via Gemini API...</div>
                  ) : aiAnalysis.error ? (
                    <div style={{ color: '#C0392B', fontSize: '13px' }}>{aiAnalysis.error}</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px', fontSize: '13px', lineHeight: '1.5' }}>
                       <div style={{display:'flex', gap:'12px'}}><strong style={{color:'#7E22CE', minWidth:'80px'}}>Problem:</strong> <span>{aiAnalysis.problem}</span></div>
                       <div style={{display:'flex', gap:'12px'}}><strong style={{color:'#7E22CE', minWidth:'80px'}}>Cause:</strong> <span>{aiAnalysis.cause}</span></div>
                       <div style={{display:'flex', gap:'12px'}}><strong style={{color:'#EAB308', minWidth:'80px'}}>Impact:</strong> <span>{aiAnalysis.impact}</span></div>
                       <div style={{display:'flex', gap:'12px'}}><strong style={{color:'#2D7D4E', minWidth:'80px'}}>Buyer Fix:</strong> 
                         <ul style={{ margin:0, paddingLeft:'16px' }}>{aiAnalysis.buyerFix?.map((t,i) => <li key={i}>{t}</li>)}</ul>
                       </div>
                       <div style={{display:'flex', gap:'12px'}}><strong style={{color:'#B8935A', minWidth:'80px'}}>Seller Fix:</strong> 
                         <ul style={{ margin:0, paddingLeft:'16px' }}>{aiAnalysis.sellerFix?.map((t,i) => <li key={i}>{t}</li>)}</ul>
                       </div>
                    </div>
                  )}
               </Card>
               {correctionPlan?.length > 0 && (
                 <Card title={<div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>Action Plan <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered (Gemini 1.5 Flash)</span></div>} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                   <ol style={{ margin:0, paddingLeft:'16px', fontSize: '13px', lineHeight: '1.6', color: '#166534' }}>
                     {correctionPlan.map((step, idx) => (
                       <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
                     ))}
                   </ol>
                 </Card>
               )}
             </div>
           )}

           <div style={{ display: 'flex', gap: '12px' }}>
              <button disabled={actionLoading || invoice.status === 'approved'} onClick={handleApprove} style={{ background: '#2D7D4E', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: invoice.status !== 'approved' ? 'pointer' : 'not-allowed', opacity: invoice.status === 'approved' ? 0.6 : 1 }}>
                Approve
              </button>
              <button disabled={actionLoading || invoice.status === 'approved'} onClick={() => setModalType('reject')} style={{ background: '#FFF', color: '#C0392B', border: '1px solid #C0392B', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: invoice.status !== 'approved' ? 'pointer' : 'not-allowed', opacity: invoice.status === 'approved' ? 0.6 : 1 }}>
                Reject
              </button>
              <button disabled={actionLoading || invoice.status === 'approved'} onClick={() => setModalType('change')} style={{ background: '#FFF', color: '#B8935A', border: '1px solid #B8935A', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: invoice.status !== 'approved' ? 'pointer' : 'not-allowed', opacity: invoice.status === 'approved' ? 0.6 : 1 }}>
                Request change
              </button>
              {['matched', 'approved'].includes(invoice.status) && (
                <button onClick={() => setShowPayModal(true)} style={{ background: '#1A1A1A', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  💳 Pay Supplier
                </button>
              )}
              {invoice.status === 'paid' && (
                <span style={{ fontSize: '12px', background: '#C3E6CB', color: '#2D7D4E', padding: '8px 16px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Paid
                  <span style={{ background: '#C0392B', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', marginLeft: '4px' }}>MOCK</span>
                </span>
              )}
           </div>
         </div>

         <Card title="Invoice Status Timeline" showMockBadge={true}>
            <StatusTimeline history={history} />
         </Card>
      </div>

      {/* Action Modal */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>{modalType === 'reject' ? 'Reject Invoice' : 'Request Change'}</h3>
            <textarea 
              autoFocus
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder={modalType === 'reject' ? "Reason for rejection..." : "e.g. Please correct GSTIN from 29AAAGM... to 29AABCD..."}
              maxLength={500}
              style={{ width: '100%', height: '100px', border: '1px solid #E8E5E0', borderRadius: '4px', padding: '12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#555' }}>Cancel</button>
              <button disabled={actionLoading} onClick={submitModal} style={{ background: modalType === 'reject' ? '#C0392B' : '#B8935A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Razorpay */}
      {showPayModal && invoice && (
        <MockRazorpayModal
          invoice={invoice}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
