import React, { useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { LINKS } from '../constants';
import { toast } from 'react-hot-toast';

const Contact: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) {
        setName(u.displayName || '');
        setEmail(u.email || '');
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to send a message');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await db.from('chat_messages').insert({
        user_id: currentUser.uid,
        content: message.trim(),
        role: 'user',
        created_at: new Date().toISOString()
      });

      toast.success('Message sent!');
      setMessage('');
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="viewport-content">
      {/* Page Header */}
      <div className="section-header">
        <span className="flabel">[ GET IN TOUCH ]</span>
        <h1>Let's Connect</h1>
        <p>
          Have questions about our peer-driven ecosystem? We're here to help.
        </p>
      </div>

      <div className="grid-2">
        {/* Contact Info */}
        <div className="bento-card" style={{ gap: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
              @
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>Email us</p>
              <p style={{ fontSize: '0.85rem' }}>info@edualttech.com</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>
              ☎
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>Call us</p>
              <p style={{ fontSize: '0.85rem' }}>+91 91215 05879</p>
            </div>
          </div>

          <div className="asc-sm" />

          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Connect with us</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ gap: 6 }}>
                <span>WhatsApp</span>
              </a>
              <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ gap: 6 }}>
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bento-card">
          {!currentUser ? (
            <div className="empty-state" style={{ gap: 8 }}>
              <p>Please log in to send a message</p>
              <p>
                <a href="/login">Login here</a> or create an account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="input"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !message.trim()}
                style={{ marginTop: 8 }}
              >
                {sending ? '⏳' : '📤'}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;
