import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, onAuthStateChanged, collection, getDocs, query, orderBy, limit } from '../lib/firebase';
import type { User } from '../lib/firebase';
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
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<StudentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'risk' | 'engagement' | 'activity'>('risk');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && (u.email === 'ukkukk97@gmail.com' || u.email === 'umakrishnakanthchokkapu15@gmail.com')) {
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

      setStudents(studentList);
    } catch (e) {
      console.error('Failed to load insights', e);
    }
  };

  const atRiskCount = useMemo(() => students.filter(s => s.risk === 'high').length, [students]);
  const stableCount = useMemo(() => students.filter(s => s.risk === 'low').length, [students]);

  const sortedStudents = useMemo(() => {
    const list = [...students];
    if (sortBy === 'risk') list.sort((a, b) => { const order = { high: 0, medium: 1, low: 2 }; return order[a.risk] - order[b.risk]; });
    else if (sortBy === 'activity') list.sort((a, b) => b.activityCount - a.activityCount);
    else list.sort((a, b) => {
      const aEng = a.metrics.reduce((s, m) => s + (m.engagementScore || 0), 0) / (a.metrics.length || 1);
      const bEng = b.metrics.reduce((s, m) => s + (m.engagementScore || 0), 0) / (b.metrics.length || 1);
      return bEng - aEng;
    });
    return list;
  }, [students, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col gap-16">
        <div className="skeleton skeleton-title" style={{ width: 180 }} />
        <div className="skeleton skeleton-text" style={{ width: 240 }} />
        <div className="grid-3">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
        <div className="skeleton skeleton-card" style={{ height: 320 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-16 mb-24">
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary flex items-center gap-2">
          Back
        </button>
      </div>

      <div className="page-header">
            <div className="flex items-center gap-12">
          <div style={{ width: 48, height: 48, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>

          </div>
          <div>
            <h1>Behavior Analysis</h1>
            <p>Student engagement patterns and dropout risk detection</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3">
        <div className="bento-card">
          <div className="flex items-center gap-3 mb-2">

            <span className="flabel">Total Students</span>
          </div>
          <div className="stat-value">{students.length}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 mb-2">

            <span className="flabel">At Risk</span>
          </div>
          <div className="stat-value" style={{ color: atRiskCount > 0 ? 'var(--warn)' : 'inherit' }}>{atRiskCount}</div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3 mb-2">

            <span className="flabel">On Track</span>
          </div>
          <div className="stat-value">{stableCount}</div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 mb-24 flex-wrap">
        {[
          { key: 'risk', label: 'Risk Level' },
          { key: 'engagement', label: 'Engagement' },
          { key: 'activity', label: 'Activity' },
        ].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key as any)}
            className="btn btn-sm"
            style={{
              background: sortBy === s.key ? 'var(--accent)' : 'transparent',
              color: sortBy === s.key ? '#fff' : 'var(--ink)',
              borderColor: sortBy === s.key ? 'var(--accent)' : 'var(--ink)',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >{s.label}</button>
        ))}
      </div>

      {/* Student Table */}
      {sortedStudents.length > 0 ? (
        <div className="bento-card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Engagement</th>
                  <th>Activities</th>
                  <th>Avg Score</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s, i) => {
                  const avgScore = s.metrics.length ? Math.round(s.metrics.reduce((sum, m) => sum + (m.avgScore || 0), 0) / s.metrics.length) : 0;
                  const avgEngagement = s.metrics.length ? Math.round(s.metrics.reduce((sum, m) => sum + (m.engagementScore || 0), 0) / s.metrics.length) : 0;
                  const statusColor = s.activityCount > 10 ? 'var(--accent)' : s.activityCount > 3 ? 'var(--warn)' : 'var(--ink-mute)';
                  const riskColor = s.risk === 'low' ? 'var(--accent)' : s.risk === 'medium' ? 'var(--warn)' : '#e11d48';
                  return (
                    <tr key={s.uid}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, border: '2px solid var(--ink)', background: 'var(--accent-soft)' }}>
                            <span className="font-semibold">{i + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <span className="flabel">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ color: statusColor, borderColor: statusColor }}>
                          {s.activityCount > 10 ? 'Active' : s.activityCount > 3 ? 'Intermittent' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 80, height: 8, background: 'var(--ink)', flexShrink: 0 }}>
                            <div style={{ width: `${avgEngagement}%`, height: '100%', background: avgEngagement > 60 ? 'var(--accent)' : avgEngagement > 30 ? 'var(--warn)' : '#e11d48' }} />
                          </div>
                          <span className="flabel">{avgEngagement}%</span>

                        </div>
                      </td>
                      <td><span className="font-semibold">{s.activityCount}</span></td>
                      <td>
                        <span className="font-semibold" style={{ color: avgScore > 60 ? 'var(--accent)' : 'var(--warn)' }}>{avgScore}%</span>
                      </td>
                      <td>
                        <span className="badge" style={{ color: riskColor, borderColor: riskColor }}>
                          {s.risk === 'low' ? 'On Track' : s.risk === 'medium' ? 'Attention' : 'At Risk'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">

          <h3>No student data yet</h3>
          <p>Enrollments and activity data will appear here once students start learning.</p>
        </div>
      )}
    </div>
  );
};

export default BehaviorInsights;
