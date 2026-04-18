import { useState, useEffect } from 'react';
import api from '../services/api';
import Label from '../components/ui/Label';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function InsightCard({ title, items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 2, alignSelf: 'stretch', borderRadius: 1, background: accent, flexShrink: 0 }} />
        <div className="section-label" style={{ marginBottom: 0 }}>{title}</div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border-light)' : 'none'
          }}>
            <span style={{ color: accent, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(null);

  useEffect(() => {
    api.get('/compliance/score').then(r => setScore(r.data.score)).catch(() => {});
    // Auto-load on mount
    loadInsights('Provide a general GST compliance health check.');
  }, []);

  const loadInsights = async (q) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/insights', { context: q });
      setInsights(res.data.insights);
      setHistory(prev => [{ q, insights: res.data.insights, time: new Date() }, ...prev].slice(0, 5));
    } catch (err) {
      setInsights({
        healthAssessment: 'Unable to connect to AI service. Please check your Gemini API key configuration.',
        recommendations: [],
        riskSteps: []
      });
    } finally { setLoading(false); }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    await loadInsights(q);
  };

  const suggestions = [
    'Why are my invoices mismatching?',
    'How can I maximize my ITC claims?',
    'What are the risks of missing invoices?',
    'How to improve my compliance score?',
    'Explain GSTR-2A reconciliation process',
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 4 }}>AI Assistant</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>AI Insights</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Powered by Gemini 1.5-flash — ask anything about your GST compliance
        </p>
      </div>

      <div className="ai-insights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Main content */}
        <div>
          {/* Ask a question */}
          <Card style={{ marginBottom: 16 }}>
            <Label>Ask a Question</Label>
            <form onSubmit={handleAsk} style={{ display: 'flex', gap: 8 }}>
              <input
                id="ai-question-input"
                className="input"
                placeholder="e.g. Why do I have so many mismatches this month?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button id="ai-ask-btn" type="submit" variant="primary" disabled={loading || !question.trim()}>
                {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Thinking…</> : '✦ Ask'}
              </Button>
            </form>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {suggestions.map((s, i) => (
                <button key={i}
                  onClick={() => { setQuestion(s); loadInsights(s); }}
                  disabled={loading}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '3px 10px', fontSize: 10,
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'border-color 0.1s ease'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Results */}
          {loading ? (
            <Card style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analysing your GST data…</div>
            </Card>
          ) : insights ? (
            <div className="fade-in">
              {/* Health assessment */}
              <Card style={{ marginBottom: 12, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 20, color: 'var(--accent)', flexShrink: 0 }}>✦</div>
                  <div>
                    <div className="section-label" style={{ marginBottom: 6 }}>Health Assessment</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {insights.healthAssessment}
                    </p>
                  </div>
                </div>
              </Card>

              <InsightCard
                title="Recommendations"
                items={insights.recommendations}
                accent="var(--green)"
              />
              <InsightCard
                title="Risk Mitigation Steps"
                items={insights.riskSteps}
                accent="var(--red)"
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div>
          {/* Score summary */}
          {score && (
            <Card style={{ marginBottom: 14 }}>
              <Label>Current Status</Label>
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: score.riskLevel === 'low' ? 'var(--green)' : score.riskLevel === 'high' ? 'var(--red)' : 'var(--amber)' }}>
                  {score.score}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>compliance score</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge badge-${score.riskLevel}`}>{score.riskLevel} risk</span>
                </div>
              </div>
              <hr className="divider" />
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mismatches</span>
                  <span style={{ color: 'var(--red)', fontWeight: 500 }}>{score.mismatches}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pending</span>
                  <span style={{ fontWeight: 500 }}>{score.pendingInvoices}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ITC at Risk</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 500 }}>
                    ₹{Number(score.itcAtRisk || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* History */}
          {history.length > 1 && (
            <Card>
              <Label>Recent Questions</Label>
              {history.slice(1).map((h, i) => (
                <div key={i}
                  onClick={() => setInsights(h.insights)}
                  style={{
                    padding: '7px 0', borderBottom: i < history.length - 2 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer'
                  }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, lineHeight: 1.4 }}>
                    {h.q.length > 60 ? h.q.slice(0, 60) + '…' : h.q}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>
                    {h.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
