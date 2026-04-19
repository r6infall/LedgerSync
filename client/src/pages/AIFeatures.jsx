import React, { useState } from 'react';
import Card from '../components/ui/Card';
import api from '../services/api';

const FEATURES = [
  {
    num: '01',
    name: 'Mismatch explanation',
    tagline: 'Tells you exactly what went wrong and why',
    problem: 'GST mismatch reports are just raw tables of differences. They don\'t tell you whether it was a typo, a missing invoice, or a tax rate error, leaving you guessing on how to fix it.',
    howItWorks: 'The AI compares your purchase invoice against the supplier\'s GSTR-2A record. It analyzes the specific fields that differ (like base amount vs GST amount) and deduces the human error that caused it.',
    apiRoute: '/ai/analyze-invoice/mock',
    sampleOutput: `PROBLEM: Your purchase record shows ₹1,18,000 but Sharma Textiles filed ₹1,00,000 with the government.
CAUSE: GST was calculated on the wrong base amount — supplier used ₹1,00,000 as the taxable value instead of ₹1,18,000.
IMPACT: ₹18,000 ITC blocked. If unresolved by 20th April, 18% interest applies (₹3,240).
FIX FOR BUYER: Contact Sharma Textiles, request GSTR-1 amendment for March.
FIX FOR SELLER: File GSTR-1A amendment, correct invoice amount to ₹1,18,000.`
  },
  {
    num: '02',
    name: 'Correction suggester',
    tagline: 'Gives you a numbered action plan to fix each issue',
    problem: 'Knowing there is a mismatch doesn\'t solve it. Accountants spend hours drafting emails and tracking down suppliers to figure out the exact amendment process.',
    howItWorks: 'Based on the root cause analysis, the AI generates a step-by-step checklist tailored for both the buyer and the seller, specifying the exact GST portal forms (like GSTR-1A) needed to rectify the issue.',
    apiRoute: '/ai/analyze-invoice/mock', // Shares endpoint
    sampleOutput: `1. Notify Supplier: Send automated email to Sharma Textiles regarding Invoice INV-2025-012.
2. Portal Action (Supplier): Login to GST Portal > Returns > GSTR-1A.
3. Amendment: Select March 2025 period, locate original B2B invoice, update taxable value to ₹1,18,000.
4. Portal Action (Buyer): Accept amended invoice in GSTR-2B before 20th April.
5. Claim: Claim additional ₹18,000 ITC in Table 4 of GSTR-3B.`
  },
  {
    num: '03',
    name: 'Supplier risk scorer',
    tagline: 'Rates each supplier\'s reliability based on their filing history',
    problem: 'You don\'t know which suppliers are chronically late or error-prone until they cost you thousands in blocked ITC.',
    howItWorks: 'The AI evaluates a supplier\'s historical behavior on the platform—tracking late filings, mismatch percentages, and missing invoices—and synthesizes these into a 0-100 risk score with business recommendations.',
    apiRoute: '/ai/supplier-risk',
    sampleOutput: `RISK_SCORE: 72/100 | RISK_LEVEL: High
TOP_REASONS: 
1) Filed GSTR-1 late 3 times in last 6 months 
2) 40% of invoices have amount mismatches 
3) Two invoices missing from GSTR-2A
RECOMMENDATION: Put Sharma Textiles on payment hold until they achieve 3 consecutive clean filings.`
  },
  {
    num: '04',
    name: 'Context-aware chat',
    tagline: 'Answers your GST questions using your actual data',
    problem: 'Generic AI chatbots don\'t know your books. When you ask "how much ITC am I losing?", they can\'t answer because they lack your specific invoice context.',
    howItWorks: 'We inject your live dashboard metrics (matched counts, blocked ITC, impending deadlines) into the Gemini prompt as system context before you even type your question, allowing it to give hyper-personalized answers.',
    apiRoute: '/ai/chat',
    method: 'POST',
    payload: { message: 'What are my top priorities before the deadline?' },
    sampleOutput: `Based on your current dashboard, you have 4 unresolved mismatches worth ₹86,400 in ITC.
With the GSTR-1 deadline only 6 days away, your top priority is to follow up with Sharma Textiles and Delhi Weaves. I have already drafted reminder emails for both. Shall I send them?`
  },
  {
    num: '05',
    name: 'GSTR summary writer',
    tagline: 'Summarizes your return readiness in plain English',
    problem: 'Interpreting the raw Table 4 (Eligible ITC) data is complex. Business owners need a quick executive summary, not a spreadsheet.',
    howItWorks: 'The AI looks at your overall match rate, calculates the financial impact of unresolved discrepancies, and crafts a three-paragraph executive summary detailing readiness, risks, and next steps.',
    apiRoute: '/ai/gstr-summary',
    sampleOutput: `Your GSTR-3B preparation is on track with a 74% compliance score, yielding ₹54,000 in clean ITC ready to claim.

However, ₹54,000 remains blocked due to 8 disputed or missing invoices. Sharma Textiles is the primary bottleneck, holding up ₹21,600 of that value.

Action Plan: Prioritize resolving the 4 missing invoices with high-risk suppliers. If unresolved, your cash payout for tax liability will increase by ₹54,000 this month.`
  },
  {
    num: '06',
    name: 'Smart reminder generator',
    tagline: 'Sends you personalized daily reminders with rupee stakes',
    problem: 'Standard system notifications ("You have pending items") are easily ignored. They lack the urgency of real financial impact.',
    howItWorks: 'A daily cron job passes your pending items and their associated blocked ITC values to Gemini, asking it to write a short, urgent, WhatsApp-style motivational reminder highlighting exactly what you stand to lose.',
    apiRoute: '/ai/trigger-reminders',
    sampleOutput: `Mohit, you have 4 mismatches with Sharma Textiles and Delhi Weaves worth ₹86,400 in blocked ITC. 
The filing deadline is in 6 days. Resolve these now to avoid an 18% interest penalty next month. Click here to review them.`
  },
  {
    num: '07',
    name: 'Anomaly detector',
    tagline: 'Flags duplicate invoices, round numbers, and suspicious patterns',
    problem: 'Manual auditing cannot catch subtle fraud or data entry errors, like an invoice submitted twice with slightly different numbers, or suspiciously perfectly round estimates.',
    howItWorks: 'The AI scans the entire JSON array of your recent invoices, analyzing them holistically to spot patterns humans miss—flagging future dates, exact duplicates, and unusual supplier billing spikes.',
    apiRoute: '/ai/anomalies',
    sampleOutput: `[
  {
    "invoiceId": "INV-2025-012",
    "anomalyType": "Potential Duplicate",
    "severity": "high",
    "description": "INV-2025-012 and INV-2025-019 have identical amounts (₹50,000) from the same supplier on consecutive days."
  },
  {
    "invoiceId": "EST-001",
    "anomalyType": "Suspicious Amount",
    "severity": "medium",
    "description": "Invoice amount is exactly ₹1,00,000. Round numbers often indicate estimates submitted instead of final tax invoices."
  }
]`
  },
  {
    num: '08',
    name: 'Compliance score explainer',
    tagline: 'Breaks down why your score is what it is and how to improve it',
    problem: 'A score of "74/100" means nothing without context. Users need to know exactly what actions will increase their score and by how much.',
    howItWorks: 'The AI analyzes the mathematical breakdown of your penalties (e.g., -20 for missing invoices, -4 for late payments) and translates it into short "Quick Wins" and "Long-Term" strategic advice.',
    apiRoute: '/ai/compliance-explanation',
    sampleOutput: `SCORE REASON: Your score is 74 due to heavy penalties from 4 missing invoices (-32 pts) and 4 mismatches (-20 pts).

QUICK WINS:
- Upload the 4 missing invoices from XYZ Corp immediately (+32 pts).

LONG-TERM IMPROVEMENTS:
- Mandate that all suppliers file GSTR-1 by the 10th of the month.
- Transition away from High-Risk suppliers like Sharma Textiles to improve overall match velocity.`
  },
  {
    num: '09',
    name: 'ITC forecaster',
    tagline: 'Predicts next month\'s ITC based on supplier behavior patterns',
    problem: 'Companies struggle to manage cash flow because they don\'t know how much ITC they will actually be able to claim next month versus what will be blocked by late suppliers.',
    howItWorks: 'Gemini evaluates your historical ITC realization rates alongside the current risk profiles of your active suppliers to predict a realistic range of ITC recovery, identifying the key assumption preventing a 100% claim.',
    apiRoute: '/ai/forecast-itc',
    sampleOutput: `FORECASTED_ITC: ₹1,20,000–₹1,45,000
CONFIDENCE: 68%
KEY_ASSUMPTION: Sharma Textiles resolves current mismatch before 20th April.
RISK_FACTOR: If Sharma Textiles files late again, your eligible ITC drops to ₹85,000, requiring a higher cash payout for your tax liability.`
  },
  {
    num: '10',
    name: 'Onboarding guide',
    tagline: 'Walks new users through their first reconciliation step by step',
    problem: 'Complex enterprise software has a high barrier to entry. Users often abandon the platform if they don\'t know what to do first.',
    howItWorks: 'The AI generates a personalized 5-step interactive checklist using the user\'s business name, role, and GSTIN, providing customized time estimates and context for each required setup action.',
    apiRoute: '/ai/onboarding-guide',
    sampleOutput: `[
  {
    "title": "Verify Company & GSTIN Details",
    "time": "2 mins",
    "description": "Confirm your business information, including GSTIN 27ABCDE1234F1Z5, for accurate compliance."
  },
  {
    "title": "Authorize GST Portal Access",
    "time": "3 mins",
    "description": "Link your GST portal account to automatically fetch GSTR-2A data for your first reconciliation."
  }
]`
  }
];

