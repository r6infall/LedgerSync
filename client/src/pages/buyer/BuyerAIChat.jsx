import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function BuyerAIChat() {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hi! I am LedgerSync, your AI assistant for Indian GST compliance. How can I help you today?', timestamp: new Date() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickChips = [
    "Why is my ITC blocked?",
    "Which supplier is causing issues?",
    "What do I need to file this month?",
    "How do I improve my compliance score?"
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am currently unable to process your request. Please try again later.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '12px' }}>
        LedgerSync Assistant 
        <span className="ai-badge" style={{background:'#F3E8FF', color:'#7E22CE', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600'}}>✨ AI-powered (Gemini 1.5 Flash)</span>
      </h2>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', background: '#FAFAFA', borderBottom: '1px solid #E8E5E0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#555', padding: '6px 0', marginRight: '8px' }}>Ask quickly:</span>
          {quickChips.map((chip, i) => (
            <button key={i} onClick={() => sendMessage(chip)} disabled={loading} style={{ background: '#FFF', border: '1px solid #D1D5DB', borderRadius: '16px', padding: '6px 12px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer', color: '#374151', transition: '0.2s' }}>
              {chip}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ background: msg.role === 'user' ? '#1A1A1A' : '#F3E8FF', color: msg.role === 'user' ? '#FFF' : '#1A1A1A', padding: '12px 16px', borderRadius: '12px', borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px', borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px', fontSize: '14px', lineHeight: '1.5' }}>
                {msg.role === 'ai' && <strong style={{color: '#7E22CE', display: 'block', marginBottom: '4px', fontSize: '12px'}}>🤖 LedgerSync</strong>}
                {msg.text}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: '#F3E8FF', padding: '12px 16px', borderRadius: '12px', color: '#7E22CE', fontSize: '13px', fontStyle: 'italic' }}>
              Thinking natively intelligently processing context...
            </div>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #E8E5E0', background: '#FFF' }}>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask anything about your GST compliance..." 
              style={{ flex: 1, padding: '12px 16px', border: '1px solid #E8E5E0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ background: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0 24px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
