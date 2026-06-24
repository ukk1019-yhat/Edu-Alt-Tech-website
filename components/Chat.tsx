import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../lib/firebase';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, doc, getDoc } from '../lib/firebase';

import { UserObject } from '../types';

interface Props {
  user: User;
  role: 'student' | 'teacher' | 'admin';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  otherUid: string;
  otherName: string;
  otherEmail: string;
}

const makeThreadId = (a: string, b: string) => [a, b].sort().join('_');

const Chat: React.FC<Props> = ({ user, role }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThread, setActiveThread] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setLoadingConvos(true);
      try {
        let uids: string[] = [];

        if (role === 'student') {
          const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid)));
          const courseIds = enrollSnap.docs.map(d => d.data().courseId as string);
          const teacherIds = new Set<string>();
          for (const cid of courseIds) {
            const cDoc = await getDoc(doc(db, 'courses', cid));
            if (cDoc.exists()) teacherIds.add(cDoc.data().teacherId as string);
          }
          uids = Array.from(teacherIds);
        } else {
          const courseSnap = await getDocs(query(collection(db, 'courses'), where('teacherId', '==', user.uid)));
          const courseIds = courseSnap.docs.map(d => d.id);
          const studentIds = new Set<string>();
          for (const cid of courseIds) {
            const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', cid)));
            enrollSnap.docs.forEach(d => studentIds.add(d.data().studentId as string));
          }
          uids = Array.from(studentIds);
        }

        const convos: Conversation[] = [];
        for (const uid of uids) {
          const uDoc = await getDoc(doc(db, 'users', uid));
          if (uDoc.exists()) {
            const data = uDoc.data() as UserObject;
            convos.push({
              id: makeThreadId(user.uid, uid),
              otherUid: uid,
              otherName: data.name,
              otherEmail: data.email,
            });
          }
        }
        setConversations(convos);
      } catch (e) {
        console.error('Error loading conversations', e);
      } finally {
        setLoadingConvos(false);
      }
    };
    loadConversations();
  }, [user.uid, role]);

  useEffect(() => {
    if (!activeThread) return;
    const q = query(
      collection(db, 'chats', activeThread.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return () => unsub();
  }, [activeThread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', activeThread.id, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.error('Send failed', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeThread) {
    return (
      <div className="bento-card" style={{ gap: '16px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h3 className="flex items-center gap-8">
            Messages
          </h3>
        </div>

        {loadingConvos ? (
          <div className="flex flex-col gap-12">
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">

            <h4 style={{ marginBottom: '4px' }}>No conversations yet</h4>
            <p>
              {role === 'student' ? 'Enroll in a course to start messaging your teacher.' : 'Students will appear here once they enroll in your courses.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversations.map((convo) => (
              <button
                key={convo.id}
                className="btn btn-sm"
                onClick={() => setActiveThread(convo)}
                style={{
                  justifyContent: 'flex-start', padding: '12px 16px', gap: '12px',
                  background: 'var(--bg-surface)', borderColor: 'var(--rule-soft)',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '4px', border: '2px solid var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', background: 'var(--accent-soft)', flexShrink: 0,
                }}>
                  {convo.otherName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{convo.otherName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{convo.otherEmail}</div>
                </div>

              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bento-card" style={{ padding: 0, overflow: 'hidden', height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--ink)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-sm btn-secondary" onClick={() => { setActiveThread(null); setMessages([]); }}>
          ← Back
        </button>
        <div style={{
          width: '32px', height: '32px', borderRadius: '4px', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.8rem', background: 'var(--accent-soft)', flexShrink: 0,
        }}>
          {activeThread.otherName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeThread.otherName}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-mute)' }}>{activeThread.otherEmail}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '8px 14px',
                border: '2px solid var(--ink)', background: isMe ? 'var(--accent-soft)' : 'var(--bg)',
              }}>
                {!isMe && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '2px' }}>{msg.senderName}</div>
                )}
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)' }}>{msg.text}</p>
                <div style={{ fontSize: '0.65rem', color: 'var(--ink-mute)', marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '12px 20px', borderTop: '2px solid var(--ink)', display: 'flex', gap: '8px' }}>
        <input
          className="input"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
