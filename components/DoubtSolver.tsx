import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from 'lucide-react';
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
    <>
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[500px]"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Doubt Solver</span>
                  <span className="block text-[10px] font-bold text-slate-400">{courseTitle || 'AI Tutor'}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[350px]">
              {!asked ? (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Ask any doubt about this course. I'll explain with examples.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] p-3 bg-indigo-500 text-white rounded-2xl rounded-br-md text-sm">
                      {question}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-md text-sm whitespace-pre-wrap">
                      {answer}
                    </div>
                  </div>
                </div>
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <input value={question} onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
                  placeholder="Type your doubt..." disabled={loading}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-indigo-500 transition-all"
                />
                <button onClick={handleAsk} disabled={loading || !question.trim()}
                  className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DoubtSolver;
