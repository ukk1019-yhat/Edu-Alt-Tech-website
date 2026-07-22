import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, MessageCircle, BookOpen, Shield, ChevronDown, GraduationCap, History, Maximize2, LogIn } from 'lucide-react';
import { sendAIChat, AIMode } from '../lib/ai';
import { auth, db, onAuthStateChanged, collection, query, where, getDocs, limit, addDoc, serverTimestamp } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

type ModeOption = {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const MODES: ModeOption[] = [
  { id: 'chat', label: 'General Chat', icon: <MessageCircle className="w-4 h-4" />, description: 'Ask anything about Edu-Alt-Tech' },
  { id: 'mentor', label: 'AI Mentor', icon: <GraduationCap className="w-4 h-4" />, description: 'Personalized learning guidance' },
  { id: 'course', label: 'Course Help', icon: <BookOpen className="w-4 h-4" />, description: 'Get help with courses' },
  { id: 'admin', label: 'Admin Tool', icon: <Shield className="w-4 h-4" />, description: 'Admin assistance' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [mentorContext, setMentorContext] = useState<string>('');
  const [courseCatalog, setCourseCatalog] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
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
        } catch (e) { console.error('AIAssistant: Failed to load user metrics', e); }

        try {
          const cSnap = await getDocs(collection(db, 'courses'));
          const courses: string[] = [];
          cSnap.forEach(d => {
            const data = d.data();
            courses.push(`- ${data.title} (${data.category || data.folder || 'General'}, ${data.level || 'all levels'}, ${data.duration || 'self-paced'}) — ${data.description?.slice(0, 120) || ''}`);
          });
          if (courses.length > 0) {
            setCourseCatalog(`Course Catalog:\n${courses.slice(0, 30).join('\n')}`);
          }
        } catch (e) { console.error('AIAssistant: Failed to load course catalog', e); }
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
        chat: 'Hello! I\'m Kyo Ai. I can help you find the right courses, study tips, or answer questions. What are you looking to learn?',
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
    } catch (e) { console.error('AIAssistant: Failed to save search history', e); }
  };

  const handleSend = async (extendMsg?: string) => {
    const msg = extendMsg || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    if (!extendMsg) setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

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
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <img src="/logo.png" alt="AI" loading="lazy" className="w-6 h-6 object-contain" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white :bg-gray-900 rounded-3xl border border-slate-200 :border-slate-700 shadow-2xl flex flex-col overflow-hidden max-h-[600px]">
          {!currentUser ? (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                <img src="/logo.png" alt="EduAltTech Logo" loading="lazy" className="w-10 h-10 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 :text-white mb-2">Sign in to use Kyo Ai</h3>
              <p className="text-sm text-slate-500 :text-slate-400 mb-6 max-w-[240px]">Your AI learning assistant is just a login away</p>
              <button
                onClick={() => { setIsOpen(false); navigate('/login'); }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 :hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 :text-slate-500" />
              </button>
            </div>
          ) : (
          <><div className="p-4 border-b border-slate-100 :border-slate-700 flex items-center justify-between bg-slate-50 :bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="AI" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 :text-white">Kyo Ai</span>
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowModePicker(!showModePicker)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 :text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {currentMode?.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showModePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white :bg-gray-800 rounded-xl border border-slate-200 :border-slate-700 shadow-xl p-1 z-10 min-w-[200px]">
                      {MODES.map(m => (
                        <button
                          key={m.id}
                          onClick={() => switchMode(m.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m.id ? 'bg-emerald-50 :bg-emerald-900/20 text-emerald-600 ' : 'text-slate-600 :text-slate-300 hover:bg-slate-50 :hover:bg-slate-700'}`}
                        >
                          {m.icon}
                          <div className="text-left">
                            <span className="block">{m.label}</span>
                            <span className="block text-[9px] font-medium text-slate-400 :text-slate-400">{m.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/search-history"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 :bg-slate-800 rounded-xl transition-colors"
                title="Search History"
              >
                <History className="w-4 h-4 text-slate-400 :text-slate-400" />
              </Link>
              <Link
                to="/ai"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 :bg-slate-800 rounded-xl transition-colors"
                title="Open Full Page"
              >
                <Maximize2 className="w-4 h-4 text-slate-400 :text-slate-400" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 :bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 :text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-slate-100 :bg-gray-700 text-slate-700 :text-slate-200 rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
                {msg.role === 'assistant' && !loading && i === messages.length - 1 && (
                  <div className="flex justify-start ml-2 mt-1">
                    <button
                      onClick={() => handleSend("Please elaborate more on your previous response and provide more details.")}
                      className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 :hover:bg-emerald-900/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      + Extend
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 :bg-gray-700 rounded-2xl rounded-bl-md p-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-slate-100 :border-slate-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Kyo Ai anything..."
                disabled={loading}
                className="flex-1 p-3 bg-slate-50 :bg-gray-800 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-emerald-500 transition-colors disabled:opacity-50 :text-white"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )}
</>
  );
};

export default AIAssistant;
