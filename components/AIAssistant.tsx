import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, MessageCircle, BookOpen, Shield, ChevronDown, Sparkles } from 'lucide-react';
import { sendAIChat, AIMode } from '../lib/ai';

type ModeOption = {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const MODES: ModeOption[] = [
  { id: 'chat', label: 'General Chat', icon: <MessageCircle className="w-4 h-4" />, description: 'Ask anything about Edu-Alt-Tech' },
  { id: 'course', label: 'Course Help', icon: <BookOpen className="w-4 h-4" />, description: 'Get help with courses' },
  { id: 'admin', label: 'Admin Tool', icon: <Shield className="w-4 h-4" />, description: 'Admin assistance' },
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      const res = await sendAIChat(userMsg.content, mode, history);
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
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">EduAI</span>
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowModePicker(!showModePicker)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {currentMode?.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showModePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-1 z-10 min-w-[200px]">
                      {MODES.map(m => (
                        <button
                          key={m.id}
                          onClick={() => switchMode(m.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
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
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md p-4">
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

          {/* Input */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask EduAI anything..."
                disabled={loading}
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-emerald-500 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
