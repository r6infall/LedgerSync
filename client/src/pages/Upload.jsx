import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';

// Validation Summary Card
function ValidationSummary({ result }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;

  return (
    <div style={{ background: '#FAFAF8', border: '1px solid #E8E5E0', borderRadius: 5, padding: 12, marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 4 }}>
        {result.totalRows} rows uploaded
      </div>
      <div style={{ fontSize: 11, color: '#2D7D4E', marginBottom: 2 }}>✓ {result.validRows} valid</div>
      <div style={{ fontSize: 11, color: '#C0392B' }}>
        ✗ {result.invalidRows} errors
        {result.invalidRows > 0 && (
          <span 
            onClick={() => setExpanded(!expanded)} 
            style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {expanded ? 'Hide details' : 'Show details'}
          </span>
        )}
      </div>
      {expanded && result.errors?.length > 0 && (
        <div style={{ marginTop: 8, maxHeight: 100, overflowY: 'auto' }}>
          {result.errors.map((err, i) => (
            <div key={i} style={{ fontSize: 10, color: '#C0392B', marginBottom: 2 }}>
              Row {err.row}: {err.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadCard({ title, subtitle, source, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setLoading(true);
    setProgress(10); // Start progress

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 100);

      const res = await api.post(`/invoices/upload/${source}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      clearInterval(interval);
      setProgress(100);
      setResult(res.data);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
      setFile(null);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>{subtitle}</div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{
          border: '1px dashed #D4D0CA', borderRadius: 6, background: '#FAFAF8',
          padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
          position: 'relative', overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = '#B8935A'; e.currentTarget.style.background = '#FEF9F4'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = '#D4D0CA'; e.currentTarget.style.background = '#FAFAF8'; }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>Drop CSV or Excel file here</div>
        <div style={{ fontSize: 11, color: '#BBBBBB' }}>or click to browse</div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".csv,.xlsx,.xls" 
          style={{ display: 'none' }} 
        />
        
        {loading && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: '#B8935A', width: `${progress}%`, transition: 'width 0.2s ease' }} />
        )}
      </div>

      {file && !loading && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <span style={{ background: '#F0EDE8', color: '#888', fontSize: 10, padding: '3px 10px', borderRadius: 20 }}>
            {file.name}
          </span>
        </div>
      )}

      <ValidationSummary result={result} />
    </div>
  );
}

function FetchCard({ title, subtitle, onFetchSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    setResult(null);

    const start = Date.now();
    try {
      const res = await api.get('/gstr2a/mock');
      const elapsed = Date.now() - start;
      const remaining = 2000 - elapsed;
      if (remaining > 0) {
        await new Promise(r => setTimeout(r, remaining));
      }
      setResult(res.data);
      if (onFetchSuccess) onFetchSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>{subtitle}</div>

      <div style={{
          border: '1px solid #E8E5E0', borderRadius: 6, background: '#FAFAF8',
          padding: '32px 20px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
        <Button 
          onClick={handleFetch} 
          disabled={loading}
          style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
        >
          {loading ? 'Fetching Mock Data...' : 'Fetch from Portal (Mock Data)'}
        </Button>
        <div style={{ fontSize: 10, color: '#BBBBBB' }}>Fetches 20 mock invoices for demo (Connects to live GST Portal API in production)</div>
      </div>

      <ValidationSummary result={result} />
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const [purchaseUploaded, setPurchaseUploaded] = useState(false);
  const [gstr2aUploaded, setGstr2aUploaded] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all your uploaded invoices?')) return;
    setClearing(true);
    try {
      await api.delete('/invoices/all');
      alert('All invoices cleared successfully');
      setPurchaseUploaded(false);
      setGstr2aUploaded(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  const bothUploaded = purchaseUploaded && gstr2aUploaded;

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Upload Invoices</h1>
          <div style={{ fontSize: 12, color: '#999' }}>Upload your purchase register and GSTR-2A data to begin reconciliation</div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleClear} disabled={clearing}>
          {clearing ? 'Clearing...' : 'Clear All Data'}
        </Button>
      </div>

      <div className="upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <UploadCard 
          title="Purchase Register" 
          subtitle="Your accounting books data (Use sample_purchase.csv for Demo)" 
          source="purchase"
          onUploadSuccess={() => setPurchaseUploaded(true)}
        />
        <FetchCard 
          title="GSTR-2A/2B" 
          subtitle="Government portal data (Fetches Mock Data for Demo)" 
          onFetchSuccess={() => setGstr2aUploaded(true)}
        />
      </div>

      <div style={{ fontSize: 10, color: '#BBBBBB', marginTop: 16, textAlign: 'center' }}>
        Expected columns: Supplier GSTIN · Invoice Number · Invoice Date · Taxable Amount · GST Amount · HSN Code
      </div>

      <button 
        onClick={() => navigate('/reconciliation')}
        disabled={!bothUploaded}
        style={{
          width: '100%', background: '#1A1A1A', color: '#FFFFFF', borderRadius: 5, padding: 12,
          fontSize: 13, fontWeight: 500, marginTop: 20, border: 'none',
          cursor: bothUploaded ? 'pointer' : 'not-allowed',
          opacity: bothUploaded ? 1 : 0.4,
          transition: 'opacity 0.2s'
        }}
      >
        Run Reconciliation
      </button>
    </div>
  );
}
