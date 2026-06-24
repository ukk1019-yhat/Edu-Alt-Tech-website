import React, { useState, useRef, useEffect, useCallback } from 'react';

import { sendAIChat, AIMode } from '../lib/ai';
import { auth, db, onAuthStateChanged, collection, query, where, getDocs, limit } from '../lib/firebase';

type ModeOption = {
  id: AIMode;
  label: string;

  description: string;
};

const MODES: ModeOption[] = [
  { id: 'chat', label: 'General Chat', description: 'Ask anything about Edu-Alt-Tech' },
  { id: 'mentor', label: 'AI Mentor', description: 'Personalized learning guidance' },
  { id: 'course', label: 'Course Help', description: 'Get help with courses' },
  { id: 'admin', label: 'Admin Tool', description: 'Admin assistance' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [mentorContext, setMentorContext] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const mQ = query(collection(db, 'user_metrics'), where('userId', '==', u.uid), limit(5));
          const mSnap = await getDocs(mQ);
          const contextParts: string[] = [];
          mSnap.forEach(d => {
            const data = d.data();
            contextParts.push(`Course: ${data.courseId?.slice(0, 12) || 'Unknown'} | Avg Score: ${Math.round(data.avgScore || 0)}% | Completed: ${data.completedModules || 0}/${data.totalModules || 0} modules | Level: ${data.currentDifficulty || 'beginner'} | Strengths: ${(data.strengths || []).slice(0, 3).join(', ')} | Weak areas: ${(data.weaknesses || []).slice(0, 3).join(', ')}`);
          });
          if (contextParts.length > 0) {
            setMentorContext(`Student Progress Context:\n${contextParts.join('\n')}\n\nUse this to personalize your mentoring.`);
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const openWithMode = useCallback((targetMode: AIMode) => {
    setMode(targetMode);
    setMessages([]);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      openWithMode(e.detail?.mode || 'chat');
    };
    window.addEventListener('openaichat' as any, handler);
    return () => window.removeEventListener('openaichat' as any, handler);
  }, [openWithMode]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetings: Record<AIMode, string> = {
        chat: 'Hello! I\'m EduAI. I can help you with the platform, learning tips, or answer questions. What\'s on your mind?',
        mentor: 'Welcome! I\'m your AI Mentor. I\'ve analyzed your learning progress and I\'m here to guide you. What would you like to work on today?',
        course: 'Hi there! I\'m your Course Assistant. Ask me about courses, learning paths, or concepts you\'re studying.',
        admin: 'Welcome, Admin. I\'m your admin assistant. I can help draft content, generate descriptions, or assist with platform management.',
      };
      setMessages([{ role: 'assistant', content: greetings[mode] }]);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const currentMode = MODES.find(m => m.id === mode);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const augmentedMessage = mode === 'mentor' && mentorContext
        ? `${mentorContext}\n\nStudent says: ${userMsg.content}`
        : userMsg.content;

      const res = await sendAIChat(augmentedMessage, mode, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Please try again.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const switchMode = (newMode: AIMode) => {
    setMode(newMode);
    setMessages([]);
    setShowModePicker(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn"
        style={{ width: '48px', height: '48px', borderRadius: '4px', padding: 0 }}
      >
        {isOpen ? '×' : 'AI'}
      </button>

      {isOpen && (
        <div
          className="bento-card flex flex-col overflow-hidden"
          style={{
            position: 'absolute', bottom: '56px', right: '0',
            width: '380px', maxHeight: '520px', padding: '0',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--ink)' }}>
            <div className="flex items-center gap-10">
              <div className="flex items-center justify-center" style={{ width: '32px', height: '32px', border: '2px solid var(--ink)', background: 'var(--accent-soft)' }}>
                <span style={{fontSize:'0.7rem',fontWeight:700}}>AI</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-8">
                  <span className="font-bold text-sm">EduAI</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '0 6px' }}>v2</span>
                </div>
                <div className="relative">
                  <button
                    className="btn btn-sm btn-secondary gap-4"
                    onClick={() => setShowModePicker(!showModePicker)}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    {currentMode?.label}
                    ▼
                  </button>
                  {showModePicker && (
                    <div
                      className="bento-card bento-card-compact"
                      style={{
                        position: 'absolute', top: '100%', left: 0, zIndex: 10,
                        width: '220px', maxHeight: 260, overflowY: 'auto', padding: 8, gap: 4, marginTop: 4,
                      }}
                    >
                      {MODES.map(m => (
                        <button
                          key={m.id}
                          onClick={() => switchMode(m.id)}
                          style={{
                            display: 'flex', width: '100', padding: '8px 10px', border: 'none',
                            background: m.id === mode ? 'var(--accent-soft)' : 'transparent',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{ textAlign: 'left' }}>
                            <div className="font-semibold text-xs">{m.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>{m.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => setIsOpen(false)} style={{ width: '28px', height: '28px', padding: 0 }}>
                ×
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-10" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className="flex"
                style={{
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 14px',
                    border: '2px solid var(--ink)',
                    background: msg.role === 'user' ? 'var(--accent-soft)' : 'var(--bg)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    color: 'var(--ink)',
                  }}
                >
                  <p className="text-sm text-ink" style={{ margin: 0 }}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex" style={{ justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 14px', border: '2px solid var(--ink)', background: 'var(--bg)' }}>
                  ...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '2px solid var(--ink)' }}>
            <div className="flex gap-8">
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask EduAI anything..."
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{ padding: '10px 14px' }}
              >
                {loading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
