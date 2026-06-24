import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, doc, onSnapshot, collection, query, where, getDocs, getDoc } from '../lib/firebase';

import { Link, useNavigate } from 'react-router-dom';
import { UserObject, CourseEnrollment, Course, TeacherApplication } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { getLastReadTimestamps, markCourseRead, computeUnreadCount } from '../lib/chatNotifications';

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
  const [chatUnreadCounts, setChatUnreadCounts] = useState<Record<string, number>>({});
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

  // Fetch all courses for lookups
  const coursesSnap = await getDocs(collection(db, 'courses'));
  const coursesMap = new Map<string, Course>();
  coursesSnap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() } as Course));
  // Include platform courses
  PLATFORM_COURSES.forEach((pc, i) => { const id = `pc-${i}`; if (!coursesMap.has(id)) coursesMap.set(id, { id, ...pc } as Course); });

 // Student enrollments
 const sq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'student'));
 const sSnap = await getDocs(sq);
 const studentEnr: any[] = [];
 sSnap.docs.forEach(ds => {
 const data = ds.data();
 const course = coursesMap.get(data.courseId);
 if (course) studentEnr.push({ id: ds.id, ...data, courseData: course });
 });
 if (!cancelled) setEnrollments(studentEnr);

 // Teaching enrollments (role=teacher)
 const tq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'teacher'));
 const tSnap = await getDocs(tq);
 const teacherEnr: any[] = [];
 tSnap.docs.forEach(ds => {
 const data = ds.data();
 const course = coursesMap.get(data.courseId);
 if (course) teacherEnr.push({ id: ds.id, ...data, courseData: course });
 });
 if (!cancelled) setTeachingEnrollments(teacherEnr);

 // Teacher applications for this user
 const appQ = query(collection(db, 'teacher_applications'), where('userId', '==', u.uid));
 const appSnap = await getDocs(appQ);
 const apps = appSnap.docs.map(d => {
 const data = d.data() as TeacherApplication;
 const courseIdVal = data.qualification || '';
 const course = coursesMap.get(courseIdVal) || (() => {
   const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === courseIdVal);
   return idx !== -1 ? { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course : null;
 })();
 return {
 ...data,
 id: d.id,
 courseTitle: course?.title || 'Unknown Course',
 userName: data.name || 'Unknown',
 userEmail: data.email || ''
 };
 });
 if (!cancelled) setMyApplications(apps);

 // Count rejections per course
 const rejectMap: Record<string, number> = {};
 apps.forEach(a => {
 if (a.status === 'rejected') {
 const key = a.qualification || '';
 rejectMap[key] = (rejectMap[key] || 0) + 1;
 }
 });
 if (!cancelled) setRejectionCounts(rejectMap);

 // Fetch chat messages for this user
 try {
 const { data: chatData } = await db.from('chat_messages').select('*').eq('user_id', u.uid).order('created_at', { ascending: true });
 if (chatData && !cancelled) setChatMessages(chatData);
 } catch (_) {}

 // Count resources
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

 // Practice stats
 try {
 const { count: lcCount } = await db.from('practice_history').select('id', { count: 'exact', head: true }).eq('user_id', u.uid).eq('practice_type', 'leetcode');
 if (!cancelled) setLeetcodeCount(lcCount || 0);
 const { count: engCount } = await db.from('practice_history').select('id', { count: 'exact', head: true }).eq('user_id', u.uid).eq('practice_type', 'english');
 if (!cancelled) setEnglishCount(engCount || 0);
 const { data: pHistory } = await db.from('practice_history').select('*').eq('user_id', u.uid).order('opened_at', { ascending: false }).limit(30);
 if (pHistory && !cancelled) setPracticeHistory(pHistory);
 } catch (_) {}
  // Fetch notifications
  try {
    const { data: notifData } = await db.from('notifications').select('*').eq('user_id', u.uid).order('created_at', { ascending: false }).limit(20);
    if (notifData && !cancelled) setNotifications(notifData);
  } catch (_) {}

  // Fetch upcoming classes
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
 await db.from('chat_messages').insert({
 user_id: user.uid,
 content: chatInput,
 role: 'user',
 created_at: new Date().toISOString()
 });
 setChatInput('');
 await loadChatMessages();
 } catch (e) {
 console.error("Failed to send message", e);
 } finally {
 setSendingMessage(false);
 }
 };

  // Poll unread course chat counts for enrolled courses
  useEffect(() => {
  if (!user || enrollments.length === 0) return;
  const timestamps = getLastReadTimestamps(user.uid);
  const checkUnread = async () => {
  const counts: Record<string, number> = {};
  for (const enr of enrollments) {
  if (!enr.courseId) continue;
  const lastRead = timestamps[enr.courseId];
  try {
  const { count } = await db.from('course_chat_messages').select('id', { count: 'exact', head: true }).eq('course_id', enr.courseId).gt('created_at', lastRead || '1970-01-01');
  if (count && count > 0) counts[enr.courseId] = count;
  } catch (_) {}
  }
  setChatUnreadCounts(counts);
  };
  checkUnread();
  const interval = setInterval(checkUnread, 10000);
  return () => clearInterval(interval);
  }, [user, enrollments]);

  if (loading) {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

 const totalTeaching = teachingEnrollments.length;
 const totalApplications = myApplications.length;
 const pendingApps = myApplications.filter(a => a.status === 'pending').length;
 const approvedApps = myApplications.filter(a => a.status === 'approved').length;

 return (
 <div className="min-h-screen pt-24 sm:pt-28 pb-16 sm:pb-20 px-3 sm:px-4 md:px-8 bg-slate-50 ">
 <div className="max-w-7xl mx-auto">

 {/* ── Hero Row: Greeting + Mini Strip ── */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
 {getGreeting()}, {userProfile?.name || 'Learner'}
 </h1>
 <p className="text-sm text-slate-500 mt-0.5">Your learning command center</p>
 </div>
 <div className="flex items-center gap-3 flex-wrap">
 <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
 <GraduationCap className="w-4 h-4 text-emerald-500" /> {enrollments.length} Learning
 </span>
 {totalTeaching > 0 && (
 <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
 <Users className="w-4 h-4 text-purple-500" /> {totalTeaching} Teaching
 </span>
 )}
 <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
 <Download className="w-4 h-4 text-blue-500" /> {resourceCount} Resources
 </span>
 <Link to="/practice" className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
 <Code2 className="w-4 h-4" /> {leetcodeCount + englishCount > 0 ? `${leetcodeCount + englishCount} Practiced` : 'Practice'}
 </Link>
 </div>
 </div>
 </motion.div>

 {/* ── Interview Banner (compact) ── */}
 {scheduledApp && extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink) && (() => {
 const mLink = extractMeetingLink(scheduledApp.message, scheduledApp.meetingLink)!;
 const mDate = extractMeetingDate(scheduledApp.message, scheduledApp.meetingDate);
 return (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
 <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="absolute top-0 right-0 p-2 opacity-5"><Video className="w-28 h-28" /></div>
 <div className="relative z-10 flex items-start gap-4">
 <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Video className="w-5 h-5" /></div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Action Required</span>
 </div>
 <h2 className="text-base sm:text-lg font-black">Interview Scheduled</h2>
 <p className="text-blue-100 text-sm">{scheduledApp.courseTitle}{mDate ? <> — <strong>{new Date(mDate).toLocaleString()}</strong></> : ''}</p>
 </div>
 </div>
 <a href={mLink.startsWith('http') ? mLink : `https://${mLink}`} target="_blank" rel="noreferrer"
 className="relative z-10 shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-sm">
 <Video className="w-4 h-4" /> Join Now
 </a>
 </div>
 </motion.div>
 );
 })()}

 {/* ── Next Step (compact) ── */}
 {!scheduledApp && nextSteps.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
 <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-500/15 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-3 opacity-10"><Lightbulb className="w-20 h-20" /></div>
 <div className="relative z-10 flex items-start gap-3">
 <Lightbulb className="w-6 h-6 text-emerald-200 shrink-0 mt-0.5" />
 <div>
 <h2 className="text-sm font-black tracking-tight mb-2">Next Step</h2>
 <ul className="space-y-1.5">
 {nextSteps.slice(0, 2).map((step, i) => (
 <li key={i} className="flex items-start gap-2 text-emerald-50 text-sm">
 <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
 <span className="font-medium">{step}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {/* ── Main 2‑col Layout ── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

 {/* ===== LEFT ===== */}
 <div className="lg:col-span-2 space-y-5">

 {/* My Learning */}
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
 <GraduationCap className="w-5 h-5 text-emerald-500" /> My Learning
 </h2>
 {enrollments.length > 0 && <Link to="/courses" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors">Browse All</Link>}
 </div>

 {enrollments.length === 0 ? (
 <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 md:p-8 text-center">
 <div className="w-14 h-14 rounded-2xl bg-emerald-50 /20 text-emerald-500 flex items-center justify-center mx-auto mb-4"><BookOpen className="w-7 h-7" /></div>
 <h3 className="text-lg font-bold text-slate-900 mb-1">No Enrollments Yet</h3>
 <p className="text-sm text-slate-500 mb-5">Start your learning journey by enrolling in a course.</p>
 <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20">
 Browse Courses <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 ) : (
 <div className="grid gap-3">
 {enrollments.map((enr, idx) => (
 <motion.div key={enr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
 className="group bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-emerald-500 hover:shadow-md transition-all duration-200"
 >
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
 {enr.courseData?.title?.charAt(0) || 'C'}
 </div>
  <div className="min-w-0">
           <h3 className="text-sm font-bold text-slate-900 truncate">{enr.courseData?.title || 'Unknown Course'}</h3>
  </div>
  {chatUnreadCounts[enr.courseId!] > 0 && (
  <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full shrink-0">
  {chatUnreadCounts[enr.courseId!]} new
  </span>
  )}
  </div>
  <Link to={`/classroom/${enr.courseId}`}
  className="shrink-0 px-4 py-2 bg-emerald-50 /20 text-emerald-600 rounded-lg font-bold text-xs hover:bg-emerald-100 :bg-emerald-900/30 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
  Continue
  </Link>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </motion.div>

 {/* Practice History (compact timeline) */}
 {practiceHistory.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
 <History className="w-5 h-5 text-blue-500" /> Recent Activity
 </h2>
 </div>
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
 <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100 ">
 {practiceHistory.slice(0, 15).map((h) => (
 <div key={h.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 :bg-slate-800/30 transition-colors">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black shadow-sm ${
 h.practice_type === 'leetcode'
 ? 'bg-blue-100 /30 text-blue-600 '
 : 'bg-indigo-100 /30 text-indigo-600 '
 }`}>
 {h.practice_type === 'leetcode' ? 'LC' : 'EN'}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-slate-900 truncate">{h.item_title}</p>
 <p className="text-[11px] text-slate-400">{h.practice_type === 'leetcode' ? 'LeetCode Problem' : 'English Exercise'} · #{h.item_id}</p>
 </div>
 <span className="text-[11px] text-slate-400 shrink-0">{new Date(h.opened_at).toLocaleDateString()} {new Date(h.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 )}

 {/* Messages (compact) */}
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-blue-500" /> Messages
 </h2>
 </div>
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
 <div className="h-56 overflow-y-auto p-4 space-y-3 custom-scrollbar">
 {chatMessages.length === 0 ? (
 <div className="text-center py-6">
 <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
 <p className="text-slate-400 font-medium text-sm">No messages yet</p>
 <p className="text-xs text-slate-500 mt-0.5">Reach out to the admin team below</p>
 </div>
 ) : (
 chatMessages.map((msg) => (
 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[85%] p-3 rounded-2xl ${
 msg.role === 'user'
 ? 'bg-emerald-500 text-white rounded-br-md'
 : 'bg-slate-100 text-slate-900 rounded-bl-md'
 }`}>
 <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
 <p className={`text-[10px] mt-0.5 ${msg.role === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
 {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 <div className="p-3 border-t border-slate-100 ">
 <div className="flex gap-2">
 <input
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
 placeholder="Message admin..."
 className="flex-1 p-2.5 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-emerald-500 transition-colors"
 />
 <button
 onClick={handleSendMessage}
 disabled={sendingMessage || !chatInput.trim()}
 className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1 text-sm"
 >
 {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
 </button>
 </div>
 </div>
 </div>
 </motion.div>

 </div>

 {/* ===== RIGHT ===== */}
 <div className="space-y-5">

 {/* Profile Card */}
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
 className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl flex items-center justify-center font-black text-lg overflow-hidden shadow-md shrink-0">
 {userProfile?.profilePic ? <img src={userProfile.profilePic} loading="lazy" decoding="async" alt="" className="w-full h-full object-cover" /> : (userProfile?.name?.charAt(0) || 'U')}
 </div>
 <div className="min-w-0">
 <h3 className="font-bold text-slate-900 text-sm truncate">{userProfile?.name || 'User'}</h3>
 <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
 <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 /30 text-emerald-700 rounded-lg text-[9px] font-bold uppercase tracking-wider">
 {userProfile?.role || 'Student'}
 </span>
 </div>
 </div>
 <Link to="/profile" className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 /50 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-600 :text-emerald-400 transition-colors">
 View Profile <ArrowRight className="w-3 h-3" />
 </Link>
 </motion.div>

  {/* Notifications */}
  {notifications.length > 0 && (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
    className="bg-white border border-slate-200 rounded-2xl shadow-sm"
  >
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-500" /> Notifications
      </h3>
      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">{notifications.length}</span>
    </div>
    <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
      {notifications.slice(0, 10).map((n) => (
      <div key={n.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
          {n.type === 'schedule' ? <Calendar className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
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
      ))}
    </div>
  </motion.div>
  )}

  {/* Upcoming Classes */}
  {upcomingClasses.length > 0 && (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
  >
    <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-3 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-blue-500" /> Upcoming Classes
    </h3>
    <div className="space-y-3">
      {upcomingClasses.map((cls) => (
      <div key={cls.id} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
          <Calendar className="w-4 h-4" />
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
  </motion.div>
  )}

  {/* Quick Actions */}
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
  >
 <h3 className="font-bold text-sm text-slate-900 mb-3">Quick Actions</h3>
 <div className="grid grid-cols-2 gap-2">
 <Link to="/practice" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 /10 /10 border border-blue-100 /30 hover:shadow-md transition-all group">
 <Code2 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
 <span className="text-[11px] font-bold text-slate-700 ">Problems</span>
 {leetcodeCount > 0 && <span className="text-[10px] font-bold text-blue-500">{leetcodeCount}</span>}
 </Link>
 <Link to="/practice" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 /10 /10 border border-indigo-100 /30 hover:shadow-md transition-all group">
 <BookOpen className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
 <span className="text-[11px] font-bold text-slate-700 ">English</span>
 {englishCount > 0 && <span className="text-[10px] font-bold text-indigo-500">{englishCount}</span>}
 </Link>
 <Link to="/resources" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 /10 /10 border border-amber-100 /30 hover:shadow-md transition-all group">
 <Download className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
 <span className="text-[11px] font-bold text-slate-700 ">Resources</span>
 {resourceCount > 0 && <span className="text-[10px] font-bold text-amber-500">{resourceCount}</span>}
 </Link>
  <Link to="/courses" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 /10 /10 border border-emerald-100 /30 hover:shadow-md transition-all group">
  <GraduationCap className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
  <span className="text-[11px] font-bold text-slate-700 ">Courses</span>
  </Link>
 </div>

 {/* Highlighted: Apply as Teacher */}
 <Link to="/teacher-application" className="mt-3 block w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 group relative overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
  <div className="relative z-10 flex items-center gap-4">
   <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform shrink-0">
    <Award className="w-6 h-6 text-white" />
   </div>
   <div className="flex-1 min-w-0">
    <p className="font-black text-sm tracking-tight">Apply as Teacher</p>
    <p className="text-xs text-white/70 font-medium mt-0.5">Share your skills — become a mentor</p>
   </div>
   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm group-hover:bg-white/30 transition-colors">
    <Sparkles className="w-3.5 h-3.5" /> Apply Now
   </div>
  </div>
 </Link>
 </motion.div>

 {/* Applications (if any) */}
 {totalApplications > 0 && (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
 className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
 >
 <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Applications</h3>
 <div className="space-y-2">
 {pendingApps > 0 && (
 <div className="flex items-center justify-between p-3 bg-amber-50 /10 rounded-xl">
 <span className="text-xs font-bold text-amber-700 ">Pending Review</span>
 <span className="text-sm font-black text-amber-600 ">{pendingApps}</span>
 </div>
 )}
 {approvedApps > 0 && (
 <div className="flex items-center justify-between p-3 bg-emerald-50 /10 rounded-xl">
 <span className="text-xs font-bold text-emerald-700 ">Approved</span>
 <span className="text-sm font-black text-emerald-600 ">{approvedApps}</span>
 </div>
 )}
 {approvedApps > 0 && (
 <Link to="/teacher-panel" className="flex items-center justify-center gap-1.5 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md">
 <Users className="w-3.5 h-3.5" /> Go to Teacher Panel
 </Link>
 )}
 </div>
 </motion.div>
 )}

 {/* My Teaching (if any) */}
 {totalTeaching > 0 && teachingEnrollments.map((enr) => (
 <motion.div key={enr.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
 className="bg-white border-2 border-purple-200 /40 rounded-2xl p-4 sm:p-5 shadow-sm"
 >
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm text-sm">
 {enr.courseData?.title?.charAt(0) || 'T'}
 </div>
 <div className="min-w-0">
 <span className="px-1.5 py-0.5 bg-purple-100 /30 text-purple-700 rounded text-[9px] font-bold uppercase tracking-wider">Teacher</span>
 <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">{enr.courseData?.title || 'Unknown Course'}</h3>
 </div>
 </div>
 <Link to={`/classroom/${enr.courseId}`} className="shrink-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm">
 Manage
 </Link>
 </div>
 </motion.div>
 ))}

 {/* Courses / Resources CTA */}
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
 className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-500/15"
 >
 <Download className="w-6 h-6 mb-2 text-emerald-200" />
 <h3 className="font-black text-sm mb-0.5">Free Resources</h3>
 <p className="text-xs text-emerald-100 mb-3">Download PDFs, notes, and worksheets.</p>
 <Link to="/resources" className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors backdrop-blur-sm">
 Explore <ArrowRight className="w-3 h-3" />
 </Link>
 </motion.div>

 </div>
 </div>

 </div>
 </div>
 );
};

export default Dashboard;
