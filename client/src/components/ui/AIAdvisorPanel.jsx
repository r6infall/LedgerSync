import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

export default function AIAdvisorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewInsight, setHasNewInsight] = useState(true);
  const messagesEndRef = useRef(null);

  const predefinedQuestions = [
    "Why is ITC blocked?",
    "Riskiest supplier?",
    "Improve my score",
    "Penalty estimate?"
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Advisor unavailable right now. Please try again.', isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend(inputValue);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewInsight(false);
    if (messages.length === 0) {
      setMessages([{ role: 'ai', content: 'Hello! I am your LedgerSync AI Advisor. How can I help you optimize your GST compliance today?' }]);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div 
          onClick={handleOpen}
          style={{
            position: 'fixed', bottom: 24, right: 24, width: 44, height: 44,
            borderRadius: '50%', background: '#1A1A1A', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {hasNewInsight && (
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 10, height: 10,
              background: '#B8935A', borderRadius: '50%', border: '2px solid #FFFFFF'
            }} />
          )}
        </div>
      )}

      {/* Chat Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
        background: '#FFFFFF', borderLeft: '1px solid #E8E5E0',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease', zIndex: 1001,
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>AI Advisor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 9, background: '#F0EDE8', color: '#B8935A', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Gemini</span>
            <span onClick={() => setIsOpen(false)} style={{ fontSize: 18, color: '#999', cursor: 'pointer', lineHeight: 1 }}>&times;</span>
          </div>
        </div>

        {/* Quick-ask chips */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #F0EDE8', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {predefinedQuestions.map(q => (
            <div 
              key={q} 
              onClick={() => handleSend(q)}
              style={{
                fontSize: 9, background: '#FAFAF8', border: '1px solid #E8E5E0',
                borderRadius: 20, padding: '3px 9px', color: '#666', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#B8935A'; e.currentTarget.style.color = '#B8935A'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#E8E5E0'; e.currentTarget.style.color = '#666'; }}
            >
              {q}
            </div>
          ))}
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#1A1A1A' : '#FAFAF8',
              color: msg.role === 'user' ? '#FFFFFF' : (msg.isError ? '#C0392B' : '#333'),
              border: msg.role === 'ai' ? '1px solid #E8E5E0' : 'none',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '8px 12px', fontSize: 12, maxWidth: '85%', lineHeight: 1.6
            }}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', background: '#FAFAF8', border: '1px solid #E8E5E0', borderRadius: '12px 12px 12px 2px', padding: '8px 12px' }}>
              <span style={{ fontSize: 18, color: '#BBBBBB', animation: 'pulse 1.5s infinite' }}>...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Row */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #E8E5E0', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            style={{
              flex: 1, border: '1px solid #E8E5E0', borderRadius: 20, padding: '8px 14px',
              fontSize: 12, background: '#FAFAF8', outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#B8935A'}
            onBlur={e => e.target.style.borderColor = '#E8E5E0'}
          />
          <button 
            onClick={() => handleSend(inputValue)}
            style={{
              background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '50%',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
