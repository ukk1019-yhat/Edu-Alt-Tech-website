import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, ChevronRight, Clock, Target, CheckCircle2, Circle, BookOpen, RotateCw } from 'lucide-react';
import { getLearningPath, generateLearningPath, updateModuleStatus } from '../lib/learningPath';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import type { LearningPath, AdaptiveLevel } from '../types';
import { trackActivity } from '../lib/analytics';

interface LearningPathViewProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
}

const LearningPathView: React.FC<LearningPathViewProps> = ({ courseId, courseTitle, courseDescription }) => {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<AdaptiveLevel>('beginner');
  const [showSetup, setShowSetup] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const existing = await getLearningPath(u.uid, courseId);
        if (existing) {
          setPath(existing);
          setShowSetup(false);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [courseId]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const newPath = await generateLearningPath(user.uid, courseId, courseTitle, courseDescription, goal || 'Complete the course', level);
      setPath(newPath);
      setShowSetup(false);
      await trackActivity(user.uid, 'mentor_session', courseId, { action: 'roadmap_generated', goal });
    } catch (e) {
      console.error('Failed to generate roadmap', e);
    } finally {
      setGenerating(false);
    }
  };

  const toggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    if (!user || !path) return;
    const newStatus = currentStatus === 'completed' ? 'pending' : currentStatus === 'in_progress' ? 'completed' : 'in_progress';
    await updateModuleStatus(user.uid, courseId, moduleId, newStatus);
    setPath(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules.map(m => m.moduleId === moduleId ? { ...m, status: newStatus as any } : m),
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const completedModules = path?.modules.filter(m => m.status === 'completed').length || 0;
  const totalModules = path?.modules.length || 0;
  const progressPercent = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <AnimatePresence mode="wait">
        {showSetup ? (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Personalized Roadmap</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-6">AI will create a step-by-step learning plan tailored to your goals.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Your Learning Goal</label>
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Master the basics and build a project" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Current Level</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as AdaptiveLevel[]).map(l => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={`flex-1 p-4 rounded-2xl font-bold text-sm capitalize transition-all ${
                        level === l ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate} disabled={generating} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generating ? 'Generating...' : 'Generate My Roadmap'}
              </button>
            </div>
          </motion.div>
        ) : path ? (
          <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-black tracking-tight">Your Roadmap</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{completedModules}/{totalModules} modules completed</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-500">{path.currentDifficulty}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <motion.div className="bg-emerald-500 h-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1 }} />
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {path.modules.map((mod, i) => (
                <motion.div key={mod.moduleId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                  onClick={() => toggleModuleStatus(mod.moduleId, mod.status)}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    mod.status === 'completed' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                    mod.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {mod.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                     mod.status === 'in_progress' ? <Circle className="w-4 h-4" /> : <span className="text-xs font-black">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${mod.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{mod.title}</p>
                    {mod.description && <p className="text-[10px] text-slate-400 font-medium truncate">{mod.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <Clock className="w-3 h-3" /> {mod.estimatedHours}h
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-500 font-medium">Could not load roadmap. Try generating one.</p>
            <button onClick={() => setShowSetup(true)} className="mt-4 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl">
              Generate Roadmap
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningPathView;
