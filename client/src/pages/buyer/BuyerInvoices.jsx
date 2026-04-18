import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices?source=purchase');
      setInvoices(res.data.invoices);
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

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
    "Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount\n" +
    "INV-001,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-10,100000,18000\n" +
    "INV-002,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-11,50000,9000\n" +
    "INV-MISSING,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-12,75000,13500";
    
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
            No purchase invoices found in your localized registry.<br/><br/>
            Use the <strong>Upload Purchase Data</strong> button securely mapped above to natively populate your registry cleanly.
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
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} onClick={() => navigate(`/buyer/invoice/${inv._id}`)} style={{ borderBottom: '1px solid #E8E5E0', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '16px', color: '#555' }}>{inv.sellerGstin}</td>
                    <td style={{ padding: '16px', color: '#555' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: '#555' }}>₹{inv.taxableAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: ['approved', 'matched'].includes(inv.status) ? '#C3E6CB' : ['rejected','mismatch','missing'].includes(inv.status) ? '#FCEAEA' : '#FFF3CD',
                        color: ['approved', 'matched'].includes(inv.status) ? '#2D7D4E' : ['rejected','mismatch','missing'].includes(inv.status) ? '#C0392B' : '#856404'
                      }}>
                        {inv.status.replace('_', ' ')}
                      </span>
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
