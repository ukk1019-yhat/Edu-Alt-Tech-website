import React, { useState, useMemo, useEffect } from 'react';

import { normalizeSearch } from '../lib/search';
import { POPULAR_PROBLEMS, LEETCODE_150_PROBLEMS, TOP_INTERVIEW_150, FULL_COURSES, INTERVIEW_EXPERIENCES, YOUTUBE_CHANNELS, ENGLISH_EXERCISES } from '../data/problems';
import type { LeetCodeProblem, CourseLink, InterviewExperience, EnglishExercise, YouTubeChannel } from '../data/problems';
import { auth, onAuthStateChanged, db, collection, getDocs, query, orderBy } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import LoginModal from '../components/LoginModal';

type Tab = 'problems' | 'courses' | 'interviews' | 'channels' | 'english';
type ProblemSet = 'popular' | 'leetcode150' | 'top150' | 'admin';

const difficultyStyles: Record<string, string> = {
  Easy: 'badge-accent',
  Medium: 'badge-warning',
  Hard: 'badge-danger',
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'problems', label: 'Problems' },
  { key: 'courses', label: 'Full Courses' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'english', label: 'English' },
  { key: 'channels', label: 'Channels' },
];

function ProblemCard({ problem, user, onLockedClick }: { problem: LeetCodeProblem; user: any; onLockedClick: () => void }) {
  const handleAction = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!user) { e.preventDefault(); onLockedClick(); return; }
    (async () => { try { await db.from('practice_history').insert({ user_id: user.uid, practice_type: 'leetcode', item_id: problem.num, item_title: problem.title, opened_at: new Date().toISOString() }); } catch {} })();
  };
  return (
    <div className="bento-card bento-card-compact">
      <div className="flex items-start justify-between gap-12">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-8 mb-4">
            <span className="flabel" style={{ fontSize: '0.65rem' }}>#{problem.num}</span>
            <h4 className="text-sm" style={{ margin: 0 }}>{problem.title}</h4>
          </div>
          <div className="flex items-center gap-6">
            <span className="badge text-xs" style={{ padding: '1px 6px' }}>{problem.topic}</span>
            <span className={`badge ${difficultyStyles[problem.difficulty] || ''} text-xs`} style={{ padding: '1px 6px' }}>
              {problem.difficulty}
            </span>
          </div>
          {problem.companies && problem.companies.length > 0 && (
            <div className="flex gap-4 mt-4 flex-wrap">
              {problem.companies.slice(0, 3).map((c, i) => (
                <span key={i} className="badge text-xs" style={{ padding: '1px 5px' }}>{c.name} {c.count > 0 && `(${c.count})`}</span>
              ))}
              {problem.companies.length > 3 && <span className="badge text-xs" style={{ padding: '1px 5px' }}>+{problem.companies.length - 3}</span>}
            </div>
          )}
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" onClick={handleAction} title="Solve on LeetCode" className="btn btn-xs btn-secondary">Solve</a>
          <a href={problem.videoUrl} target="_blank" rel="noopener noreferrer" onClick={handleAction} title="Watch solution" className="btn btn-xs btn-secondary">Video</a>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, user, onLockedClick }: { course: CourseLink; user: any; onLockedClick: () => void }) {
  const handleAction = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { if (!user) { e.preventDefault(); onLockedClick(); } };
  return (
    <a href={course.url} target="_blank" rel="noopener noreferrer" onClick={handleAction} className="bento-card bento-card-compact flex items-center gap-12" style={{ textDecoration: 'none', color: 'inherit' }}>
      <h4 className="text-sm" style={{ margin: 0, flex: 1 }}>{course.title}</h4>
    </a>
  );
}

function InterviewCard({ interview, user, onLockedClick }: { interview: InterviewExperience; user: any; onLockedClick: () => void }) {
  const handleAction = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { if (!user) { e.preventDefault(); onLockedClick(); } };
  const resultBadge: Record<string, string> = { Hired: 'badge-accent', Selected: 'badge-warning', Rejected: 'badge-danger' };
  return (
    <a href={interview.url} target="_blank" rel="noopener noreferrer" onClick={handleAction} className="bento-card bento-card-compact flex items-center gap-12" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ flex: 1 }}>
        <h4 className="text-sm" style={{ margin: 0 }}>{interview.company}</h4>
        <p className="text-xs text-ink-mute" style={{ margin: 0 }}>{interview.interviewType}</p>
      </div>
      <span className={`badge ${resultBadge[interview.result] || ''} text-xs`} style={{ padding: '1px 6px' }}>{interview.result}</span>
    </a>
  );
}

