import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerDashboard() {
  const [forecast, setForecast] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [forecastRes, onboardRes] = await Promise.all([
          api.get('/ai/forecast-itc'),
          api.get('/ai/onboarding-guide')
        ]);
        if(forecastRes.data) setForecast(forecastRes.data);
        if(onboardRes.data?.steps) setOnboarding(onboardRes.data.steps);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading Dashboard Intelligence...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '24px', color: '#1A1A1A' }}>Overview Dashboard</h2>

      {showOnboarding && onboarding && onboarding.length > 0 && (
        <Card title={<div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>Quick Start Guide <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered (Gemini 1.5 Flash)</span></div>} style={{ marginBottom: '24px', border: '1px solid #E8E5E0' }}>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>Let's get you set up with your first reconciliation cycle smoothly.</p>
          <div style={{ display: 'grid', gap: '16px' }}>
             {onboarding.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                   <div style={{ background: '#F8F9FA', color: '#1A1A1A', fontWeight: 600, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D1D5DB' }}>{i + 1}</div>
                   <div style={{ flex: 1 }}>
                     <strong style={{ fontSize: '14px', color: '#1A1A1A', display: 'block' }}>{step.STEP_TITLE} <span style={{fontSize:'12px', color:'#999', fontWeight: 400, marginLeft: '8px'}}>({step.ESTIMATED_TIME})</span></strong>
                     <span style={{ fontSize: '13px', color: '#555' }}>{step.STEP_DESCRIPTION}</span>
                   </div>
                </div>
             ))}
          </div>
          <button onClick={() => setShowOnboarding(false)} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', marginTop: '24px', cursor: 'pointer', fontWeight: 600 }}>Mark Complete</button>
        </Card>
      )}

      <Card title={<div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>ITC Forecast Projection <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered Forecast</span></div>}>
        {!forecast || forecast.error ? (
           <p style={{ color: '#555' }}>Forecast unavailable without existing data.</p>
        ) : (
           <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '48px', color: '#2D7D4E', fontWeight: 'bold', marginBottom: '8px' }}>
                {forecast.FORECASTED_ITC} 
                <span style={{ fontSize: '24px', marginLeft: '12px' }}>↑</span>
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>Projected ITC unlock next cycle with <strong>{forecast.CONFIDENCE}</strong> confidence.</div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                 <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '8px', flex: 1, border: '1px solid #E8E5E0' }}>
                   <strong style={{ fontSize: '13px', color: '#1A1A1A', display: 'block', marginBottom: '4px' }}>Key Assumption</strong>
                   <span style={{ fontSize: '13px', color: '#555' }}>{forecast.KEY_ASSUMPTION}</span>
                 </div>
                 <div style={{ background: '#FCEAEA', padding: '16px', borderRadius: '8px', flex: 1, border: '1px solid #F5C6CB' }}>
                   <strong style={{ fontSize: '13px', color: '#1A1A1A', display: 'block', marginBottom: '4px' }}>Primary Risk Factor</strong>
                   <span style={{ fontSize: '13px', color: '#C0392B' }}>{forecast.RISK_FACTOR}</span>
                 </div>
              </div>
           </div>
        )}
      </Card>
    </div>
  );
}
