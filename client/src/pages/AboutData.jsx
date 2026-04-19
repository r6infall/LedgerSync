import Topnav from '../components/Topnav';

export default function AboutData() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column' }}>
      <Topnav />
      <div style={{ maxWidth: '800px', margin: '40px auto', width: '100%', padding: '0 24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#1A1A1A' }}>SEED DATA MANIFEST</h1>
        <p style={{ color: '#555', marginBottom: '32px', fontSize: '14px' }}>This document outlines the exact parameters injected into the demonstration context window.</p>

        <div style={{ background: '#FFF', border: '1px solid #E8E5E0', borderRadius: '8px', padding: '24px' }}>
          <ul style={{ lineHeight: '2', margin: 0, paddingLeft: '20px', color: '#1A1A1A', fontSize: '14px' }}>
            <li><strong>Business (Buyer):</strong> Ravi Textiles Pvt Ltd</li>
            <li><strong>GSTIN (Buyer):</strong> 27ABCDE1234F1Z5</li>
            <li><strong>Demo login:</strong> demo@taxsync.ai / Demo@1234</li>
            <li><strong>20 purchase invoices</strong> uploaded by buyer</li>
            <li><strong>20 GSTR-2A invoices</strong> from mock GST portal</li>
            <li><strong>Breakdown:</strong> 12 matched, 4 mismatched (amount differences), 4 missing (supplier never filed)</li>
            <li><strong>4 mock suppliers:</strong> Sharma Textiles (29AAAGM0289C1ZF), Kumar Fabrics, Delhi Weaves, Rajasthan Mills</li>
            <li><strong>Mock payment:</strong> 2 invoices paid via mock Razorpay, 2 pending payment</li>
            <li><strong>Compliance score:</strong> 74/100 (calculated from mismatch + missing count)</li>
            <li><strong>All AI responses</strong> are generated live by Gemini API using this mock data as context</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
