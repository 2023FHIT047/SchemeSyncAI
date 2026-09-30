import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { chatbotApi } from '../api/chatbotApi';

export const ChatbotDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am your AI Government Scheme Assistant. Ask me anything about schemes for farmers, students, or women welfare.',
      source: 'System'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await chatbotApi.sendQuery(userMsg);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: res.answer,
        source: res.source,
        schemes: res.referenced_schemes
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I encountered an issue retrieving information. Please try browsing the Scheme Explorer.',
        source: 'Error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setIsOpen(!isOpen)} title="Open AI Scheme Assistant">
        {isOpen ? <X style={{ width: '1.5rem', height: '1.5rem' }} /> : <Bot style={{ width: '1.75rem', height: '1.75rem' }} />}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'var(--accent-emerald)' }} />
              <div>
                <h4 style={{ color: 'white', fontSize: '0.95rem', margin: 0 }}>GovScheme AI Assistant</h4>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Grounded in Database</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X style={{ width: '1.1rem', height: '1.1rem' }} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-msg ${msg.sender}`}>
                <p>{msg.text}</p>
                {msg.source && <span style={{ display: 'block', fontSize: '0.675rem', marginTop: '0.35rem', opacity: 0.75 }}>{msg.source}</span>}
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot" style={{ fontStyle: 'italic', color: 'var(--gray-500)' }}>
                Searching verified schemes database...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="chat-input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask e.g. What schemes exist for Maharashtra farmers?"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              <Send style={{ width: '0.85rem', height: '0.85rem' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