export default function AIFeatures() {
  const [activeOutput, setActiveOutput] = useState(null);
  const [loadingFeature, setLoadingFeature] = useState(null);
  const [demoInvoiceId, setDemoInvoiceId] = useState(null);

  React.useEffect(() => {
    // Fetch a single invoice ID to use for the mock endpoints
    api.get('/invoices?limit=1').then(res => {
      if (res.data.invoices?.length > 0) {
        setDemoInvoiceId(res.data.invoices[0]._id);
      }
    }).catch(() => {});
  }, []);

  const tryItLive = async (feature) => {
    setLoadingFeature(feature.num);
    setActiveOutput(null);

    try {
      let route = feature.apiRoute;
      // Inject real invoice ID if needed for demo
      if (route.includes('/mock') && demoInvoiceId) {
        route = route.replace('/mock', `/${demoInvoiceId}`);
      } else if (route.includes('/mock') && !demoInvoiceId) {
        throw new Error('Please upload at least one invoice in the invoices tab to test this specific endpoint natively.');
      }

      let res;
      if (feature.method === 'POST') {
        res = await api.post(route, feature.payload);
      } else {
        res = await api.get(route);
      }

      // Convert response to formatted JSON literal for display
      setActiveOutput({
        num: feature.num,
        data: JSON.stringify(res.data, null, 2)
      });
    } catch (err) {
      let msg = err.message || 'Failed to connect to Gemini API.';
      if (err.response?.status === 401) {
        msg = 'Authentication required to run live API calls. Please log in or try the demo.';
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setActiveOutput({
        num: feature.num,
        data: `ERROR: ${msg}`
      });
    } finally {
      setLoadingFeature(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Public Navbar */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E5E0', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', letterSpacing: '-0.3px' }}>LedgerSync</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#B8935A', letterSpacing: '-0.3px' }}>AI</span>
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/login" style={{ padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#1A1A1A', background: '#FFFFFF', border: '1px solid #E8E5E0', textDecoration: 'none' }}>Login</a>
        </div>
      </nav>

      <div style={{ padding: '48px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', color: '#1A1A1A', marginBottom: '8px', fontWeight: 800, letterSpacing: '-0.5px' }}>AI-powered features</h2>
          <p style={{ fontSize: '15px', color: '#555', maxWidth: '800px', lineHeight: '1.6', marginBottom: '16px' }}>
            LedgerSync uses Google's Gemini 1.5 Flash to turn raw invoice data into clear, actionable GST compliance intelligence.
          </p>
          <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', color: '#7E22CE', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> 10 AI features | Powered by Gemini 1.5 Flash | Live data context | Real-time analysis
          </div>
        </div>

        <div style={{ display: 'grid', gap: '32px', paddingBottom: '64px' }}>
        {FEATURES.map((feat, index) => (
          <Card key={feat.num} showMockBadge={false} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FAFAF8', overflow: 'hidden', padding: '32px' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '20px', fontSize: '120px', fontWeight: 900, color: '#F0EDE8', zIndex: 0, userSelect: 'none' }}>
              {feat.num}
            </div>
            
            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '40px', alignItems: 'start' }}>
              {/* Left Column: Explanation */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>{feat.name}</h3>
                  <span style={{ background: '#6B46C1', color: '#FFF', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    AI-Powered
                  </span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: '#B8935A', margin: '0 0 24px 0' }}>{feat.tagline}</p>
                
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '13px', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Problem</strong>
                  <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '6px 0 0 0' }}>{feat.problem}</p>
                </div>
                
                <div>
                  <strong style={{ fontSize: '13px', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How it works</strong>
                  <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '6px 0 0 0' }}>{feat.howItWorks}</p>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button 
                    onClick={() => tryItLive(feat)}
                    disabled={loadingFeature === feat.num}
                    style={{ background: '#1A1A1A', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: loadingFeature === feat.num ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: loadingFeature === feat.num ? 0.7 : 1 }}
                  >
                    {loadingFeature === feat.num ? 'Asking Gemini...' : 'Try it live'}
                  </button>
                </div>
              </div>

              {/* Right Column: Output */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {activeOutput?.num === feat.num ? 'Live API Response' : 'Sample Realistic Output'}
                </div>
                <div style={{ background: '#FAFAF8', border: '1px solid #E8E5E0', borderRadius: '6px', padding: '16px', fontSize: '13px', fontFamily: '"JetBrains Mono", "Courier New", monospace', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', overflowY: 'auto', maxHeight: '300px' }}>
                  {activeOutput?.num === feat.num ? activeOutput.data : feat.sampleOutput}
                </div>
              </div>
            </div>

            {/* Mobile query shim */}
            <style>{`
              @media (max-width: 900px) {
                div[style*="gridTemplateColumns"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}
