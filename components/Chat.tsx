import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, getDocs, where, doc, getDoc
} from 'firebase/firestore';
import { Loader2, Send, MessageCircle, ArrowLeft } from 'lucide-react';
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
  id: string;       // threadId = sorted uid1_uid2
  otherUid: string;
  otherName: string;
  otherEmail: string;
}

// threadId is always the two uids sorted alphabetically joined by '_'
const makeThreadId = (a: string, b: string) => [a, b].sort().join('_');

const Chat: React.FC<Props> = ({ user, role }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThread, setActiveThread] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation list — students see their teachers, teachers see their students
  useEffect(() => {
    const loadConversations = async () => {
      setLoadingConvos(true);
      try {
        let uids: string[] = [];

        if (role === 'student') {
          // Find all teachers of courses the student is enrolled in
          const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid)));
          const courseIds = enrollSnap.docs.map(d => d.data().courseId as string);
          const teacherIds = new Set<string>();
          for (const cid of courseIds) {
            const cDoc = await getDoc(doc(db, 'courses', cid));
            if (cDoc.exists()) teacherIds.add(cDoc.data().teacherId as string);
          }
          uids = Array.from(teacherIds);
        } else {
          // Teacher: find all students enrolled in their courses
          const courseSnap = await getDocs(query(collection(db, 'courses'), where('teacherId', '==', user.uid)));
          const courseIds = courseSnap.docs.map(d => d.id);
          const studentIds = new Set<string>();
          for (const cid of courseIds) {
            const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', cid)));
            enrollSnap.docs.forEach(d => studentIds.add(d.data().studentId as string));
          }
          uids = Array.from(studentIds);
        }

        // Fetch user profiles
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

  // Load messages for active thread
  useEffect(() => {
    if (!activeThread) return;
    const q = query(
      collection(db, 'chats', activeThread.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
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

  // ── Conversation list ──────────────────────────────────────────────────────
  if (!activeThread) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-emerald-500" /> Messages
        </h2>

        {loadingConvos ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : conversations.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <MessageCircle className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No conversations yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {role === 'student' ? 'Enroll in a course to start messaging your teacher.' : 'Students will appear here once they enroll in your courses.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {conversations.map((convo, i) => (
              <button key={convo.id} onClick={() => setActiveThread(convo)}
                className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg flex-shrink-0">
                  {convo.otherName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{convo.otherName}</p>
                  <p className="text-xs text-slate-400 truncate">{convo.otherEmail}</p>
                </div>
                <MessageCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Chat window ────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => { setActiveThread(null); setMessages([]); }}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
          {activeThread.otherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{activeThread.otherName}</p>
          <p className="text-xs text-slate-400">{activeThread.otherEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No messages yet. Say hello! 👋
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${isMe
                ? 'bg-emerald-500 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
              }`}>
                {!isMe && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{msg.senderName}</p>}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 mt-4">
        <input
          type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/40 transition-all font-medium dark:text-white dark:placeholder-slate-500"
        />
        <button type="submit" disabled={sending || !text.trim()}
          className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default Chat;
