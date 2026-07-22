import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Loader2, MessageCircle, BookOpen, Shield, ChevronDown, GraduationCap, History, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { sendAIChat, AIMode } from '../lib/ai';
import { auth, db, onAuthStateChanged, collection, query, where, getDocs, getDoc, doc, orderBy, limit, addDoc, serverTimestamp, deleteDoc } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const MODES: { id: AIMode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: 'chat', label: 'General Chat', icon: <MessageCircle className="w-4 h-4" />, description: 'Ask anything about Edu-Alt-Tech', color: 'emerald' },
  { id: 'mentor', label: 'AI Mentor', icon: <GraduationCap className="w-4 h-4" />, description: 'Personalized learning guidance', color: 'blue' },
  { id: 'course', label: 'Course Help', icon: <BookOpen className="w-4 h-4" />, description: 'Get help with courses', color: 'purple' },
  { id: 'admin', label: 'Admin Tool', icon: <Shield className="w-4 h-4" />, description: 'Admin assistance', color: 'orange' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AI: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [mentorContext, setMentorContext] = useState<string>('');
  const [courseCatalog, setCourseCatalog] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [, setUserProfile] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = MODES.find(m => m.id === mode);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/login'); return; }
      setCurrentUser(u);
      try {
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) setUserProfile(docSnap.data());
      } catch (e) { console.error('AI: Failed to load user profile', e); }

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
      } catch (e) { console.error('AI: Failed to load user metrics', e); }

      try {
        const cSnap = await getDocs(collection(db, 'courses'));
        const courses: string[] = [];
        cSnap.forEach(d => {
          const data = d.data();
          courses.push(`- ${data.title} (${data.category || data.folder || 'General'}, ${data.level || 'all levels'}, ${data.duration || 'self-paced'}) - ${data.description?.slice(0, 120) || ''}`);
        });
        if (courses.length > 0) {
          setCourseCatalog(`Course Catalog:\n${courses.slice(0, 30).join('\n')}`);
        }
      } catch (e) { console.error('AI: Failed to load course catalog', e); }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: `Hello! I'm Kyo Ai. I can help you find courses, study tips, or answer questions. Select a mode below to get started.` }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const saveToHistory = async (query: string, response: string, modeUsed: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'ai_search_history'), {
        userId: currentUser.uid,
        query,
        response,
        mode: modeUsed,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error('AI: Failed to save search history', e); }
  };

  const loadHistory = async () => {
    if (!currentUser) return;
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, 'ai_search_history'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        items.push({ id: d.id, ...data });
      });
      setHistoryItems(items);
    } catch (e) { console.error('AI: Failed to load search history', e); }
    setHistoryLoading(false);
  };

  const handleSend = async (extendMsg?: string) => {
    const msg = extendMsg || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    if (!extendMsg) setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      let augmentedMessage = msg;
      if (mode === 'mentor' && mentorContext) {
        augmentedMessage = `${mentorContext}\n\nStudent says: ${msg}`;
      }
      if ((mode === 'course' || mode === 'chat' || mode === 'mentor') && courseCatalog) {
        augmentedMessage = `${courseCatalog}\n\nUser question/request: ${msg}`;
      }
      const res = await sendAIChat(augmentedMessage, mode, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
      saveToHistory(msg, res.content, mode);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message || 'Please try again.'}` }]);
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

  const loadConversation = (item: any) => {
    setMessages([
      { role: 'user', content: item.query },
      { role: 'assistant', content: item.response }
    ]);
    setMode(item.mode || 'chat');
    setShowSidebar(false);
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ai_search_history', id));
      setHistoryItems(prev => prev.filter(h => h.id !== id));
    } catch (e) { console.error('AI: Failed to delete history item', e); }
  };

  const startNewChat = () => {
    setMessages([]);
    setShowSidebar(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Kyo Ai</h1>
            <p className="text-[10px] font-semibold text-slate-400">AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowModePicker(!showModePicker)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
            >
              {currentMode?.icon}
              {currentMode?.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showModePicker && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-10 min-w-[200px]">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => switchMode(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${mode === m.id ? `bg-${m.color}-50 text-${m.color}-600` : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {m.icon}
                    <div className="text-left">
                      <span className="block">{m.label}</span>
                      <span className="block text-[9px] font-medium text-slate-400">{m.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setShowSidebar(!showSidebar); if (!showSidebar) loadHistory(); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="History">
            <History className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-slate-200 bg-white/50 overflow-y-auto shrink-0"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4" /> History
                </h2>
                <button onClick={startNewChat} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  + New Chat
                </button>
              </div>
              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : historyItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No history yet</p>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div key={item.id} className="group">
                      <button
                        onClick={() => loadConversation(item)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {MODES.find(m => m.id === item.mode)?.icon || <MessageCircle className="w-3 h-3" />}
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{item.mode || 'chat'}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 line-clamp-2">{item.query}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {messages.length === 1 && messages[0]?.role === 'assistant' && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-black text-slate-800 mb-2">How can I help you today?</h2>
                <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
                  Ask me about courses, learning topics, study strategies, or platform features.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['Recommend me a course', 'Help me study', 'Explain a concept', 'Create a learning plan'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-white text-slate-700 rounded-bl-md border border-slate-200 shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
                {msg.role === 'assistant' && !loading && i === messages.length - 1 && (
                  <div className="flex justify-start ml-2 mt-1.5">
                    <button
                      onClick={() => handleSend("Please elaborate more on your previous response and provide more details.")}
                      className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      + Extend
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md p-4 border border-slate-200 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-white/50">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Kyo Ai anything..."
                disabled={loading}
                rows={1}
                className="flex-1 p-3.5 bg-slate-50 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-emerald-500 transition-colors disabled:opacity-50 resize-none min-h-[48px] max-h-[120px]"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">
              Kyo Ai can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AI;
