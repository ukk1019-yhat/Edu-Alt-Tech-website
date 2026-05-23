import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { Send, Hash, MessageCircle, User, Loader2, Search } from 'lucide-react';
import { Course, UserObject } from '../types';

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
  const [activeTab, setActiveTab] = useState<'community' | 'direct'>('community');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  
  // Mentor Specific
  const [students, setStudents] = useState<{uid: string, name: string}[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch student list if mentor
  useEffect(() => {
    if (role === 'teacher') {
      const fetchStudents = async () => {
        const eQ = query(collection(db, 'enrollments'), where('courseId', '==', courseId), where('role', '==', 'student'));
        const eSnap = await getDocs(eQ);
        const sIds = eSnap.docs.map(d => d.data().userId);
        
        if (sIds.length > 0) {
          // Chunk to handle Firestore 'in' limit
          const uQ = query(collection(db, 'users'), where('__name__', 'in', sIds.slice(0, 10)));
          const uSnap = await getDocs(uQ);
          const sList = uSnap.docs.map(d => ({ uid: d.id, name: d.data().name || 'Student' }));
          setStudents(sList);
          if (sList.length > 0 && !selectedStudentId) {
            setSelectedStudentId(sList[0].uid);
          }
        }
      };
      fetchStudents();
    }
  }, [role, courseId]);

  // Initialize or Fetch Chat ID
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        if (activeTab === 'community') {
          const chatQ = query(collection(db, 'chats'), where('courseId', '==', courseId), where('type', '==', 'community'));
          const snap = await getDocs(chatQ);
          if (snap.empty) {
            const newChat = await addDoc(collection(db, 'chats'), {
              courseId,
              type: 'community',
              participants: [],
              createdAt: serverTimestamp()
            });
            setChatId(newChat.id);
          } else {
            setChatId(snap.docs[0].id);
          }
        } else {
          // Direct Message Logic
          const targetId = role === 'teacher' ? selectedStudentId : mentorId;
          if (!targetId) { setChatId(null); return; }

          const participants = [currentUser.uid, targetId].sort();
          const chatQ = query(collection(db, 'chats'), where('participants', '==', participants), where('type', '==', 'direct'));
          const snap = await getDocs(chatQ);
          if (snap.empty) {
            const newChat = await addDoc(collection(db, 'chats'), {
              participants,
              type: 'direct',
              courseId,
              createdAt: serverTimestamp()
            });
            setChatId(newChat.id);
          } else {
            setChatId(snap.docs[0].id);
          }
        }
      } catch (err) {
        console.error("Chat init error", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [courseId, activeTab, currentUser.uid, mentorId, role, selectedStudentId]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const msgQ = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(msgQ, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Send error", err);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      {/* Sidebar / Tabs */}
      <div className="flex bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-3">
        <button 
          onClick={() => setActiveTab('community')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'community' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
        >
          <Hash className="w-4 h-4" /> Course Channel
        </button>
        <button 
          onClick={() => setActiveTab('direct')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'direct' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
        >
          <MessageCircle className="w-4 h-4" /> {role === 'teacher' ? 'Private DMs' : 'DM Mentor'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mentor's Student List Sidebar */}
        {role === 'teacher' && activeTab === 'direct' && (
          <div className="w-64 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
             <div className="p-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Active Students</h4>
                <div className="space-y-1">
                   {students.map(s => (
                     <button 
                       key={s.uid}
                       onClick={() => setSelectedStudentId(s.uid)}
                       className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-2 ${selectedStudentId === s.uid ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                     >
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-xs font-bold truncate">{s.name}</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
          {/* identity Header */}
          <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
               </div>
               <div>
                  <h4 className="text-sm font-bold truncate">
                    {activeTab === 'community' ? 'Course Broadcast' : (role === 'teacher' ? (students.find(s => s.uid === selectedStudentId)?.name || 'Select Student') : 'Course Mentor')}
                  </h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {activeTab === 'community' ? 'Whole Students Channel' : (role === 'teacher' ? 'Student Participant' : 'Primary Instructor')}
                  </p>
               </div>
            </div>
            {activeTab === 'community' && role === 'teacher' && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Instructor Mode
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (!chatId && activeTab === 'direct') ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 text-center p-8">
                 <Search className="w-12 h-12 opacity-20" />
                 <p className="text-sm font-medium">Select a student from the sidebar to start a direct conversation.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                 <MessageCircle className="w-12 h-12" />
                 <p className="text-sm font-medium">Start the conversation...</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.uid;
                const showName = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showName && !isMe && (
                      <div className="flex items-center gap-2 ml-2 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                        {msg.senderId === mentorId && (
                          <span className="text-[8px] font-black text-emerald-500 border border-emerald-500/30 px-1.5 rounded uppercase">Mentor</span>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-slate-900 text-white dark:bg-emerald-600 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                       {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          {(chatId || activeTab === 'community') && (
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:text-white text-sm transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 disabled:opacity-50 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseChat;

