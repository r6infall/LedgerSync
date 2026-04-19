import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function SellerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices?source=gstr2a'); // Sellers view their 'gstr2a' source uploads mapping
      setInvoices(res.data.invoices);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

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

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>Filed Sales Returns</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {invoices.length > 0 && (
            <button 
              onClick={handleDeleteAll} 
              style={{ background: 'none', color: '#C0392B', border: '1px solid #F5C6CB', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
            >
              Delete All
            </button>
          )}
          <button onClick={() => navigate('/seller/upload')} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            + Submit Returns
          </button>
        </div>
      </div>

      <Card showMockBadge={true}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Loading dynamically...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
            No sales payloads found dynamically tracked natively.<br/><br/>
            Use the <strong>Submit Returns</strong> interaction neatly effortlessly tracking explicitly accurately seamlessly.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', color: '#555', borderBottom: '1px solid #E8E5E0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Invoice Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Buyer GSTIN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Taxable</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Approval Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} onClick={() => navigate(`/seller/invoice/${inv._id}`)} style={{ borderBottom: '1px solid #E8E5E0', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#FAFAF8'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '16px', color: '#555' }}>{inv.buyerGstin}</td>
                    <td style={{ padding: '16px', color: '#555' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: '#555' }}>₹{inv.taxableAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px', color: '#1A1A1A', fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', fontWeight: 600,
                        background: ['approved', 'matched'].includes(inv.status) ? '#C3E6CB' : ['rejected','mismatch','missing'].includes(inv.status) ? '#FCEAEA' : ['under_review', 'change_requested'].includes(inv.status) ? '#FFF3CD' : '#E8E5E0',
                        color: ['approved', 'matched'].includes(inv.status) ? '#2D7D4E' : ['rejected','mismatch','missing'].includes(inv.status) ? '#C0392B' : ['under_review', 'change_requested'].includes(inv.status) ? '#856404' : '#555'
                      }}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={(e) => handleDelete(inv._id, e)} 
                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}
                      >
                        &times;
                      </button>
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
