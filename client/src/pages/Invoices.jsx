import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('purchase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) { setError('Only .xlsx, .xls, .csv files allowed'); return; }
    setFile(f); setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('source', source);
      const res = await api.post('/invoices/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(res.data.count);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Upload Invoices</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports .xlsx, .xls, .csv files up to 10MB</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        {error && <div style={{ background: 'var(--red-bg)', border: '1px solid #F5C6C2', borderRadius: 5, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--red)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <Label>Invoice Source</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['purchase', 'gstr2a'].map(s => (
                <button key={s} type="button" onClick={() => setSource(s)}
                  className={`btn ${source === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                  {s === 'purchase' ? '◧ Purchase Register' : '⇄ GSTR-2A Data'}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            style={{ marginBottom: 16 }}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--text-faint)' }}>↑</div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Drop file here or click to browse</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Excel or CSV with invoice data</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 5, padding: '10px 12px' }}>
            <div className="section-label" style={{ marginBottom: 6 }}>Required columns</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}>
              invoiceNumber · sellerGstin · buyerGstin<br />
              invoiceDate · taxableAmount · gstAmount · totalAmount
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading || !file}>
              {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Uploading…</> : 'Upload Invoices'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [page, statusFilter, sourceFilter]);
  useEffect(() => {
    const t = setTimeout(() => fetchInvoices(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleUploaded = (count) => {
    setShowUpload(false);
    setToast(`${count} invoices uploaded successfully`);
    setTimeout(() => setToast(''), 4000);
    fetchInvoices();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setToast('Invoice deleted');
      setTimeout(() => setToast(''), 3000);
      fetchInvoices();
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: 'var(--green-bg)', border: '1px solid #B8D9C4',
          borderRadius: 6, padding: '10px 16px', fontSize: 12, color: 'var(--green)',
          animation: 'fadeIn 0.2s ease'
        }}>{toast}</div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Invoices</div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Invoice Register</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {total.toLocaleString()} invoices total
          </p>
        </div>
        <Button id="upload-btn" variant="primary" onClick={() => setShowUpload(true)}>
          ↑ Upload File
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          id="invoice-search"
          className="input"
          placeholder="Search invoice number, GSTIN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <select className="input" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['pending','matched','mismatch','missing','accepted','rejected'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="input" style={{ width: 140 }} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          <option value="purchase">Purchase</option>
          <option value="gstr2a">GSTR-2A</option>
        </select>
        {(statusFilter || sourceFilter || search) && (
          <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setSourceFilter(''); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <div className="table-scroll-hint">Scroll horizontally to view more →</div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Seller GSTIN</th>
              <th>Buyer GSTIN</th>
              <th>Date</th>
              <th>Taxable Amt</th>
              <th>GST Amt</th>
              <th>Total</th>
              <th>Source</th>
              <th>Status</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9} className="empty-state">No invoices found. Upload a file to get started.</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv._id}>
                <td><span className="mono">{inv.invoiceNumber}</span></td>
                <td><span className="mono">{inv.sellerGstin}</span></td>
                <td><span className="mono">{inv.buyerGstin}</span></td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{fmt(inv.taxableAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{fmt(inv.gstAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmt(inv.totalAmount)}</td>
                <td><span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{inv.source}</span></td>
                <td><StatusBadge status={inv.status} /></td>
                <td>
                  <button 
                    onClick={(e) => handleDelete(inv._id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 14 }}
                    title="Delete invoice"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="secondary" size="xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <Button variant="secondary" size="xs" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
