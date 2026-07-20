import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db, onAuthStateChanged, collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from '../lib/firebase';
import { Search, Trash2, MessageCircle, BookOpen, Shield, GraduationCap, ArrowLeft, Clock } from 'lucide-react';
import HamsterLoader from '../components/HamsterLoader';

interface HistoryItem {
  id: string;
  query: string;
  response: string;
  mode: string;
  createdAt: string;
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageCircle className="w-3.5 h-3.5" />,
  course: <BookOpen className="w-3.5 h-3.5" />,
  admin: <Shield className="w-3.5 h-3.5" />,
  mentor: <GraduationCap className="w-3.5 h-3.5" />,
};

const SearchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setUser] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/login'); return; }
      setUser(u);
      try {
        const q = query(
          collection(db, 'ai_search_history'),
          where('userId', '==', u.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        const items: HistoryItem[] = [];
        snap.forEach(d => {
          const data = d.data();
          items.push({
            id: d.id,
            query: data.query || '',
            response: data.response || '',
            mode: data.mode || 'chat',
            createdAt: data.createdAt || data.created_at || '',
          });
        });
        setHistory(items);
      } catch (e) { console.error('SearchHistory: Failed to load search history', e); }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ai_search_history', id));
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) { console.error('SearchHistory: Failed to delete history item', e); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all search history?')) return;
    for (const item of history) {
      try { await deleteDoc(doc(db, 'ai_search_history', item.id)); } catch (e) { console.error('SearchHistory: Failed to clear history item', e); }
    }
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Search className="w-6 h-6 text-emerald-500" />
                Search History
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Your AI assistant conversations</p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
            >
              Clear All
            </button>
          )}
        </motion.div>

        {loading ? (
          <HamsterLoader />
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="text-center py-20 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm"
          >
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No history yet</h3>
            <p className="text-sm text-slate-400 font-medium">Your AI assistant conversations will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.03 } }}
                className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="p-1 bg-slate-100 rounded-lg text-slate-500">
                          {MODE_ICONS[item.mode] || <MessageCircle className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.mode}</span>
                        {item.createdAt && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.query}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
                {expandedId === item.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="h-px bg-slate-100 mb-3" />
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Response</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.response}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
