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

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>Filed Sales Returns</h2>
        <button onClick={() => navigate('/seller/upload')} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
          + Submit Returns
        </button>
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
