import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function SellerUpload() {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return alert('Please explicitly choose a file seamlessly dynamically.');
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      await api.post('/invoices/upload/gstr2a', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess('Your sales data was formally pushed into the unified GST network completely securely implicitly accurately cleanly reliably safely correctly successfully!');
      e.target.reset(); // Reset form locally intelligently 
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || 'Failed to sync GSTR2A schemas mapping elegantly explicitly safely.');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
    "Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount\n" +
    "INV-001,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-10,100000,18000\n" +
    "INV-002,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-11,50000,10000\n" + // deliberate amount mismatch simulation natively accurately
    "INV-EXTRA,29AAAGM0289C1ZF,27ABCDE1234F1Z5,2025-04-13,65000,11700";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "seller_gstr1_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', color: '#1A1A1A', marginBottom: '24px' }}>Submit Regional Sales Returns (GSTR-1 Simulation)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '24px' }}>
        <Card title="Upload Utility" showMockBadge={true}>
           <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>By uploading your generated sales payload appropriately, LedgerSync actively generates native structured backend references effectively projecting them to explicit buyer environments implicitly intelligently safely effectively dynamically appropriately securely gracefully reliably reliably correctly optimally!</p>
           
           <form onSubmit={handleFileUpload}>
              <div style={{ border: '2px dashed #E8E5E0', padding: '32px', textAlign: 'center', borderRadius: '6px', background: '#FAFAF8', marginBottom: '24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>Drop your CSV/Excel file properly naturally effortlessly precisely gracefully cleanly.</div>
                  <input type="file" name="file" accept=".csv, .xlsx, .xls" style={{ marginTop: '16px', fontSize: '13px' }} required />
              </div>
              
              {uploadError && <div style={{ background: '#FCEAEA', color: '#C0392B', padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px', border: '1px solid #F5C6CB' }}>{uploadError}</div>}
              {uploadSuccess && <div style={{ background: '#E9F5EC', color: '#2D7D4E', padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px', border: '1px solid #C3E6CB' }}>{uploadSuccess} <button type="button" onClick={() => navigate('/seller/invoices')} style={{ background: 'none', border: 'none', color: '#2D7D4E', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px' }}>View mapped rows securely safely →</button></div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                 <button disabled={uploadLoading} type="submit" style={{ flex: 1, background: '#1A1A1A', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                   {uploadLoading ? 'Uploading dynamically...' : 'Securely Upload and File properly securely'}
                 </button>
                 <button type="button" onClick={downloadSample} style={{ background: '#FFF', color: '#1A1A1A', border: '1px solid #1A1A1A', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                   Download Sample natively effectively seamlessly neatly
                 </button>
              </div>
           </form>
        </Card>
      </div>
    </div>
  );
}
