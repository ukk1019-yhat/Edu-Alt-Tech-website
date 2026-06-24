import React, { useState, useEffect, useCallback } from 'react';

import { getLearningPath, generateLearningPath, updateModuleStatus } from '../lib/learningPath';
import { auth, onAuthStateChanged } from '../lib/firebase';
import type { User } from '../lib/firebase';
import type { LearningPath, AdaptiveLevel } from '../types';
import { trackActivity } from '../lib/analytics';

interface LearningPathViewProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
}

const CACHE_KEY = (courseId: string) => `roadmap_${courseId}`;

const LearningPathView: React.FC<LearningPathViewProps> = ({ courseId, courseTitle, courseDescription }) => {
  const [path, setPath] = useState<LearningPath | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY(courseId));
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!path);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<AdaptiveLevel>('beginner');
  const [showSetup, setShowSetup] = useState(!path);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const existing = await getLearningPath(u.uid, courseId);
        if (existing) {
          setPath(existing);
          localStorage.setItem(CACHE_KEY(courseId), JSON.stringify(existing));
          setShowSetup(false);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [courseId]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    setError('');
    try {
      const newPath = await generateLearningPath(user.uid, courseId, courseTitle, courseDescription, goal || 'Complete the course', level);
      setPath(newPath);
      localStorage.setItem(CACHE_KEY(courseId), JSON.stringify(newPath));
      setShowSetup(false);
      await trackActivity(user.uid, 'mentor_session', courseId, { action: 'roadmap_generated', goal });
    } catch (e) {
      setError('AI generation failed. Using default roadmap.');
      const fallback: LearningPath = {
        id: `${user.uid}_${courseId}`,
        userId: user.uid,
        courseId,
        goal: goal || 'Complete the course',
        modules: [
          { moduleId: 'm1', title: 'Introduction & Setup', description: 'Get started with the fundamentals', order: 1, status: 'pending', estimatedHours: 1 },
          { moduleId: 'm2', title: 'Core Concepts', description: 'Learn the essential building blocks', order: 2, status: 'pending', estimatedHours: 2 },
          { moduleId: 'm3', title: 'Hands-On Practice', description: 'Apply what you learned with exercises', order: 3, status: 'pending', estimatedHours: 3 },
          { moduleId: 'm4', title: 'Advanced Topics', description: 'Deep dive into complex subjects', order: 4, status: 'pending', estimatedHours: 3 },
          { moduleId: 'm5', title: 'Final Project', description: 'Build something real to showcase your skills', order: 5, status: 'pending', estimatedHours: 4 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentDifficulty: level,
      };
      setPath(fallback);
      localStorage.setItem(CACHE_KEY(courseId), JSON.stringify(fallback));
      setShowSetup(false);
    } finally {
      setGenerating(false);
    }
  }, [user, courseId, courseTitle, courseDescription, goal, level]);

  const toggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    if (!user || !path) return;
    const newStatus = currentStatus === 'completed' ? 'pending' : currentStatus === 'in_progress' ? 'completed' : 'in_progress';
    await updateModuleStatus(user.uid, courseId, moduleId, newStatus);
    setPath(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        modules: prev.modules.map(m => m.moduleId === moduleId ? { ...m, status: newStatus as any } : m),
      };
      localStorage.setItem(CACHE_KEY(courseId), JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="bento-card" style={{ gap: '16px' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div className="asc-sm" />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '50%' }} />
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const completedModules = path?.modules.filter(m => m.status === 'completed').length || 0;
  const totalModules = path?.modules.length || 0;
  const progressPercent = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

  return (
    <div>
      {showSetup ? (
        <div className="bento-card" style={{ gap: '20px', maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)' }}>

            </div>
            <h3>Personalized Roadmap</h3>
          </div>
          <p>AI will create a step-by-step learning plan tailored to your goals.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Your Learning Goal</label>
              <input className="input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Master the basics and build a project" />
            </div>
            <div className="form-group">
              <label className="form-label">Current Level</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['beginner', 'intermediate', 'advanced'] as AdaptiveLevel[]).map(l => (
                  <button
                    key={l}
                    className={`btn btn-sm ${level === l ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLevel(l)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate My Roadmap'}
            </button>
          </div>
        </div>
      ) : path ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  
                <h4 style={{ margin: 0 }}>Your Roadmap</h4>
                {error && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{error}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="flabel" style={{ fontSize: '0.7rem' }}>

                {path.currentDifficulty}
              </div>
              <span className="badge" style={{ fontSize: '0.7rem' }}>{completedModules}/{totalModules} modules</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowSetup(true)}>
                Regenerate
              </button>
            </div>
          </div>

          <div className="path-track">
            {path.modules.map((mod, i) => {
              const statusClass = mod.status === 'completed' ? 'completed' : mod.status === 'in_progress' ? 'active' : '';
              return (
                <div
                  key={mod.moduleId}
                  className={`path-step ${statusClass}`}
                  onClick={() => toggleModuleStatus(mod.moduleId, mod.status)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="path-step-body">
                    <div style={{ flex: 1 }}>
                      <div className="step-label">Step {i + 1}</div>
                      <div className="step-title">{mod.title}</div>
                      {mod.description && <div className="step-desc">{mod.description}</div>}
                    </div>
                    <div className="step-pct">
                      {mod.status === 'completed' ? '100%' : mod.status === 'in_progress' ? 'In Progress' : '0%'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Could not load roadmap. Try generating one.</p>
          <button className="btn btn-primary" onClick={() => setShowSetup(true)}>
            Generate Roadmap
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPathView;
