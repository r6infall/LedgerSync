import React, { useState } from 'react';

const METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Netbanking', icon: '🏦', desc: 'SBI, HDFC, ICICI, Axis' },
];

function generateMockTxnId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pay_mock_';
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMockSignature() {
  let hex = '';
  for (let i = 0; i < 64; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

export default function MockRazorpayModal({ invoice, onClose, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [txnId, setTxnId] = useState('');

  const handlePay = () => {
    setProcessing(true);
    const id = generateMockTxnId();
    const sig = generateMockSignature();
    setTxnId(id);

    // Simulate 2-second processing delay
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      if (onSuccess) {
        onSuccess({
          invoiceId: invoice._id,
          transactionId: id,
          amount: invoice.totalAmount,
          mockSignature: sig,
          paymentMethod: 'mock_' + selectedMethod,
        });
      }
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#FFF', borderRadius: '12px', width: '420px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        
        {/* Header */}
        <div style={{ background: '#1A1A1A', padding: '16px 20px', color: '#FFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#B8935A', fontWeight: 600 }}>Mock Razorpay Checkout</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>LedgerSync Payments</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ background: '#C0392B', color: '#FFF', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '8px', letterSpacing: '0.5px' }}>
            ⚠ Mock Payment Simulation — No real money is transferred
          </div>
        </div>

        {/* Invoice Summary */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E5E0', background: '#FAFAF8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span style={{ color: '#555' }}>Invoice</span>
            <strong>{invoice.invoiceNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span style={{ color: '#555' }}>Supplier GSTIN</span>
            <strong>{invoice.sellerGstin}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #E8E5E0' }}>
            <span style={{ color: '#1A1A1A', fontWeight: 600 }}>Amount</span>
            <span style={{ color: '#2D7D4E', fontWeight: 700, fontSize: '20px' }}>₹{invoice.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Methods */}
        {!done && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Pay with</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    border: selectedMethod === m.id ? '2px solid #1A1A1A' : '1px solid #E8E5E0',
                    borderRadius: '8px',
                    background: selectedMethod === m.id ? '#F5F5F0' : '#FFF',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '20px' }}>{m.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E8E5E0' }}>
          {processing ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #E8E5E0', borderTopColor: '#1A1A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Processing Mock Payment...</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Simulating 2-second processing delay</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#2D7D4E' }}>Payment Successful</div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '8px', background: '#F5F5F0', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                Transaction: {txnId}
              </div>
              <div style={{ background: '#C0392B', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '8px' }}>
                MOCK PAYMENT
              </div>
              <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: '16px', background: '#1A1A1A', color: '#FFF', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          ) : (
            <button onClick={handlePay} style={{ width: '100%', background: '#2D7D4E', color: '#FFF', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', letterSpacing: '0.3px' }}>
              Pay ₹{invoice.totalAmount?.toLocaleString('en-IN')} Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
