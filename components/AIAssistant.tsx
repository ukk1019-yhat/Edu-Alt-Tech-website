import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <img src="/logo.png" alt="AI" loading="lazy" className="w-6 h-6 object-contain" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white :bg-gray-900 rounded-3xl border border-slate-200 :border-slate-700 shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 :border-slate-700 flex items-center justify-between bg-slate-50 :bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="AI" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 :text-white">Kyo Ai</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 :hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-slate-400 :text-slate-500" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[320px]">
            <div className="w-16 h-16 bg-emerald-100 :bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 :text-white mb-2">AI Services Coming Soon</h3>
            <p className="text-sm text-slate-500 :text-slate-400 max-w-[260px] leading-relaxed">
              We're building something amazing. Kyo Ai will be available with personalized mentoring, course help, and more.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
