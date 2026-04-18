import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import StatusBadge from '../components/ui/StatusBadge';
import Bar from '../components/ui/Bar';
import NotificationRow from '../components/ui/NotificationRow';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

function ScoreRing({ score, riskLevel }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = riskLevel === 'low' ? '#2D7D4E' : riskLevel === 'high' ? '#C0392B' : '#B8935A';

  return (
    <div className="score-ring-wrap" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F0EDE8" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>/ 100</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/compliance/score').catch(() => ({ data: { score: null } })),
      api.get('/reconciliation/summary').catch(() => ({ data: {} })),
      api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
    ]).then(([scoreRes, summaryRes, notifRes]) => {
      setScore(scoreRes.data.score);
      setSummary(summaryRes.data);
      setNotifications(notifRes.data.notifications?.slice(0, 6) || []);
    }).finally(() => setLoading(false));
  }, []);

  const itcAvail = score?.itcAvailable || 0;
  const itcClaimed = score?.itcClaimed || 0;
  const itcAtRisk = score?.itcAtRisk || 0;
  const itcTotal = itcAvail + itcAtRisk || 1;

  const stats = [
    { label: 'Total Invoices',   value: summary?.totalInvoices || 0 },
    { label: 'Matched',          value: summary?.matchCounts?.matched || 0,   color: 'var(--green)' },
    { label: 'Mismatches',       value: summary?.matchCounts?.mismatch || 0,  color: 'var(--red)' },
    { label: 'Missing',          value: summary?.matchCounts?.missing || 0,   color: 'var(--amber)' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 20, height: 20 }} />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>Overview</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <Label>Quick Stats</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <div className="stat-value" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Compliance Score */}
        <Card>
          <Label>Compliance Score</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ScoreRing score={score?.score || 0} riskLevel={score?.riskLevel || 'medium'} />
            <div>
              <div style={{ marginBottom: 8 }}>
                <div className="stat-label">Risk Level</div>
                <StatusBadge status={score?.riskLevel || 'medium'} label={score?.riskLevel || 'Medium'} />
              </div>
              <div>
                <div className="stat-label">Mismatches</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)' }}>{score?.mismatches || 0}</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/reconciliation')} style={{ width: '100%', justifyContent: 'center' }}>
              View Reconciliation →
            </Button>
          </div>
        </Card>

        {/* ITC Summary */}
        <Card>
          <Label>ITC Summary</Label>
          <div style={{ marginBottom: 6 }}>
            <Bar label="Available ITC" value={itcAvail} max={itcTotal} colorClass="bar-fill-green" />
            <Bar label="ITC Claimed"   value={itcClaimed} max={itcTotal} colorClass="bar-fill-amber" />
            <Bar label="ITC at Risk"   value={itcAtRisk}  max={itcTotal} colorClass="bar-fill-red" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/payments')} style={{ width: '100%', justifyContent: 'center' }}>
              Unlock ITC →
            </Button>
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Label style={{ marginBottom: 0 }}>Recent Activity</Label>
            <button onClick={() => navigate('/notifications')} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>No recent activity</div>
          ) : notifications.map(n => <NotificationRow key={n._id} notification={n} />)}
        </Card>
      </div>

      {/* Actions */}
      <Label>Quick Actions</Label>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" onClick={() => navigate('/invoices')}>
          ◧ Upload Invoices
        </Button>
        <Button variant="secondary" onClick={() => navigate('/reconciliation')}>
          ⇄ Run Reconciliation
        </Button>
        <Button variant="amber" onClick={() => navigate('/ai-insights')}>
          ✦ Get AI Insights
        </Button>
      </div>
    </div>
  );
}
