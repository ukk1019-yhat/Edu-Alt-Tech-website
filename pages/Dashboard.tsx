import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, doc, onSnapshot, collection, query, where, getDocs, getDoc } from '../lib/firebase';

import { Link, useNavigate } from 'react-router-dom';
import { UserObject, CourseEnrollment, Course, TeacherApplication } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
};

const extractMeetingLink = (message: string | undefined, explicitLink?: string): string | null => {
  if (explicitLink) return explicitLink;
  if (!message) return null;
  const match = message.match(/\[Interview Link:\s*([^\]]+)\]/);
  return match ? match[1] : null;
};

const extractMeetingDate = (message: string | undefined, explicitDate?: any): string | null => {
  if (explicitDate) return typeof explicitDate === 'string' ? explicitDate : explicitDate?.toISOString?.() || null;
  if (!message) return null;
  const match = message.match(/\[Interview Date:\s*([^\]]+)\]/);
  return match ? match[1] : null;
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [enrollments, setEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [teachingEnrollments, setTeachingEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [myApplications, setMyApplications] = useState<(TeacherApplication & { courseTitle?: string })[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; content: string; role: string; created_at: string }[]>([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejectionCounts, setRejectionCounts] = useState<Record<string, number>>({});
  const [leetcodeCount, setLeetcodeCount] = useState(0);
  const [englishCount, setEnglishCount] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  
  // Custom checklist states
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Solve a LeetCode problem', done: false },
    { id: '2', text: 'Revise English grammar rules', done: false },
    { id: '3', text: 'Download study materials', done: false },
    { id: '4', text: 'Review upcoming classes', done: false },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (!u) { navigate('/login'); return; }

        try {
          const docObj = await getDoc(doc(db, 'users', u.uid));
          if (docObj.exists() && !cancelled) setUserProfile({ uid: docObj.id, ...docObj.data() } as UserObject);
        } catch (_) {}

        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesMap = new Map<string, Course>();
        coursesSnap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() } as Course));
        PLATFORM_COURSES.forEach((pc, i) => { const id = `pc-${i}`; if (!coursesMap.has(id)) coursesMap.set(id, { id, ...pc } as Course); });

        const sq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'student'));
        const sSnap = await getDocs(sq);
        const studentEnr: any[] = [];
        sSnap.docs.forEach(ds => {
          const data = ds.data();
          const course = coursesMap.get(data.courseId);
          if (course) studentEnr.push({ id: ds.id, ...data, courseData: course });
        });
        if (!cancelled) setEnrollments(studentEnr);

        const tq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tq);
        const teacherEnr: any[] = [];
        tSnap.docs.forEach(ds => {
          const data = ds.data();
          const course = coursesMap.get(data.courseId);
          if (course) teacherEnr.push({ id: ds.id, ...data, courseData: course });
        });
        if (!cancelled) setTeachingEnrollments(teacherEnr);

        const appQ = query(collection(db, 'teacher_applications'), where('userId', '==', u.uid));
        const appSnap = await getDocs(appQ);
        const apps = appSnap.docs.map(d => {
          const data = d.data() as TeacherApplication;
          const courseIdVal = data.qualification || '';
          const course = coursesMap.get(courseIdVal) || (() => {
            const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === courseIdVal);
            return idx !== -1 ? { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course : null;
          })();
          return { ...data, id: d.id, courseTitle: course?.title || 'Unknown Course', userName: data.name || 'Unknown', userEmail: data.email || '' };
        });
        if (!cancelled) setMyApplications(apps);

        const rejectMap: Record<string, number> = {};
        apps.forEach(a => { if (a.status === 'rejected') { const key = a.qualification || ''; rejectMap[key] = (rejectMap[key] || 0) + 1; } });
        if (!cancelled) setRejectionCounts(rejectMap);

        try {
          const { data: chatData } = await db.from('chat_messages').select('*').eq('user_id', u.uid).order('created_at', { ascending: true });
          if (chatData && !cancelled) setChatMessages(chatData);
        } catch (_) {}

        try {
          const { count: dlCount } = await db.from('user_downloads').select('id', { count: 'exact', head: true }).eq('user_id', u.uid);
          const enrolledCourseIds = [...new Set([...studentEnr.map(e => e.courseId), ...teacherEnr.map(e => e.courseId)])];
          let courseResCount = 0;
          if (enrolledCourseIds.length > 0) {
            const { count: crCount } = await db.from('resources').select('id', { count: 'exact', head: true }).in('course_id', enrolledCourseIds);
            courseResCount = crCount || 0;
          }
          if (!cancelled) setResourceCount((dlCount || 0) + courseResCount);
        } catch (_) {}

        try {
          const { count: lcCount } = await db.from('practice_history').select('id', { count: 'exact', head: true }).eq('user_id', u.uid).eq('practice_type', 'leetcode');
          if (!cancelled) setLeetcodeCount(lcCount || 0);
          const { count: engCount } = await db.from('practice_history').select('id', { count: 'exact', head: true }).eq('user_id', u.uid).eq('practice_type', 'english');
          if (!cancelled) setEnglishCount(engCount || 0);
          const { data: pHistory } = await db.from('practice_history').select('*').eq('user_id', u.uid).order('opened_at', { ascending: false }).limit(30);
          if (pHistory && !cancelled) setPracticeHistory(pHistory);
        } catch (_) {}
        try {
          const { data: notifData } = await db.from('notifications').select('*').eq('user_id', u.uid).order('created_at', { ascending: false }).limit(20);
          if (notifData && !cancelled) setNotifications(notifData);
        } catch (_) {}
        try {
          const enrolledCourseIds = studentEnr.map(e => e.courseId);
          if (enrolledCourseIds.length > 0) {
            const { data: classData } = await db.from('scheduled_classes').select('*').in('course_id', enrolledCourseIds).gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(10);
            if (classData && !cancelled) setUpcomingClasses(classData);
          }
        } catch (_) {}
      } catch (err) { console.error("Dashboard init error", err); }
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; unsubscribeAuth(); };
  }, []);

  // Sync checklist state when counts change
  useEffect(() => {
    setTasks([
      { id: '1', text: 'Solve a LeetCode problem', done: leetcodeCount > 0 },
      { id: '2', text: 'Revise English grammar rules', done: englishCount > 0 },
      { id: '3', text: 'Download study materials', done: resourceCount > 0 },
      { id: '4', text: 'Review upcoming classes', done: upcomingClasses.length > 0 },
    ]);
  }, [leetcodeCount, englishCount, resourceCount, upcomingClasses]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const nextSteps: string[] = [];
  if (enrollments.length === 0 && myApplications.length === 0) nextSteps.push('Browse courses and enroll to start learning');
  if (myApplications.some(a => a.status === 'pending')) nextSteps.push('Your teacher application is pending review — the admin will reach out');
  const scheduledApp = myApplications.find(a => a.status === 'scheduled');
  if (scheduledApp && extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink)) nextSteps.push('You have an interview scheduled! Join using the meeting link below');
  if (myApplications.some(a => a.status === 'approved') && teachingEnrollments.length === 0) nextSteps.push('Your application was approved! The admin will assign you as a teacher shortly');
  if (teachingEnrollments.length > 0) nextSteps.push('Go to your classroom to manage your course modules and students');
  if (enrollments.length > 0) nextSteps.push('Continue your learning — pick up where you left off in My Courses');

  const loadChatMessages = async () => {
    if (!user) return;
    const { data } = await db.from('chat_messages').select('*').eq('user_id', user.uid).order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    setSendingMessage(true);
    try {
      await db.from('chat_messages').insert({ user_id: user.uid, content: chatInput, role: 'user', created_at: new Date().toISOString() });
      setChatInput('');
      await loadChatMessages();
    } catch (e) { console.error("Failed to send message", e); }
    finally { setSendingMessage(false); }
  };

  const triggerSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: '260px' }} />
        <div className="skeleton skeleton-text" style={{ width: '180px' }} />
        <div className="asc" />
        <div className="grid-12">
          <div className="col-span-8"><div className="skeleton skeleton-card" /></div>
          <div className="col-span-4"><div className="skeleton skeleton-card" /></div>
        </div>
        <div className="grid-3">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    );
  }

  const totalTeaching = teachingEnrollments.length;
  const totalApplications = myApplications.length;
  const pendingApps = myApplications.filter(a => a.status === 'pending').length;
  const approvedApps = myApplications.filter(a => a.status === 'approved').length;

  const activeCourse = enrollments.length > 0 ? enrollments[0] : null;
  const totalMilestones = 6;
  const completedMilestones = activeCourse?.completedModules?.length || 0;
  const courseProgressPercent = Math.round((completedMilestones / totalMilestones) * 100);

  // Mock a streak activity grid (Monday to Sunday)
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday-indexed 0-6
  const streakCount = leetcodeCount + englishCount > 0 ? (leetcodeCount + englishCount + 2) : 0;

  return (
    <div className="viewport-content flex flex-col gap-24">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="mt-8">Welcome back, {userProfile?.name || 'Student'}</h1>
        </div>
        <button onClick={triggerSearch} className="btn btn-primary">
          Search (Cmd+K)
        </button>
      </div>

      {/* ── Interview Banner ── */}
      {scheduledApp && extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink) && (() => {
        const mLink = extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink)!;
        const mDate = extractMeetingDate(scheduledApp.message, scheduledApp.meetingDate);
        return (
          <div className="bento-card bento-card-accent bento-card-compact">
            <div className="flex items-center gap-16 flex-wrap justify-between">
              <div className="flex items-center gap-12">

                <div>
                  <span className="flabel">Action Required</span>
                  <h3 style={{ margin: 0 }}>Interview Scheduled</h3>
                  <p style={{ margin: 0 }}>{scheduledApp.courseTitle}{mDate ? <> — <strong>{new Date(mDate).toLocaleString()}</strong></> : ''}</p>
                </div>
              </div>
              <a href={mLink.startsWith('http') ? mLink : `https://${mLink}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                Join Now
              </a>
            </div>
          </div>
        );
      })()}

      {/* ── Grid-12 Row ── */}
      <div className="grid-12">
        {/* Active Course Progress Card (col-span-8) */}
        <div className="bento-card col-span-8">
          <h2 className="text-xl mb-12">{activeCourse?.courseData?.title || 'No active course'}</h2>
          {activeCourse ? (
            <div>
              <div className="curriculum-progress-bar mb-12">
                <div className="curriculum-progress-fill" style={{ width: `${courseProgressPercent}%` }} />
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Stage {Math.min(completedMilestones + 1, totalMilestones)} of {totalMilestones}</span>
                <span>{courseProgressPercent}% Complete</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="my-16 text-sm">Browse our catalog to enroll in top courses.</p>
              <Link to="/courses" className="btn btn-primary btn-sm">Explore Catalog</Link>
            </div>
          )}
        </div>

        {/* Practice Streak Card (col-span-4) */}
        <div className="bento-card col-span-4 text-center justify-center">
          <div className="stat-value accented">{streakCount} Days</div>
          <p className="text-ink-mute text-sm" style={{ margin: 0 }}>Study streak</p>
        </div>
      </div>

      {/* ── Grid-3 Row ── */}
      <div className="grid-3">
        {/* Continue Learning card */}
        <div className="bento-card justify-between">
          <div>
            <h4 className="mb-12">Continue Learning</h4>
            <p className="text-sm mb-16" style={{ margin: '0 0 16px' }}>Web-Sockets replication structures</p>
          </div>
          {activeCourse ? (
            <Link to={`/classroom/${activeCourse.courseId}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              Resume
            </Link>
          ) : (
            <Link to="/courses" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              Enroll
            </Link>
          )}
        </div>

        {/* Tasks Checklist Card */}
        <div className="bento-card">
          <h4 className="mb-12">Tasks</h4>
          <div className="flex flex-col gap-8 text-sm" style={{ margin: 0 }}>
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-8 cursor-pointer" onClick={() => toggleTask(task.id)}>
                <span>{task.done ? '☑' : '☐'}</span>
                <span className={`truncate ${task.done ? 'text-ink-mute' : 'text-ink'}`} style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Live Classes Timeline Feed */}
        <div className="bento-card">
          <h4 className="mb-12">Upcoming</h4>
          {upcomingClasses.length === 0 ? (
            <div className="text-sm text-ink-soft">
              <div className="font-semibold">14:00 - Sockets Session</div>
              <div>Tomorrow - Shards Grading</div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 text-sm text-ink-soft">
              {upcomingClasses.slice(0, 2).map((cls) => (
                <div key={cls.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate" style={{ maxWidth: '70%' }}>{cls.title}</span>
                    <span className="badge text-xs" style={{ padding: '1px 6px' }}>
                      {new Date(cls.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid-2 Row ── */}
      <div className="grid-2">
        {/* Completed Skills */}
        <div className="bento-card">
          <span className="flabel mb-12">Skills Mastered</span>
          <div className="flex flex-wrap gap-8 mt-8">
            {enrollments.map(enr => (
              <span key={enr.id} className="badge badge-accent flex items-center gap-6">
                ✓ {enr.courseData?.title}
              </span>
            ))}
            {leetcodeCount > 0 && (
              <span className="badge badge-accent flex items-center gap-6">
                ✓ Problem Solving
              </span>
            )}
            {englishCount > 0 && (
              <span className="badge badge-accent flex items-center gap-6">
                ✓ English Communication
              </span>
            )}
            {resourceCount > 0 && (
              <span className="badge badge-accent flex items-center gap-6">
                ✓ Resource Vault Access
              </span>
            )}
            {enrollments.length === 0 && leetcodeCount === 0 && englishCount === 0 && (
              <span className="text-xs text-ink-mute">Enroll or practice to display mastered skills here.</span>
            )}
          </div>
        </div>

        {/* Support Chat with Admin */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-8">
            <span className="flabel">Admin Support Chat</span>
            <span className="badge badge-accent">ONLINE</span>
          </div>
          <div style={{ height: 100, overflowY: 'auto', padding: 8, marginBottom: 12, border: '2px solid var(--ink)', background: 'var(--bg)' }}>
            {chatMessages.length === 0 ? (
              <p className="text-xs text-ink-mute text-center" style={{ margin: '24px 0' }}>No messages yet. Send a note below to chat with an admin.</p>
            ) : (
              <div className="flex flex-col gap-8">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div style={{
                      padding: '4px 8px',
                      background: msg.role === 'user' ? 'var(--accent-soft)' : 'var(--bg-surface-hover)',
                      border: '1px solid var(--ink)',
                      maxWidth: '85%'
                    }}>
                      <p className="text-xs" style={{ margin: 0 }}>{msg.content}</p>
                    </div>
                    <span className="text-ink-mute" style={{ fontSize: '0.6rem', marginTop: 2 }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-8">
            <input
              className="input"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Message admin support..."
            />
            <button className="btn btn-primary" style={{ padding: '6px 14px' }} onClick={handleSendMessage} disabled={sendingMessage || !chatInput.trim()}>
              {sendingMessage ? 'Loading...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
