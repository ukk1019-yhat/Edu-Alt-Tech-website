import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Users, Activity, Clock, ArrowLeft, AlertTriangle, BarChart3, Target } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserMetrics, UserActivity } from '../types';
import { useNavigate } from 'react-router-dom';

interface StudentInsight {
  uid: string;
  name: string;
  email: string;
  metrics: UserMetrics[];
  activityCount: number;
  lastActive: string;
  risk: 'low' | 'medium' | 'high';
}

const BehaviorInsights: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [students, setStudents] = useState<StudentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'risk' | 'engagement' | 'activity'>('risk');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && u.email === 'viranadeep@gmail.com') {
        await loadInsights();
      } else if (u) {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadInsights = async () => {
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      const users = uSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

      const mMeta = await getDocs(query(collection(db, 'user_metrics'), orderBy('engagementScore', 'desc'), limit(100)));
      const allMetrics: Record<string, UserMetrics[]> = {};
      mMeta.forEach(d => {
        const data = d.data() as UserMetrics;
        if (!allMetrics[data.userId]) allMetrics[data.userId] = [];
        allMetrics[data.userId].push(data);
      });

      const aSnap = await getDocs(query(collection(db, 'user_activities'), orderBy('timestamp', 'desc'), limit(500)));
      const activityCounts: Record<string, number> = {};
      const lastActive: Record<string, string> = {};
      aSnap.forEach(d => {
        const data = d.data() as UserActivity;
        activityCounts[data.userId] = (activityCounts[data.userId] || 0) + 1;
        if (!lastActive[data.userId] || data.timestamp > lastActive[data.userId]) {
          lastActive[data.userId] = data.timestamp;
        }
      });

      const studentList: StudentInsight[] = users.map((u: any) => {
        const userMetrics = allMetrics[u.uid] || [];
        const avgEngagement = userMetrics.length ? userMetrics.reduce((s, m) => s + (m.engagementScore || 0), 0) / userMetrics.length : 0;
        const metrics = userMetrics;
        const risk: 'low' | 'medium' | 'high' = avgEngagement < 30 ? 'high' : avgEngagement < 60 ? 'medium' : 'low';
        return {
          uid: u.uid,
          name: u.name || 'Unknown',
          email: u.email || '',
          metrics,
          activityCount: activityCounts[u.uid] || 0,
          lastActive: lastActive[u.uid] || '',
          risk,
        };
      });

      if (sortBy === 'risk') studentList.sort((a, b) => { const order = { high: 0, medium: 1, low: 2 }; return order[a.risk] - order[b.risk]; });
      else if (sortBy === 'activity') studentList.sort((a, b) => b.activityCount - a.activityCount);
      else studentList.sort((a, b) => {
        const aEng = a.metrics.reduce((s, m) => s + (m.engagementScore || 0), 0) / (a.metrics.length || 1);
        const bEng = b.metrics.reduce((s, m) => s + (m.engagementScore || 0), 0) / (b.metrics.length || 1);
        return bEng - aEng;
      });

      setStudents(studentList);
    } catch (e) {
      console.error('Failed to load insights', e);
    }
  };

  const atRiskCount = students.filter(s => s.risk === 'high').length;
  const stableCount = students.filter(s => s.risk === 'low').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Brain className="w-12 h-12 text-emerald-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 dark:bg-[#020617] selection:bg-emerald-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Behavior Analysis</h1>
            </div>
            <p className="text-slate-500 font-medium">Student engagement patterns and dropout risk detection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <Users className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-3xl font-black mb-1">{students.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Students</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
            <p className="text-3xl font-black mb-1">{atRiskCount}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">At Risk</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <Target className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-3xl font-black mb-1">{stableCount}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Track</p>
          </motion.div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'risk', label: 'Risk Level', icon: AlertTriangle },
            { key: 'engagement', label: 'Engagement', icon: Activity },
            { key: 'activity', label: 'Activity', icon: Clock },
          ].map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                sortBy === s.key ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
              }`}
            ><s.icon className="w-4 h-4" /> {s.label}</button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Activities</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Score</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s, i) => {
                  const avgScore = s.metrics.length ? Math.round(s.metrics.reduce((sum, m) => sum + (m.avgScore || 0), 0) / s.metrics.length) : 0;
                  const avgEngagement = s.metrics.length ? Math.round(s.metrics.reduce((sum, m) => sum + (m.engagementScore || 0), 0) / s.metrics.length) : 0;
                  return (
                    <tr key={s.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">{i + 1}</span>
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${s.activityCount > 10 ? 'bg-emerald-500' : s.activityCount > 3 ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-bold text-slate-500">{s.activityCount > 10 ? 'Active' : s.activityCount > 3 ? 'Intermittent' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${avgEngagement >= 60 ? 'bg-emerald-500' : avgEngagement >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${avgEngagement}%` }} />
                          </div>
                          <span className="text-xs font-bold">{avgEngagement}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold">{s.activityCount}</td>
                      <td className="px-8 py-5">
                        <span className={`font-black ${avgScore >= 70 ? 'text-emerald-500' : avgScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{avgScore}%</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          s.risk === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          s.risk === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>{s.risk}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorInsights;
