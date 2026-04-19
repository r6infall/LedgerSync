import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices?source=purchase');
      setInvoices(res.data.invoices);
      
      // Async fetch anomalies separately so we don't block render
      api.get('/ai/anomalies').then(ans => {
         if(ans.data?.anomalies && Array.isArray(ans.data.anomalies)) {
             setAnomalies(ans.data.anomalies);
         }
      }).catch(console.error);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadLoading(true);
    setUploadError('');
    try {
      await api.post('/invoices/upload/purchase', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Invoices uploaded successfully!');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || 'Failed to upload invoices. Check format.');
    } finally {
      setUploadLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteOne = async (e, id, invNumber) => {
    e.stopPropagation(); // Don't navigate to detail
    if (!window.confirm(`Delete invoice ${invNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete ALL ${invoices.length} purchase invoices? This cannot be undone.`)) return;
    try {
      await api.delete('/invoices/all');
      setInvoices([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clear invoices');
    }
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
    "Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount\n" +
    "INV-001,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-10,100000,18000\n" +
    "INV-002,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-11,50000,9000\n" +
    "INV-003,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-12,75000,13500";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purchase_invoices_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>Purchase Registry</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {invoices.length > 0 && (
            <button onClick={handleDeleteAll} style={{ background: '#FFF', color: '#C0392B', border: '1px solid #C0392B', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
              🗑 Clear All
            </button>
          )}
          <button onClick={downloadSample} style={{ background: '#FFF', color: '#1A1A1A', border: '1px solid #1A1A1A', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
            Download Sample CSV
          </button>
           <div style={{ position: 'relative' }}>
             <input type="file" onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
             <button disabled={uploadLoading} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
               {uploadLoading ? 'Uploading...' : 'Upload Purchase Data'}
             </button>
          </div>
        </div>
      </div>
      
      {anomalies.length > 0 && (
        <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#7E22CE' }}>
           <span><strong>AI Anomaly Detection:</strong> {anomalies.length} unusual pattern(s) found in your purchase register. Hover over the ⚠️ icons in the table for details.</span>
           <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered</span>
        </div>
      )}
      
      {uploadError && (
        <div style={{ background: '#FCEAEA', border: '1px solid #F5C6CB', color: '#C0392B', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px' }}>
          {uploadError}
        </div>
      )}

      <Card showMockBadge={true}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Loading records...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
            No purchase invoices found.<br/><br/>
            Use the <strong>Upload Purchase Data</strong> button above to populate your registry.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', color: '#555', borderBottom: '1px solid #E8E5E0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Invoice Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Supplier GSTIN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Taxable</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const anomaly = anomalies.find(a => a.invoiceId === inv._id);
                  return (
                  <tr key={inv._id} onClick={() => navigate(`/buyer/invoice/${inv._id}`)} style={{ borderBottom: '1px solid #E8E5E0', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 500 }}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        {inv.invoiceNumber}
                        {anomaly && <span title={`AI Warning (${anomaly.anomalyType}): ${anomaly.description}`} style={{fontSize:'14px'}}>{anomaly.severity === 'high' ? '🚨' : '⚠️'}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#555' }}>{inv.sellerGstin}</td>
                    <td style={{ padding: '16px', color: '#555' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: '#555' }}>₹{inv.taxableAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: ['approved', 'matched', 'paid'].includes(inv.status) ? '#C3E6CB' : ['rejected','mismatch','missing'].includes(inv.status) ? '#FCEAEA' : '#FFF3CD',
                        color: ['approved', 'matched', 'paid'].includes(inv.status) ? '#2D7D4E' : ['rejected','mismatch','missing'].includes(inv.status) ? '#C0392B' : '#856404'
                      }}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => handleDeleteOne(e, inv._id, inv.invoiceNumber)}
                        title="Delete invoice"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#C0392B', opacity: 0.5, transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