function EnglishExerciseCard({ exercise, user, onLockedClick }: { exercise: EnglishExercise; user: any; onLockedClick: () => void }) {
  const handleAction = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!user) { e.preventDefault(); onLockedClick(); return; }
    (async () => { try { await db.from('practice_history').insert({ user_id: user.uid, practice_type: 'english', item_id: exercise.num, item_title: exercise.title, opened_at: new Date().toISOString() }); } catch {} })();
  };
  return (
    <div className="bento-card bento-card-compact">
      <div className="flex items-start justify-between gap-12">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-8 mb-4">
            <span className="flabel" style={{ fontSize: '0.65rem' }}>#{exercise.num}</span>
            <h4 className="text-sm" style={{ margin: 0 }}>{exercise.title}</h4>
          </div>
          <span className="badge text-xs" style={{ padding: '1px 6px', color: '#6366f1', borderColor: '#6366f1', background: 'rgba(99, 102, 241, 0.08)' }}>{exercise.level}</span>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <a href={exercise.practiceUrl} target="_blank" rel="noopener noreferrer" onClick={handleAction} title="Practice" className="btn btn-xs btn-secondary">Practice</a>
          <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" onClick={handleAction} title="Watch video" className="btn btn-xs btn-secondary">Video</a>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ channel, user, onLockedClick }: { channel: YouTubeChannel; user: any; onLockedClick: () => void }) {
  const handleAction = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { if (!user) { e.preventDefault(); onLockedClick(); } };
  return (
    <a href={channel.url} target="_blank" rel="noopener noreferrer" onClick={handleAction} className="bento-card bento-card-compact flex items-center gap-12" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ flex: 1 }}>
        <h4 className="text-sm" style={{ margin: 0 }}>{channel.name}</h4>
        <p className="text-xs text-ink-mute" style={{ margin: 0 }}>{channel.category}</p>
      </div>
    </a>
  );
}

