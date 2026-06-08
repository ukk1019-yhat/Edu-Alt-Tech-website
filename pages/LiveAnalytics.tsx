import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Award, BookOpen, Brain, ArrowLeft, Activity, Users, Target } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserMetrics, UserActivity, QuizAttempt } from '../types';
import { useNavigate } from 'react-router-dom';

const LiveAnalytics: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'student' | 'admin'>('student');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  const isAdmin = user?.email === 'viranadeep@gmail.com';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadData(u);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadData = async (u: FirebaseUser) => {
    try {
      const metricsList: UserMetrics[] = [];
      const mQ = query(collection(db, 'user_metrics'), where('userId', '==', u.uid));
      const mSnap = await getDocs(mQ);
      mSnap.forEach(d => metricsList.push({ id: d.id, ...d.data() } as unknown as UserMetrics));
      setMetrics(metricsList);

      const aQ = query(collection(db, 'user_activities'), where('userId', '==', u.uid), orderBy('timestamp', 'desc'), limit(20));
      const aSnap = await getDocs(aQ);
      setRecentActivities(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity)));

      const qQ = query(collection(db, 'quiz_attempts'), where('userId', '==', u.uid), orderBy('completedAt', 'desc'), limit(10));
      const qSnap = await getDocs(qQ);
      setRecentQuizzes(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt)));

      if (u.email === 'viranadeep@gmail.com') {
        const uSnap = await getDocs(collection(db, 'users'));
        setAllUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  };

  const aggregateMetric = (key: keyof UserMetrics): number => {
    const vals = metrics.map(m => Number(m[key]) || 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <BarChart3 className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 dark:bg-[#020617] selection:bg-emerald-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Live Analytics</h1>
            </div>
            <p className="text-slate-500 font-medium">Real-time learning metrics and insights</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setView('student')} className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${view === 'student' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}>My Stats</button>
              <button onClick={() => setView('admin')} className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${view === 'admin' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Platform</button>
            </div>
          )}
        </div>

        {view === 'admin' && isAdmin ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Users, label: 'Total Users', value: allUsers.length, color: 'blue' },
                { icon: BookOpen, label: 'Active Courses', value: metrics.length, color: 'emerald' },
                { icon: Brain, label: 'Avg Score', value: `${aggregateMetric('avgScore')}%`, color: 'purple' },
                { icon: Target, label: 'Engagement', value: `${aggregateMetric('engagementScore')}%`, color: 'amber' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                  </div>
                  <p className="text-3xl font-black mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" /> User Activity Overview
              </h3>
              <div className="space-y-3">
                {allUsers.slice(0, 10).map((u, i) => (
                  <div key={u.uid} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-black">{i + 1}</span>
                      <span className="font-bold text-sm">{u.name || 'User'}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Brain, label: 'Avg Score', value: `${aggregateMetric('avgScore')}%`, color: 'emerald' },
                { icon: Clock, label: 'Total Hours', value: `${Math.round(aggregateMetric('totalTimeSpent') / 3600)}h`, color: 'blue' },
                { icon: Award, label: 'Quizzes Taken', value: aggregateMetric('quizAttempts'), color: 'purple' },
                { icon: Activity, label: 'Engagement', value: `${aggregateMetric('engagementScore')}%`, color: 'amber' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                  </div>
                  <p className="text-3xl font-black mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {recentQuizzes.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Brain className="w-5 h-5 text-emerald-500" /> Recent Quizzes</h3>
                <div className="space-y-3">
                  {recentQuizzes.map((q, i) => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-black">{i + 1}</span>
                        <span className="font-bold text-sm">{q.title}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-500">{q.score}/{q.totalQuestions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentActivities.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" /> Recent Activity</h3>
                <div className="space-y-2">
                  {recentActivities.map(a => (
                    <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <span className={`w-2 h-2 rounded-full ${a.type === 'quiz_attempt' ? 'bg-emerald-500' : a.type === 'module_complete' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                      <span className="text-sm font-medium capitalize">{a.type.replace('_', ' ')}</span>
                      {a.courseId && <span className="text-xs text-slate-400">{a.courseId.slice(0, 8)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentActivities.length === 0 && recentQuizzes.length === 0 && (
              <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-black text-slate-400">No Analytics Data Yet</p>
                <p className="text-slate-500 text-sm mt-2">Start taking quizzes and completing modules to see your stats.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAnalytics;
