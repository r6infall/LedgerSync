import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 20;

  const [filters, setFilters] = useState({
    status: '',
    gstin: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.gstin) params.gstin = filters.gstin;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await api.get('/invoices', { params });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]); // Re-fetch on page change. For filters, wait for Apply button.

  const handleApply = () => {
    if (page === 1) fetchInvoices();
    else setPage(1);
  };

  const handleReset = () => {
    setFilters({ status: '', gstin: '', dateFrom: '', dateTo: '' });
    if (page === 1) {
      setTimeout(() => fetchInvoices(), 0);
    } else {
      setPage(1);
    }
  };

  const SkeletonTable = () => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#FAFAF8', borderBottom: '1px solid #E8E5E0' }}>
        <div className="skeleton skeleton-text" style={{ width: 80 }} />
      </div>
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '11px 16px', borderBottom: '1px solid #F5F2EE', alignItems: 'center' }}>
          <div className="skeleton skeleton-text" style={{ width: '14%' }} />
          <div className="skeleton skeleton-text" style={{ width: '22%' }} />
          <div className="skeleton skeleton-text" style={{ width: '18%' }} />
          <div className="skeleton skeleton-text" style={{ width: '12%' }} />
          <div className="skeleton skeleton-text" style={{ width: '12%' }} />
          <div className="skeleton" style={{ width: 56, height: 18, borderRadius: 20 }} />
        </div>
      ))}
    </div>
  );

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL invoices? This action cannot be undone.')) return;
    try {
      await api.delete('/invoices/all');
      fetchInvoices();
    } catch (err) {
      alert('Failed to delete all invoices');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const showingStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, total);

  return (
    <div className="fade-in" style={{ padding: 24, background: '#FAFAF8', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>Invoice Ledger</h1>
          <div style={{ fontSize: 12, color: '#999' }}>All invoices for this filing period</div>
        </div>
        {invoices.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleDeleteAll} style={{ color: '#C0392B', borderColor: '#F5C6CB' }}>
            Delete All
          </Button>
        )}
      </div>

      <div style={{
        background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 6,
        padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <select 
          value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
          style={{ fontSize: 11, border: '1px solid #E8E5E0', borderRadius: 5, padding: '6px 10px', background: '#FAFAF8', color: '#555', outline: 'none' }}
        >
          <option value="">All Statuses</option>
          <option value="matched">Matched</option>
          <option value="mismatch">Mismatch</option>
          <option value="missing">Missing</option>
          <option value="pending">Pending</option>
        </select>

        <input 
          placeholder="Search GSTIN..." 
          value={filters.gstin} onChange={e => setFilters({ ...filters, gstin: e.target.value })}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, border: '1px solid #E8E5E0', borderRadius: 5, padding: '6px 10px', background: '#FAFAF8', color: '#555', outline: 'none', minWidth: 150 }}
        />

        <input 
          type="date" 
          value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          style={{ fontSize: 11, border: '1px solid #E8E5E0', borderRadius: 5, padding: '5px 10px', background: '#FAFAF8', color: '#555', outline: 'none' }}
        />
        <span style={{ fontSize: 11, color: '#999' }}>to</span>
        <input 
          type="date" 
          value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          style={{ fontSize: 11, border: '1px solid #E8E5E0', borderRadius: 5, padding: '5px 10px', background: '#FAFAF8', color: '#555', outline: 'none' }}
        />

        <Button variant="secondary" size="sm" onClick={handleApply}>Apply</Button>
        <span onClick={handleReset} style={{ fontSize: 11, color: '#BBBBBB', cursor: 'pointer', marginLeft: 4 }}>Reset</span>
      </div>

      <div className="table-scroll-hint">Scroll horizontally to view more →</div>
      {loading ? <SkeletonTable /> : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier GSTIN</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Taxable Amount</th>
              <th>GST Amount</th>
              <th>Status</th>
              <th>Action</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: 11 }}>No invoices found</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv._id}>
                <td><span className="mono">{inv.sellerGstin}</span></td>
                <td><span className="mono">{inv.invoiceNumber}</span></td>
                <td style={{ fontSize: 11, color: '#999' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmt(inv.taxableAmount)}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500 }}>{fmt(inv.gstAmount)}</td>
                <td><StatusBadge status={inv.status} /></td>
                <td>
                  <span 
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    style={{ fontSize: 10, color: '#B8935A', fontWeight: 500, cursor: 'pointer' }}
                  >
                    View
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={(e) => handleDelete(inv._id, e)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14 }}>&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {!loading && total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#999' }}>Showing {showingStart}–{showingEnd} of {total} invoices</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 4, padding: '4px 12px',
                fontSize: 11, color: '#555', cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.4 : 1
              }}
            >
              Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages || pages === 0}
              style={{
                background: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 4, padding: '4px 12px',
                fontSize: 11, color: '#555', cursor: (page === pages || pages === 0) ? 'not-allowed' : 'pointer',
                opacity: (page === pages || pages === 0) ? 0.4 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