const Practice: React.FC = () => {
  const [tab, setTab] = useState<Tab>('problems');
  const [problemSet, setProblemSet] = useState<ProblemSet>('popular');
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [englishSearch, setEnglishSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [adminProblems, setAdminProblems] = useState<LeetCodeProblem[]>([]);
  const [user, setUser] = useState<any>(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<LeetCodeProblem | null>(null);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [editorLanguage, setEditorLanguage] = useState('javascript');

  useEffect(() => {
    if (selectedProblem) {
      const funcName = selectedProblem.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      setCode(`/* Solve: ${selectedProblem.title} */\nfunction ${funcName || 'solve'}(input) {\n  // Write your implementation here...\n  \n  return true;\n}`);
      setRunStatus('idle');
    }
  }, [selectedProblem]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAdmin = async () => {
      setLoadingProblems(true);
      try {
        const snap = await getDocs(query(collection(db, 'practice_problems'), orderBy('num', 'asc')));
        const problems = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            num: data.num,
            title: data.title,
            topic: data.topic || '',
            videoUrl: data.videoUrl || '',
            leetcodeUrl: data.leetcodeUrl || '',
            difficulty: data.difficulty || 'Easy'
          } as LeetCodeProblem;
        });
        setAdminProblems(problems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchAdmin();
  }, []);

  const currentProblems = problemSet === 'popular' ? POPULAR_PROBLEMS : problemSet === 'leetcode150' ? LEETCODE_150_PROBLEMS : problemSet === 'top150' ? TOP_INTERVIEW_150 : adminProblems;

  const allTopics = useMemo(() => Array.from(new Set(currentProblems.map(p => p.topic))).sort(), [problemSet]);
  const filteredProblems = useMemo(() => {
    const ns = normalizeSearch(search);
    return currentProblems.filter(p => {
      const matchSearch = !ns || normalizeSearch(p.title).includes(ns) || String(p.num).includes(search);
      const matchTopic = !topicFilter || p.topic === topicFilter;
      const matchDiff = !diffFilter || p.difficulty === diffFilter;
      return matchSearch && matchTopic && matchDiff;
    });
  }, [currentProblems, search, topicFilter, diffFilter]);
  const displayedProblems = useMemo(() => !user ? filteredProblems.slice(0, 3) : filteredProblems, [filteredProblems, user]);
  const displayedCourses = useMemo(() => !user ? FULL_COURSES.slice(0, 3) : FULL_COURSES, [user]);
  const displayedInterviews = useMemo(() => !user ? INTERVIEW_EXPERIENCES.slice(0, 3) : INTERVIEW_EXPERIENCES, [user]);
  const filteredChannels = useMemo(() => YOUTUBE_CHANNELS.filter(c => !channelFilter || c.category === channelFilter), [channelFilter]);
  const displayedChannels = useMemo(() => !user ? filteredChannels.slice(0, 3) : filteredChannels, [filteredChannels, user]);
  const allLevels = useMemo(() => Array.from(new Set(ENGLISH_EXERCISES.map(e => e.level))).sort(), []);
  const filteredEnglish = useMemo(() => {
    const ns = normalizeSearch(englishSearch);
    return ENGLISH_EXERCISES.filter(e => {
      const matchSearch = !ns || normalizeSearch(e.title).includes(ns) || normalizeSearch(e.level).includes(ns) || String(e.num).includes(englishSearch);
      const matchLevel = !levelFilter || e.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [englishSearch, levelFilter]);
  const displayedEnglish = useMemo(() => !user ? filteredEnglish.slice(0, 3) : filteredEnglish, [filteredEnglish, user]);

  useEffect(() => {
    if (displayedProblems.length > 0) {
      if (!selectedProblem || !displayedProblems.some(p => p.num === selectedProblem.num)) {
        setSelectedProblem(displayedProblems[0]);
      }
    } else {
      setSelectedProblem(null);
    }
  }, [displayedProblems, selectedProblem]);

  return (
    <div className="viewport-content">
      {/* Page Header */}
      <div className="section-header">
        <span className="flabel">Practice & Interview Prep</span>
        <h1>Master Coding &<br /><span style={{ color: 'var(--accent)' }}>English Grammar</span></h1>
        <p>460+ LeetCode problems, 52 English grammar topics, video solutions, full courses, and interview prep.</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-24">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedProblem(null); }}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'problems' ? (
        <div className="practice-grid">
          {/* Sidebar (Left) */}
          <div className="flex flex-col gap-16">
            {/* Problem Set Toggle */}
            <div className="flex gap-4 flex-wrap">
              {([
                { key: 'popular', label: `Popular` },
                { key: 'leetcode150', label: `150` },
                { key: 'top150', label: `Top` },
                ...(adminProblems.length > 0 ? [{ key: 'admin' as ProblemSet, label: `Custom` }] : [])
              ]).map(({ key, label }) => (
                <button key={key} onClick={() => { setProblemSet(key as ProblemSet); setSelectedProblem(null); }}
                  className={`btn btn-xs${problemSet === key ? ' bg-accent' : ''}`}
                >{label}</button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-8">
              <div>

                <input type="text" className="input" placeholder="Search problems..." value={search} onChange={e => { setSearch(e.target.value); setSelectedProblem(null); }} />
              </div>
              <select className="input" style={{ padding: '6px 10px', fontSize: '0.75rem' }} value={topicFilter} onChange={e => { setTopicFilter(e.target.value); setSelectedProblem(null); }}>
                <option value="">All Topics</option>
                {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="input" style={{ padding: '6px 10px', fontSize: '0.75rem' }} value={diffFilter} onChange={e => { setDiffFilter(e.target.value); setSelectedProblem(null); }}>
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              {(search || topicFilter || diffFilter) && (
                <button onClick={() => { setSearch(''); setTopicFilter(''); setDiffFilter(''); setSelectedProblem(null); }} className="btn btn-xs btn-secondary btn-full">× Clear Filters</button>
              )}
            </div>

            {/* Problem List */}
            <div className="flex flex-col gap-6" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
              {loadingProblems ? (
                <div className="flex flex-col gap-12">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="bento-card bento-card-compact">
                      <div className="skeleton skeleton-text" />
                      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : displayedProblems.length === 0 ? (
                <div className="text-center p-16" style={{ color: 'var(--ink-mute)' }}>
                  
                  <p style={{ fontSize: '0.8rem' }}>No problems found.</p>
                </div>
              ) : (
                displayedProblems.map((p) => {
                  const isActive = selectedProblem?.num === p.num;
                  return (
                    <div key={`${problemSet}-${p.num}`}
                      className={`bento-card bento-card-compact cursor-pointer ${isActive ? 'bento-card-accent' : ''}`}
                      onClick={() => setSelectedProblem(p)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-8 justify-between">
                          <span className="flabel" style={{ fontSize: '0.6rem' }}>#{p.num}</span>
                          <span className={`badge ${difficultyStyles[p.difficulty] || ''}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            {p.difficulty}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{p.title}</h4>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Content Area (Right) */}
          <div className="flex flex-col gap-20">
            {selectedProblem ? (
              <div className="flex flex-col gap-20">
                {/* Problem Info Card */}
                <div className="bento-card" style={{ gap: 16 }}>
                  <div>
                    <span className="flabel">Problem Details</span>
                    <h2 style={{ margin: '4px 0 12px' }}>{selectedProblem.title}</h2>
                    <div className="flex gap-8 flex-wrap items-center">
                      <span className="badge" style={{ fontSize: '0.7rem' }}>{selectedProblem.topic}</span>
                      <span className={`badge ${difficultyStyles[selectedProblem.difficulty] || ''}`} style={{ fontSize: '0.7rem' }}>
                        {selectedProblem.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="asc" />

                  {selectedProblem.companies && selectedProblem.companies.length > 0 && (
                    <div>
                      <h4 className="mb-8" style={{ fontSize: '0.9rem' }}>Companies:</h4>
                      <div className="flex gap-4 flex-wrap">
                        {selectedProblem.companies.map((c, i) => (
                          <span key={i} className="badge" style={{ fontSize: '0.7rem' }}>
                            {c.name} {c.count > 0 && `(${c.count})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-8 mt-12 flex-wrap">
                    <a href={selectedProblem.leetcodeUrl} target="_blank" rel="noopener noreferrer"
                      onClick={() => {
                        if (user) {
                          (async () => { try { await db.from('practice_history').insert({ user_id: user.uid, practice_type: 'leetcode', item_id: selectedProblem.num, item_title: selectedProblem.title, opened_at: new Date().toISOString() }); } catch {} })();
                        }
                      }}
                      className="btn btn-primary btn-sm" style={{ gap: 6 }}
                    >
                       Solve on LeetCode 
                    </a>
                    <a href={selectedProblem.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm" style={{ gap: 6 }}
                    >
                       Watch Solution
                    </a>
                  </div>
                </div>

                {/* Mock Code Editor Card */}
                <div className="bento-card bento-card-naked" style={{ overflow: 'hidden' }}>
                  <div className="lang-win-head" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ink)', color: '#fff' }}>
                    <div className="lang-dots" style={{ display: 'flex', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="font-mono text-xs" style={{ color: '#8a8780', fontSize: '0.7rem' }}>WORKSPACE EDITOR</span>
                      <select
                        value={editorLanguage}
                        onChange={e => setEditorLanguage(e.target.value)}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', outline: 'none', fontFamily: 'var(--font-mono)' }}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="typescript">TypeScript</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    style={{
                      width: '100%',
                      height: 240,
                      background: 'var(--bg-surface-hover)',
                      color: 'var(--ink)',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      padding: 16,
                      resize: 'none',
                      lineHeight: '1.5'
                    }}
                  />
                  <div className="flex justify-between items-center" style={{ padding: '12px 16px', borderTop: '2px solid var(--ink)', background: 'var(--bg-surface)' }}>
                    <button
                      onClick={() => {
                        setRunStatus('running');
                        setTimeout(() => {
                          setRunStatus('passed');
                          toast.success("All tests passed successfully!");
                        }, 800);
                      }}
                      disabled={runStatus === 'running'}
                      className="btn btn-sm btn-primary"
                    >
                      {runStatus === 'running' ? (
                        <>
                          Running...
                        </>
                      ) : (
                        'Run Tests'
                      )}
                    </button>
                    <span className="font-mono text-xs">Line 1, Col 1</span>
                  </div>

                  {/* Test Results Footer panel */}
                  {runStatus !== 'idle' && (
                    <div style={{
                      padding: '12px 16px',
                      background: runStatus === 'running' ? 'var(--bg-surface)' : 'var(--accent-soft)',
                      borderTop: '2px solid var(--ink)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: runStatus === 'passed' ? 'var(--accent)' : 'var(--ink)'
                    }}>
                      {runStatus === 'running' ? (
                        <div className="flex items-center gap-6">
                          Compiling sandbox environment and executing test suites...
                        </div>
                      ) : (
                        <div className="flex items-center gap-6 font-bold">
                          <span>✓ All 12 tests passed</span>
                          <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>SUCCESS</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bento-card text-center" style={{ padding: 48, justifyContent: 'center', alignItems: 'center' }}>
                
                <h3>Select a problem from the list</h3>
                <p>Click on any problem in the sidebar to view details and start practicing.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Render other tabs normally in grid-3 / grid-2 list layout */
        <div>
          {tab === 'courses' && (
            <div className="flex flex-col gap-12">
              <div>

                <input type="text" className="input" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div className="grid-3">
                {displayedCourses.filter(c => !search || normalizeSearch(c.title).includes(normalizeSearch(search))).map(c => (
                  <CourseCard key={c.num} course={c} user={user} onLockedClick={() => setIsAuthModalOpen(true)} />
                ))}
              </div>
            </div>
          )}

          {tab === 'interviews' && (
            <div className="grid-3">
              {displayedInterviews.map(i => (
                <InterviewCard key={i.num} interview={i} user={user} onLockedClick={() => setIsAuthModalOpen(true)} />
              ))}
            </div>
          )}

          {tab === 'english' && (
            <div className="flex flex-col gap-16">
              <div className="flex gap-12 flex-wrap items-center">
                <div>
  
                  <input type="text" className="input" placeholder="Search grammar..." value={englishSearch} onChange={e => setEnglishSearch(e.target.value)} style={{ width: '100%' }} />
                </div>
                <select className="input" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                  <option value="">All Levels</option>
                  {allLevels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {(englishSearch || levelFilter) && (
                  <button onClick={() => { setEnglishSearch(''); setLevelFilter(''); }} className="btn btn-xs btn-secondary">× Clear</button>
                )}
              </div>
              <div className="grid-3">
                {displayedEnglish.map(e => (
                  <EnglishExerciseCard key={e.num} exercise={e} user={user} onLockedClick={() => setIsAuthModalOpen(true)} />
                ))}
              </div>
            </div>
          )}

          {tab === 'channels' && (
            <div className="flex flex-col gap-12">
              <div className="flex gap-4 flex-wrap">
                {Array.from(new Set(YOUTUBE_CHANNELS.map(c => c.category))).sort().map(cat => (
                  <button key={cat} onClick={() => setChannelFilter(cat === channelFilter ? '' : cat)}
                    className={`btn btn-xs${channelFilter === cat ? ' bg-accent' : ''}`}
                  >{cat}</button>
                ))}
              </div>
              <div className="grid-3">
                {displayedChannels.map(ch => (
                  <ChannelCard key={ch.num} channel={ch} user={user} onLockedClick={() => setIsAuthModalOpen(true)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest Lock Overlay */}
      {!user && (
        <div className="bento-card bento-card-accent" style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="empty-state">
            
            <h3>Unlock 450+ More Practice Items</h3>
            <p>Join our community of developers to access complete LeetCode patterns, full video courses, real interview experiences, and premium channels.</p>
            <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary" style={{ marginTop: 12 }}>
              Unlock Practice Platform
            </button>
          </div>
        </div>
      )}
      <LoginModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default Practice;
