import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

function ScoreCircle({ score }) {
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 80 ? '#2D7D4E' : score >= 60 ? '#B8935A' : '#C0392B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#E8E5E0" strokeWidth={stroke} />
        <circle cx="90" cy="90" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
        <text x="90" y="82" textAnchor="middle" fontSize="36" fontWeight="700" fill={color}>{score}</text>
        <text x="90" y="104" textAnchor="middle" fontSize="12" fill="#555">/100</text>
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 600, color, marginTop: '4px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '12px', background: score > 80 ? '#E9F5EC' : score >= 60 ? '#FFF3CD' : '#FCEAEA' }}>
        {score > 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'}
      </span>
    </div>
  );
}

export default function BuyerCompliance() {
  const [scoreData, setScoreData] = useState(null);
  const [supplierRisks, setSupplierRisks] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scoreRes, riskRes, forecastRes] = await Promise.allSettled([
          api.get('/ai/compliance-explanation'),
          api.get('/ai/supplier-risk'),
          api.get('/ai/forecast-itc')
        ]);
        if (scoreRes.status === 'fulfilled' && scoreRes.value.data) setScoreData(scoreRes.value.data);
        if (riskRes.status === 'fulfilled' && riskRes.value.data?.risks) setSupplierRisks(riskRes.value.data.risks);
        if (forecastRes.status === 'fulfilled' && forecastRes.value.data) setForecast(forecastRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Seed-based score breakdown
  const matchedCount = 12, mismatchCount = 4, missingCount = 4, latePayments = 0, riskySuppliers = 1;
  const mismatchPenalty = mismatchCount * 5;
  const missingPenalty = missingCount * 8;
  const latePenalty = latePayments * 3;
  const riskPenalty = riskySuppliers * 4;
  const totalPenalty = mismatchPenalty + missingPenalty + latePenalty + riskPenalty;
  const score = Math.max(0, 100 - totalPenalty - 2);

  // ITC at risk
  const blockedMismatch = 21600;
  const blockedMissing = 32400;
  const penaltyEstimate = Math.round((blockedMismatch + blockedMissing) * 0.18);
  const potentialRecovery = blockedMismatch + blockedMissing;

  const breakdownRows = [
    { factor: `Matched invoices (${matchedCount})`, deduction: '0 points', status: 'Good', statusColor: '#2D7D4E', bg: '#E9F5EC' },
    { factor: `Mismatched invoices (${mismatchCount})`, deduction: `-${mismatchPenalty} points (${mismatchCount}×5)`, status: 'Needs fixing', statusColor: '#B8935A', bg: '#FFF3CD' },
    { factor: `Missing invoices (${missingCount})`, deduction: `-${missingPenalty} points (${missingCount}×8)`, status: 'Critical', statusColor: '#C0392B', bg: '#FCEAEA' },
    { factor: `Late payments (${latePayments})`, deduction: '0 points', status: 'Good', statusColor: '#2D7D4E', bg: '#E9F5EC' },
    { factor: `Risky suppliers (${riskySuppliers})`, deduction: `-${riskPenalty} points (${riskySuppliers}×4)`, status: 'Review needed', statusColor: '#B8935A', bg: '#FFF3CD' },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading compliance data & AI analysis...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '24px', color: '#1A1A1A' }}>Compliance Scorecard</h2>

      {/* Score Circle + AI Explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <ScoreCircle score={score} />
        </Card>

        <Card style={{ border: '1px solid #E9D5FF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#7E22CE' }}>AI Compliance Analysis</strong>
              <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>✨ Gemini 2.5 Flash</span>
            </div>
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: '1px solid #E9D5FF', color: '#7E22CE', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
              {expanded ? '▲ Collapse' : '▼ Expand details'}
            </button>
          </div>
          {!scoreData || scoreData.error ? (
            <p style={{ color: '#555', fontSize: '13px' }}>{scoreData?.error || 'Analysis not available.'}</p>
          ) : (
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}><strong style={{ color: '#7E22CE' }}>Why {score}/100:</strong> {scoreData.SCORE_REASON}</div>
              {expanded && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div style={{ background: '#F0FDF4', padding: '12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      <strong style={{ color: '#166534', display: 'block', marginBottom: '6px', fontSize: '12px' }}>🌟 Quick Wins</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#166534' }}>
                        {scoreData.QUICK_WINS?.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ color: '#334155', display: 'block', marginBottom: '6px', fontSize: '12px' }}>📈 Long-Term</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#334155' }}>
                        {scoreData.LONG_TERM?.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Score Breakdown Table */}
      <Card title="Score Breakdown" style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '2px solid #E8E5E0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Factor</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Deduction</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Your Status</th>
            </tr>
          </thead>
          <tbody>
            {breakdownRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E8E5E0' }}>
                <td style={{ padding: '12px' }}>{r.factor}</td>
                <td style={{ padding: '12px', color: r.deduction === '0 points' ? '#2D7D4E' : '#C0392B', fontWeight: 600 }}>{r.deduction}</td>
                <td style={{ padding: '12px' }}><span style={{ background: r.bg, color: r.statusColor, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{r.status}</span></td>
              </tr>
            ))}
            <tr style={{ background: '#F5F5F0', fontWeight: 700 }}>
              <td style={{ padding: '12px' }}>Final score</td>
              <td style={{ padding: '12px', color: '#C0392B' }}>{totalPenalty} penalty → {score}/100</td>
              <td style={{ padding: '12px' }}><span style={{ background: score >= 60 ? '#FFF3CD' : '#FCEAEA', color: score >= 60 ? '#856404' : '#C0392B', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{score > 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'}</span></td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Supplier Risk Table */}
      <Card title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Supplier Risk Assessment <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>✨ AI-powered</span></div>} style={{ marginBottom: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E8E5E0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Supplier GSTIN</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Match Rate</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Risk Score</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Risk Level</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>AI Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {supplierRisks.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No supplier data available.</td></tr>
              ) : supplierRisks.map((s, i) => {
                const riskScore = s.RISK_SCORE || 0;
                const color = riskScore < 30 ? '#2D7D4E' : riskScore <= 60 ? '#B8935A' : '#C0392B';
                const bg = riskScore < 30 ? '#E9F5EC' : riskScore <= 60 ? '#FDF8E4' : '#FCEAEA';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #E8E5E0' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{s.gstin}</td>
                    <td style={{ padding: '12px' }}>{s.MATCH_RATE || '—'}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color }}>{riskScore}/100</td>
                    <td style={{ padding: '12px' }}><span style={{ background: bg, color, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{s.RISK_LEVEL || '—'}</span></td>
                    <td style={{ padding: '12px', fontStyle: 'italic', maxWidth: '300px', fontSize: '12px' }}>{s.RECOMMENDATION}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ITC at Risk Summary */}
      <Card title="ITC at Risk" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#E65100', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Blocked from Mismatches</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#E65100' }}>₹{blockedMismatch.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: '#FCEAEA', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#C0392B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Blocked from Missing</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#C0392B' }}>₹{blockedMissing.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Penalty Estimate (18%)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#555' }}>₹{penaltyEstimate.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* AI Forecast */}
        {forecast && !forecast.error && (
          <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '14px 16px', borderRadius: '6px', fontSize: '13px', color: '#7E22CE', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>✨ AI Forecast</span>
            <span>If resolved by next filing deadline, <strong>₹{potentialRecovery.toLocaleString('en-IN')}</strong> could be recovered as eligible ITC.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
