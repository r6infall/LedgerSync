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
    if (!file) return alert('Please choose a file to upload.');
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      await api.post('/invoices/upload/gstr2a', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess('Your sales data was successfully uploaded and mapped.');
      e.target.reset();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || 'Failed to sync sales data. Please check your file format.');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
    "Invoice Number,Supplier GSTIN,Buyer GSTIN,Invoice Date,Taxable Amount,GST Amount\n" +
    "INV-001,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-10,100000,18000\n" +
    "INV-002,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-11,50000,10000\n" + 
    "INV-EXTRA,33QWERT9876H2Z7,07LMNOP4321K1Z2,2025-04-13,65000,11700";
    
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
      <h2 style={{ fontSize: '20px', color: '#1A1A1A', marginBottom: '24px' }}>Submit Sales Returns (GSTR-1 Simulation)</h2>
      
      <div style={{ maxWidth: '700px' }}>
        <Card title="Upload Utility" showMockBadge={false}>
           <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>By uploading your sales payload, LedgerSync generates structured backend references mapped to your buyer environments automatically.</p>
           
           <form onSubmit={handleFileUpload}>
              <div style={{ border: '2px dashed #E8E5E0', padding: '32px', textAlign: 'center', borderRadius: '6px', background: '#FAFAF8', marginBottom: '24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>Drop your CSV or Excel file here.</div>
                  <input type="file" name="file" accept=".csv, .xlsx, .xls" style={{ marginTop: '16px', fontSize: '13px' }} required />
              </div>
              
              {uploadError && <div style={{ background: '#FCEAEA', color: '#C0392B', padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px', border: '1px solid #F5C6CB' }}>{uploadError}</div>}
              {uploadSuccess && <div style={{ background: '#E9F5EC', color: '#2D7D4E', padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px', border: '1px solid #C3E6CB' }}>{uploadSuccess} <button type="button" onClick={() => navigate('/seller/invoices')} style={{ background: 'none', border: 'none', color: '#2D7D4E', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px' }}>View mapped rows →</button></div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                 <button disabled={uploadLoading} type="submit" style={{ flex: 1, background: '#1A1A1A', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                   {uploadLoading ? 'Uploading...' : 'Securely Upload'}
                 </button>
                 <button type="button" onClick={downloadSample} style={{ background: '#FFF', color: '#1A1A1A', border: '1px solid #E8E5E0', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                   Download Sample CSV
                 </button>
              </div>
           </form>
        </Card>
      </div>
    </div>
  );
}
