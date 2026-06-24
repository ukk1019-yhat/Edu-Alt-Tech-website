import React, { useState } from 'react';

import { sendAIChat } from '../lib/ai';
import { trackActivity } from '../lib/analytics';
import { auth } from '../lib/firebase';

interface DoubtSolverProps {
  courseId: string;
  courseTitle?: string;
  moduleTitle?: string;
  context?: string;
}

const DoubtSolver: React.FC<DoubtSolverProps> = ({ courseId, courseTitle, moduleTitle, context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer('');
    setAsked(false);

    const contextStr = `Course: ${courseTitle || 'Unknown'}\nModule: ${moduleTitle || 'General'}\n${context ? `Context: ${context}` : ''}`;

    try {
      const res = await sendAIChat(
        `${contextStr}\n\nStudent's doubt: ${question}\n\nExplain clearly and concisely. Include examples if helpful.`,
        'course'
      );
      setAnswer(res.content);
      setAsked(true);

      const user = auth.currentUser;
      if (user) {
        await trackActivity(user.uid, 'doubt_asked', courseId, { question, moduleTitle });
      }
    } catch (e: any) {
      setAnswer(`Sorry, I couldn't process your doubt: ${e.message}`);
      setAsked(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 999 }}>
      <button
        className="btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '48px', height: '48px', borderRadius: '4px', padding: 0 }}
      >
        {isOpen ? '×' : '?'}
      </button>

      {isOpen && (
        <div
          className="bento-card"
          style={{
            position: 'absolute', bottom: '56px', right: '0',
            width: '360px', maxHeight: '480px', display: 'flex',
            flexDirection: 'column', padding: 0, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
                <span style={{fontSize:'0.7rem',fontWeight:700}}>AI</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Doubt Solver</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>{courseTitle || 'AI Tutor'}</div>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => setIsOpen(false)} style={{ width: '28px', height: '28px', padding: 0 }}>
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!asked ? (
              <div className="empty-state" style={{ padding: '24px' }}>

                <p>Ask any doubt about this course. I'll explain with examples.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ padding: '8px 14px', border: '2px solid var(--ink)', background: 'var(--accent-soft)', maxWidth: '85%', fontSize: '0.85rem' }}>
                    {question}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', border: '2px solid var(--accent)', background: 'var(--bg)', maxWidth: '85%', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <div className="flabel" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>Answer</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)' }}>{answer}</p>
                  </div>
                </div>
              </>
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 14px', border: '2px solid var(--ink)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ...
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '2px solid var(--ink)', display: 'flex', gap: '8px' }}>
            <input
              className="input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
              placeholder="Type your doubt..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{ padding: '10px 14px' }}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtSolver;
