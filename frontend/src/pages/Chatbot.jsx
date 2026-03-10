import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function Chatbot({ embedded = false }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Aloe Vera Assistant. Ask me anything about Aloe Vera - care, benefits, uses, growing tips, and more!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts or when loading finishes
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/chatbot/ask', { message: inputValue });
      
      const fullText = response.data?.data?.response || 'Sorry, I could not generate a response.';
      const botMessage = {
        id: messages.length + 2,
        text: '',
        sender: 'bot',
        timestamp: new Date()
      };
      
      // Add the message with empty text first
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      
      // Typing animation
      let currentIndex = 0;
      const typingSpeed = 30; // milliseconds per character
      
      const typeNextCharacter = () => {
        if (currentIndex < fullText.length) {
          currentIndex++;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = fullText.substring(0, currentIndex);
            return updated;
          });
          setTimeout(typeNextCharacter, typingSpeed);
        }
      };
      
      typeNextCharacter();
    } catch (err) {
      const errorText = err.response?.data?.error || 'Failed to get response. Please try again.';
      const errorMessage = {
        id: messages.length + 2,
        text: '',
        sender: 'bot',
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      
      // Typing animation for error
      let currentIndex = 0;
      const typingSpeed = 30;
      
      const typeNextCharacter = () => {
        if (currentIndex < errorText.length) {
          currentIndex++;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = errorText.substring(0, currentIndex);
            return updated;
          });
          setTimeout(typeNextCharacter, typingSpeed);
        }
      };
      
      typeNextCharacter();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Aloe Vera Assistant. Ask me anything about Aloe Vera - care, benefits, uses, growing tips, and more!",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setError('');
  };

  const quickPrompts = [
    "How do I care for my Aloe Vera plant?",
    "What are the health benefits of Aloe Vera?",
    "How often should I water Aloe Vera?",
    "What diseases affect Aloe Vera plants?"
  ];

  return (
    <div style={{ ...styles.container, ...(embedded ? styles.containerEmbedded : {}) }}>
      {/* Header */}
      <div style={{ ...styles.header, ...(embedded ? styles.headerEmbedded : {}) }}>
        <div style={styles.headerContent}>
          <div style={{ ...styles.headerIcon, ...(embedded ? styles.headerIconEmbedded : {}) }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1 style={{ ...styles.title, ...(embedded ? styles.titleEmbedded : {}) }}>Aloe Vera Assistant</h1>
            <p style={{ ...styles.subtitle, ...(embedded ? styles.subtitleEmbedded : {}) }}>Your personal guide to plant care and health</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={clearChat} style={{ ...styles.clearButton, ...(embedded ? styles.clearButtonEmbedded : {}) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div style={styles.messagesContainer}>
        <div style={styles.messagesWrapper}>
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageRow,
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.sender === 'bot' && (
                <div style={styles.avatarBot}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
              )}
              
              <div style={styles.messageGroup}>
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot),
                    ...(msg.isError ? styles.messageBubbleError : {})
                  }}
                >
                  {msg.isError && (
                    <div style={styles.errorIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  )}
                  <div style={styles.messageText}>{msg.text}</div>
                </div>
                <div
                  style={{
                    ...styles.messageTime,
                    ...(msg.sender === 'user' ? { textAlign: 'right' } : {})
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div style={styles.avatarUser}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={styles.messageRow}>
              <div style={styles.avatarBot}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div style={styles.loadingBubble}>
                <div style={styles.typingIndicator}>
                  <span style={{ ...styles.typingDot, animationDelay: '0s' }}></span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}></span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts - Show only when there are few messages */}
        {messages.length <= 2 && !loading && (
          <div style={styles.quickPromptsContainer}>
            <div style={styles.quickPromptsTitle}>Quick Questions</div>
            <div style={styles.quickPromptsGrid}>
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  style={styles.quickPromptButton}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ ...styles.inputContainer, ...(embedded ? styles.inputContainerEmbedded : {}) }}>
        {error && (
          <div style={styles.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <div style={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about Aloe Vera..."
              disabled={loading}
              autoFocus
              style={styles.input}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              style={{
                ...styles.sendButton,
                ...(loading || !inputValue.trim() ? styles.sendButtonDisabled : {})
              }}
            >
              {loading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  containerEmbedded: {
    height: '100%',
    minHeight: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  headerEmbedded: {
    padding: '12px 14px',
    backgroundColor: 'rgba(18, 55, 35, 0.85)',
    borderBottom: '1px solid rgba(173, 206, 186, 0.3)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  headerIconEmbedded: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    boxShadow: '0 6px 14px rgba(8, 31, 19, 0.35)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  titleEmbedded: {
    color: '#eaf6ee',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400',
  },
  subtitleEmbedded: {
    color: '#cbe2d2',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  clearButtonEmbedded: {
    backgroundColor: 'rgba(188, 229, 202, 0.2)',
    color: '#ecf7f0',
    border: '1px solid rgba(173, 206, 186, 0.42)',
  },

  // Messages Container
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  messagesWrapper: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Message Row
  messageRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    animation: 'fadeIn 0.3s ease-out',
  },
  messageGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '70%',
  },

  // Avatars
  avatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Message Bubbles
  messageBubble: {
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    lineHeight: '1.5',
    fontSize: '14px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  messageBubbleBot: {
    backgroundColor: 'white',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderTopLeftRadius: '4px',
  },
  messageBubbleUser: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    borderTopRightRadius: '4px',
  },
  messageBubbleError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  errorIcon: {
    color: '#dc2626',
    flexShrink: 0,
    marginTop: '2px',
  },
  messageText: {
    flex: 1,
  },
  messageTime: {
    fontSize: '11px',
    color: '#9ca3af',
    paddingLeft: '4px',
    paddingRight: '4px',
  },

  // Loading Bubble
  loadingBubble: {
    padding: '12px 20px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    borderTopLeftRadius: '4px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
    animation: 'typing 1.4s infinite',
  },

  // Quick Prompts
  quickPromptsContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 24px 24px',
  },
  quickPromptsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  quickPromptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
  },
  quickPromptButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 14px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#374151',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },

  // Input Container
  inputContainer: {
    padding: '16px 24px',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.05)',
  },
  inputContainerEmbedded: {
    padding: '12px',
    backgroundColor: 'rgba(18, 55, 35, 0.8)',
    borderTop: '1px solid rgba(173, 206, 186, 0.3)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#991b1b',
    marginBottom: '12px',
  },
  inputForm: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  inputWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  sendButton: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};
