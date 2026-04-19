import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        setKpis(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading Seller Dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: '#1A1A1A', margin: 0 }}>Overview Dashboard</h2>
        {kpis && kpis.gstr1DaysLeft > 0 && (
          <span style={{ background: '#FFF3E0', color: '#E65100', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: '1px solid #FFE0B2' }}>
            ⏳ GSTR-1 Deadline in {kpis.gstr1DaysLeft} Days
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
         <Card style={{ padding: '20px' }}>
           <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Total Invoices Uploaded</div>
           <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{kpis?.totalInvoices || 0}</div>
         </Card>
         <Card style={{ padding: '20px' }}>
           <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Total Taxable Value</div>
           <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
             ₹{((kpis?.itcAvailable || 0) / 0.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
           </div>
         </Card>
         <Card style={{ padding: '20px' }}>
           <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Invoice Match Rate</div>
           <div style={{ fontSize: '28px', fontWeight: 700, color: kpis?.complianceScore >= 80 ? '#2D7D4E' : kpis?.complianceScore >= 50 ? '#B8935A' : '#C0392B' }}>
             {kpis?.complianceScore || 0}%
           </div>
         </Card>
         <Card style={{ padding: '20px', background: '#FAFAF8' }}>
           <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Mismatched Rows</div>
           <div style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>
             {kpis?.mismatchCount || 0}
           </div>
         </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card title="Quick Actions">
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Ensure your invoices are uploaded before the GSTR-1 cutoff to avoid penalties.</p>
          <div style={{ display: 'grid', gap: '12px' }}>
            <button onClick={() => navigate('/seller/upload')} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
              <span>📤 Upload Sales Data</span>
              <span>→</span>
            </button>
            <button onClick={() => navigate('/seller/missing-requests')} style={{ background: '#FFF', color: '#1A1A1A', border: '1px solid #E8E5E0', padding: '12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500, textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
              <span>📥 View Missing Requests</span>
              <span>→</span>
            </button>
          </div>
        </Card>

        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Recent Activity
            <button onClick={() => navigate('/seller/notifications')} style={{ background: 'none', border: 'none', color: '#B8935A', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View all</button>
          </div>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!kpis?.recentAlerts || kpis.recentAlerts.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#999', padding: '20px 0', textAlign: 'center' }}>No recent activity</div>
            ) : (
              kpis.recentAlerts.map(alert => (
                 <div key={alert._id} style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid #F5F5F0', alignItems: 'flex-start' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: alert.type === 'danger' || alert.type === 'missing_invoice_request' ? '#C0392B' : alert.type === 'warning' ? '#E65100' : '#3498DB', marginTop: '6px' }} />
                   <div>
                     <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>{alert.title || alert.type.replace(/_/g, ' ')}</div>
                     <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.4' }}>{alert.message}</div>
                   </div>
                 </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
