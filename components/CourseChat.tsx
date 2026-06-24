import React, { useState, useEffect, useRef } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, limit } from '../lib/firebase';


interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

interface ChatProps {
  courseId: string;
  currentUser: any;
  mentorId: string;
  role: 'student' | 'teacher';
}

const CourseChat: React.FC<ChatProps> = ({ courseId, currentUser, mentorId, role }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [mentorName, setMentorName] = useState('Mentor');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentorId) {
      getDoc(doc(db, 'users', mentorId)).then(snap => {
        if (snap.exists()) setMentorName(snap.data().displayName || snap.data().name || 'Mentor');
      }).catch(() => {});
    }
  }, [mentorId]);

  useEffect(() => {
    if (!currentUser?.uid) { setLoading(false); return; }
    setLoading(true);
    const msgQ = query(
      collection(db, 'course_chat_messages'),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(msgQ, (snap) => {
      const msgs = snap.docs.map((d: any) => ({
        id: d.id,
        senderId: d.data().userId || d.data().user_id || '',
        senderName: d.data().senderName || d.data().sender_name || 'User',
        text: d.data().content || '',
        timestamp: d.data().createdAt || d.data().created_at
      }));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [courseId, currentUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.uid) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, 'course_chat_messages'), {
        course_id: courseId,
        user_id: currentUser.uid,
        content: text,
        sender_name: currentUser.displayName || 'User',
        created_at: serverTimestamp()
      });
    } catch (err) {
      console.error("Send error", err);
    }
  };

  return (
    <div className="bento-card" style={{ padding: 0, overflow: 'hidden', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--ink)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}># Course Broadcast</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '2px solid var(--rule-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
              <span style={{fontWeight:700,fontSize:'0.8rem'}}>U</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Course Broadcast</h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-mute)' }}>Whole Students Channel</span>
            </div>
          </div>
          {role === 'teacher' && (
            <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Instructor Mode</span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ width: i % 2 === 0 ? '60%' : '80%' }} />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">

              <p>Start the conversation...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.uid;
                const showName = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%' }}>
                      {showName && !isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)' }}>{msg.senderName}</span>
                          {msg.senderId === mentorId && (
                            <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '0 6px' }}>{mentorName}</span>
                          )}
                        </div>
                      )}
                      <div style={{
                        display: 'inline-block', padding: '8px 14px',
                        border: '2px solid var(--ink)', background: isMe ? 'var(--accent-soft)' : 'var(--bg)',
                        fontSize: '0.85rem', color: 'var(--ink)',
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '12px 20px', borderTop: '2px solid var(--ink)', display: 'flex', gap: '8px' }}>
          <input
            className="input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseChat;
