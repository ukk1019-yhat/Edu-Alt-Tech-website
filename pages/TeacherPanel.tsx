import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, storage, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, onAuthStateChanged, orderBy, onSnapshot } from '../lib/firebase';
import { Course, CourseEnrollment, CourseModule, ModuleLecture, CourseResource } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';

import type { User } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { getLastReadTimestamps, markCourseRead, computeUnreadCount } from '../lib/chatNotifications';

const ADMIN_EMAILS = ['ukkukk97@gmail.com', 'umakrishnakanthchokkapu15@gmail.com'];

const TeacherPanel: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'courses'>('overview');
  const [courses, setCourses] = useState<(CourseEnrollment & { courseData?: Course; studentCount?: number })[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [activeCourseTab, setActiveCourseTab] = useState<'modules' | 'students' | 'chat' | 'schedule'>('modules');

  const [totalStudents, setTotalStudents] = useState(0);
  const [earnings, setEarnings] = useState<{ total: number; monthly: number }>({ total: 0, monthly: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [recurringClasses, setRecurringClasses] = useState<any[]>([]);

  const [showModuleModal, setShowModuleModal] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mThumbFile, setMThumbFile] = useState<File | null>(null);

  const [showLectureModal, setShowLectureModal] = useState<{ courseId: string; moduleId: string } | null>(null);
  const [lTitle, setLTitle] = useState('');
  const [lMeet, setLMeet] = useState('');
  const [lRec, setLRec] = useState('');

  const [showResourceModal, setShowResourceModal] = useState<string | null>(null);
  const [rTitle, setRTitle] = useState('');
  const [rUrl, setRUrl] = useState('');

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [courseChatMessages, setCourseChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sMeetLink, setSMeetLink] = useState('');
  const [sDate, setSDate] = useState('');
  const [sRepeat, setSRepeat] = useState('none');

  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [rcTitle, setRcTitle] = useState('');
  const [rcDesc, setRcDesc] = useState('');
  const [rcLink, setRcLink] = useState('');
  const [rcRepeat, setRcRepeat] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
  const [rcStart, setRcStart] = useState('');
  const [rcEnd, setRcEnd] = useState('');

  const fetchModulesAndResources = async (courseId: string) => {
    setLoadingModules(true);
    try {
      const [mSnap, rSnap] = await Promise.all([
        getDocs(query(collection(db, 'course_modules'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'resources'), where('courseId', '==', courseId)))
      ]);
      const loadedModules = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseModule));
      loadedModules.sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(loadedModules);
      setResources(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseResource)));
    } catch (e) { console.error("Failed to load modules", e); }
    finally { setLoadingModules(false); }
  };

  const fetchStudents = async (courseId: string) => {
    setLoadingStudents(true);
    try {
      const { data, error } = await db.from('enrollments').select('*').eq('course_id', courseId).eq('role', 'student');
      if (error) throw error;
      const studentList = await Promise.all((data || []).map(async (s: any) => {
        let name = 'Unknown Student'; let email = ''; let paymentStatus = s.payment_status || 'not-required'; let plan: string = 'trial'; let enrolledAt = s.created_at || '';
        try {
          const uDoc = await getDoc(doc(db, 'users', s.user_id));
          if (uDoc.exists()) { const uData = uDoc.data(); name = uData.displayName || uData.name || uData.email || 'Unknown Student'; email = uData.email || ''; }
          const eq = query(collection(db, 'enrollments'), where('userId', '==', s.user_id), where('courseId', '==', courseId), where('role', '==', 'student'));
          const eSnap = await getDocs(eq);
          if (!eSnap.empty) { const eData = eSnap.docs[0].data(); if (eData.paymentStatus) paymentStatus = eData.paymentStatus; if (eData.plan) plan = eData.plan; if (eData.createdAt) enrolledAt = eData.createdAt?.toDate?.()?.toISOString() || eData.createdAt; }
        } catch (_) {}
        return { ...s, name, email, payment_status: paymentStatus, plan, created_at: enrolledAt };
      }));
      setStudents(studentList);
    } catch (e) { console.error("Failed to load students", e); toast.error("Failed to load students"); }
    finally { setLoadingStudents(false); }
  };

  const fetchChatMessages = async (courseId: string) => {
    try {
      const { data, error } = await db.from('course_chat_messages').select('*').eq('course_id', courseId).order('created_at', { ascending: true });
      if (error) throw error;
      const enriched = await Promise.all((data || []).map(async (msg: any) => {
        let senderName = msg.role === 'teacher' ? 'You' : 'Student';
        if (msg.role === 'teacher' && msg.user_id === user?.uid) senderName = 'You';
        else if (msg.role === 'teacher') senderName = 'Teacher';
        else { try { const uDoc = await getDoc(doc(db, 'users', msg.user_id)); if (uDoc.exists()) senderName = uDoc.data().display_name || 'Student'; } catch (_) {} }
        return { ...msg, senderName };
 const navigate = useNavigate();
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);
 const [viewMode, setViewMode] = useState<'overview' | 'courses'>('overview');
 const [courses, setCourses] = useState<(CourseEnrollment & { courseData?: Course; studentCount?: number })[]>([]);
 const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
 const [activeCourseTab, setActiveCourseTab] = useState<'modules' | 'students' | 'chat' | 'schedule'>('modules');

 // Overview stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [firstClassStudents, setFirstClassStudents] = useState(0);
  const [fullAccessStudents, setFullAccessStudents] = useState(0);
  const [earnings, setEarnings] = useState<{ total: number; monthly: number }>({ total: 0, monthly: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);

 // Recurring classes
 const [recurringClasses, setRecurringClasses] = useState<any[]>([]);

 // Module modals
 const [showModuleModal, setShowModuleModal] = useState<string | null>(null);
 const [mTitle, setMTitle] = useState('');
 const [mDesc, setMDesc] = useState('');
 const [mThumbFile, setMThumbFile] = useState<File | null>(null);

 // Lecture modals
 const [showLectureModal, setShowLectureModal] = useState<{ courseId: string; moduleId: string } | null>(null);
 const [lTitle, setLTitle] = useState('');
 const [lMeet, setLMeet] = useState('');
 const [lRec, setLRec] = useState('');

 // Resource modals
 const [showResourceModal, setShowResourceModal] = useState<string | null>(null);
 const [rTitle, setRTitle] = useState('');
 const [rUrl, setRUrl] = useState('');

 // Modules for expanded course
 const [modules, setModules] = useState<CourseModule[]>([]);
 const [resources, setResources] = useState<CourseResource[]>([]);
 const [loadingModules, setLoadingModules] = useState(false);

 // Students tab
 const [students, setStudents] = useState<any[]>([]);
 const [loadingStudents, setLoadingStudents] = useState(false);

  // Chat tab
  const [courseChatMessages, setCourseChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

 // Schedule tab
 const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
 const [showScheduleModal, setShowScheduleModal] = useState(false);
 const [sTitle, setSTitle] = useState('');
 const [sDesc, setSDesc] = useState('');
 const [sMeetLink, setSMeetLink] = useState('');
 const [sDate, setSDate] = useState('');
 const [sRepeat, setSRepeat] = useState('none');

 // Recurring class modal
 const [showRecurringModal, setShowRecurringModal] = useState(false);
 const [rcTitle, setRcTitle] = useState('');
 const [rcDesc, setRcDesc] = useState('');
 const [rcLink, setRcLink] = useState('');
 const [rcRepeat, setRcRepeat] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
 const [rcStart, setRcStart] = useState('');
 const [rcEnd, setRcEnd] = useState('');

 const fetchModulesAndResources = async (courseId: string) => {
 setLoadingModules(true);
 try {
 const [mSnap, rSnap] = await Promise.all([
 getDocs(query(collection(db, 'course_modules'), where('courseId', '==', courseId))),
 getDocs(query(collection(db, 'resources'), where('courseId', '==', courseId)))
 ]);
 const loadedModules = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseModule));
 loadedModules.sort((a, b) => (a.order || 0) - (b.order || 0));
 setModules(loadedModules);
 setResources(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseResource)));
 } catch (e) {
 console.error("Failed to load modules", e);
 } finally {
 setLoadingModules(false);
 }
 };

 const fetchStudents = async (courseId: string) => {
  setLoadingStudents(true);
  try {
  const { data, error } = await db.from('enrollments').select('*').eq('course_id', courseId).eq('role', 'student');
  if (error) throw error;
  const studentList = await Promise.all((data || []).map(async (s: any) => {
  let name = 'Unknown Student';
  let email = '';
  let paymentStatus = s.payment_status || 'not-required';
  let plan: string = 'trial';
  let enrolledAt = s.created_at || '';
  try {
  const uDoc = await getDoc(doc(db, 'users', s.user_id));
  if (uDoc.exists()) {
  const uData = uDoc.data();
  name = uData.displayName || uData.name || uData.email || 'Unknown Student';
  email = uData.email || '';
  }
  // Get payment info from Firestore enrollment
  const eq = query(collection(db, 'enrollments'), where('userId', '==', s.user_id), where('courseId', '==', courseId), where('role', '==', 'student'));
  const eSnap = await getDocs(eq);
  if (!eSnap.empty) {
  const eData = eSnap.docs[0].data();
  if (eData.paymentStatus) paymentStatus = eData.paymentStatus;
  if (eData.plan) plan = eData.plan;
  if (eData.createdAt) enrolledAt = eData.createdAt?.toDate?.()?.toISOString() || eData.createdAt;
  }
  } catch (_) {}
  return { ...s, name, email, payment_status: paymentStatus, plan, created_at: enrolledAt };
  }));
  setStudents(studentList);
  } catch (e) {
  console.error("Failed to load students", e);
  toast.error("Failed to load students");
  } finally {
  setLoadingStudents(false);
  }
  };

  const chatUnsubRef = useRef<(() => void) | null>(null);
  const chatPollRef = useRef<number | null>(null);

  const enrichMessages = async (raw: any[]) => {
  return Promise.all(raw.map(async (msg: any) => {
  let senderName = msg.senderName || msg.sender_name || 'User';
  if (msg.role === 'teacher' && msg.userId === user?.uid) senderName = 'You';
  else if (msg.role === 'teacher') senderName = senderName || 'Teacher';
  else if (!senderName || senderName === 'User') {
  try {
  const uDoc = await getDoc(doc(db, 'users', msg.userId || msg.user_id));
  if (uDoc.exists()) senderName = uDoc.data().displayName || uDoc.data().display_name || 'Student';
  } catch (_) {}
  }
  return { ...msg, senderName };
  }));
  };

  const fetchChatDirect = async (courseId: string) => {
  try {
  const { data, error } = await db.from('course_chat_messages').select('*').eq('course_id', courseId).order('created_at', { ascending: true });
  if (!error && data) {
  const enriched = await enrichMessages(data);
  setCourseChatMessages(enriched);
  }
  } catch (_) {}
  };

  const subscribeChat = (courseId: string) => {
  if (user) {
  markCourseRead(user.uid, courseId);
  setUnreadCounts(prev => ({ ...prev, [courseId]: 0 }));
  }
  chatUnsubRef.current?.();
  if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
  const q = query(
  collection(db, 'course_chat_messages'),
  where('courseId', '==', courseId),
  orderBy('createdAt', 'asc')
  );
  const unsub = onSnapshot(q, async (snap: any) => {
  const raw = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  const enriched = await enrichMessages(raw);
  setCourseChatMessages(enriched);
  }, (e: any) => console.error("Chat subscription error", e));
  chatUnsubRef.current = unsub;
  // Polling fallback every 4s
  fetchChatDirect(courseId);
  chatPollRef.current = window.setInterval(() => fetchChatDirect(courseId), 4000);
  };

 const fetchScheduledClasses = async (courseId: string) => {
 try {
 const { data, error } = await db.from('scheduled_classes').select('*').eq('course_id', courseId).order('scheduled_at', { ascending: false });
 if (error) throw error;
 setScheduledClasses(data || []);
 } catch (e) {
 console.error("Failed to load scheduled classes", e);
 }
 };

   const fetchOverviewStats = async (teacherId: string) => {
   try {
   const myCourseIds = courses.map(c => c.courseId);
   let total = 0, fcCount = 0, fullCount = 0;
   let earningsTotal = 0, earningsMonthly = 0;
   const now = new Date();
   const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

   if (myCourseIds.length > 0) {
   // Fetch plan info from firebase-compat enrollments (has plan field)
   const planMap = new Map<string, string>();
   for (const cid of myCourseIds) {
   const eSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', cid), where('role', '==', 'student')));
   eSnap.docs.forEach(d => planMap.set(d.data().userId, d.data().plan || 'full'));
   }

   // Fetch base enrollment data from supabase
   const { data: enrollData } = await db.from('enrollments').select('user_id, plan, created_at').in('course_id', myCourseIds).eq('role', 'student');
   const enrollments = enrollData || [];
   total = enrollments.length;

   for (const e of enrollments) {
   const plan = planMap.get(e.user_id) || e.plan || 'full';
   if (plan === 'first_class') fcCount++;
   else fullCount++;
   }

   for (const course of courses) {
   const courseEnrolls = enrollments.filter((e: any) => e.course_id === course.courseId);
   for (const e of courseEnrolls) {
   const plan = planMap.get(e.user_id) || 'full';
   const amount = plan === 'first_class' ? 10 : (course.courseData?.price || 0);
   const createdAt = e.created_at || '';
   if (amount) {
   earningsTotal += amount;
   if (createdAt >= thisMonthStart) earningsMonthly += amount;
   }
   }
   }
   }
   setTotalStudents(total);
   setFirstClassStudents(fcCount);
   setFullAccessStudents(fullCount);
   setEarnings({ total: earningsTotal, monthly: earningsMonthly });

   const { data: upcoming } = await db.from('scheduled_classes').select('*').eq('teacher_id', teacherId).gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(5);
   setUpcomingClasses(upcoming || []);
   const { data: recur } = await db.from('teacher_recurring_classes').select('*').eq('teacher_id', teacherId).eq('is_active', true);
   setRecurringClasses(recur || []);
   } catch (e) {
   console.error("Failed to load overview stats", e);
   }
   };

 const notifyAdmins = async (courseTitle: string, className: string, meetingLink: string, teacherName: string) => {
 try {
 const { data: adminUsers } = await db.from('users').select('*').in('email', ADMIN_EMAILS);
 if (adminUsers) {
 for (const admin of adminUsers) {
 await db.from('notifications').insert({
 user_id: admin.id,
 title: 'New Class Scheduled by Teacher',
 message: `Teacher ${teacherName} scheduled "${className}" for course "${courseTitle}". Meeting link: ${meetingLink}`,
 type: 'class_scheduled',
 is_read: false,
 created_at: new Date().toISOString()
 });
 }
 }
 } catch (e) {
 console.warn("Failed to notify admins", e);
 }
 };

 useEffect(() => {
 const unsub = onAuthStateChanged(auth, async (u) => {
 if (!u) { navigate('/login'); return; }
 setUser(u);
 try {
 const coursesSnap = await getDocs(collection(db, 'courses'));
 const coursesMap = new Map<string, Course>();
 coursesSnap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() } as Course));

 const tq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'teacher'));
 const tSnap = await getDocs(tq);
 const teacherCourses: any[] = [];

 for (const ds of tSnap.docs) {
 const data = ds.data();
  const course = coursesMap.get(data.courseId) || (() => {
    const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === data.courseId);
    return idx !== -1 ? { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course : null;
  })();
  if (!course) continue;
 const { count } = await db.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', data.courseId).neq('user_id', u.uid);
 teacherCourses.push({ id: ds.id, ...data, courseData: course, studentCount: count || 0 });
 }
 setCourses(teacherCourses);
 await fetchOverviewStats(u.uid);
 } catch (err) {
 console.error("Failed to load teacher data", err);
 toast.error("Failed to load courses");
 } finally {
 setLoading(false);
 }
 });
   return () => { unsub(); chatUnsubRef.current?.(); if (chatPollRef.current) clearInterval(chatPollRef.current); };
   }, [navigate]);

   // Poll unread chat counts for all courses
   useEffect(() => {
   if (!user || courses.length === 0) return;
   const checkUnread = async () => {
   const timestamps = getLastReadTimestamps(user.uid);
   const counts: Record<string, number> = {};
   for (const course of courses) {
   if (!course.courseId) continue;
   const lastRead = timestamps[course.courseId];
   try {
   const { count } = await db.from('course_chat_messages').select('id', { count: 'exact', head: true }).eq('course_id', course.courseId).gt('created_at', lastRead || '1970-01-01');
   if (count && count > 0) counts[course.courseId] = count;
   } catch (_) {}
   }
   setUnreadCounts(counts);
   };
   checkUnread();
   const interval = setInterval(checkUnread, 10000);
   return () => clearInterval(interval);
   }, [user, courses]);

  const toggleCourse = async (courseId: string) => {
  if (expandedCourse === courseId) {
  chatUnsubRef.current?.();
  setExpandedCourse(null);
  return;
  }
 setExpandedCourse(courseId);
 setActiveCourseTab('modules');
 await fetchModulesAndResources(courseId);
 await fetchStudents(courseId);
 await fetchScheduledClasses(courseId);
 };

  const switchTab = async (tab: typeof activeCourseTab, courseId: string) => {
  setActiveCourseTab(tab);
  if (tab === 'chat') subscribeChat(courseId);
  else { chatUnsubRef.current?.(); if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; } }
  if (tab === 'students') await fetchStudents(courseId);
  if (tab === 'schedule') await fetchScheduledClasses(courseId);
  if (tab === 'modules') await fetchModulesAndResources(courseId);
  };

 const handleCreateModule = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || !showModuleModal) return;
 try {
 let finalThumbUrl = '';
 if (mThumbFile) {
 const fileRef = ref(storage, `module_thumbnails/${Date.now()}_${mThumbFile.name}`);
 const snap = await uploadBytes(fileRef, mThumbFile);
 finalThumbUrl = await getDownloadURL(snap.ref);
 }
 await addDoc(collection(db, 'course_modules'), {
 courseId: showModuleModal,
 teacherId: user.uid,
 title: mTitle,
 description: mDesc,
 order: modules.length + 1,
 lectures: [],
 thumbnailUrl: finalThumbUrl || '',
 createdAt: serverTimestamp()
 });
 setShowModuleModal(null);
 setMTitle(''); setMDesc(''); setMThumbFile(null);
 await fetchModulesAndResources(showModuleModal);
 toast.success("Module deployed");
 } catch (err) {
 toast.error("Failed to create module");
 }
 };

 const handleAddLecture = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || !showLectureModal) return;
 try {
 const moduleRef = doc(db, 'course_modules', showLectureModal.moduleId);
 const newLecture: ModuleLecture = {
 id: Date.now().toString(),
 title: lTitle,
 meetingLink: lMeet,
 recordedLink: lRec,
 createdAt: new Date().toISOString()
 };
 const mod = modules.find(m => m.id === showLectureModal.moduleId);
 const currentLectures = mod?.lectures || [];
 await updateDoc(moduleRef, { lectures: [...currentLectures, newLecture] });
 setShowLectureModal(null);
 setLTitle(''); setLMeet(''); setLRec('');
 await fetchModulesAndResources(showLectureModal.courseId);
 toast.success("Lecture added");
 } catch (err) {
 toast.error("Failed to add lecture");
 }
 };

 const handleCreateResource = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!showResourceModal) return;
 try {
 await addDoc(collection(db, 'resources'), {
 courseId: showResourceModal,
 title: rTitle,
 url: rUrl,
 createdAt: serverTimestamp()
 });
 setShowResourceModal(null);
 setRTitle(''); setRUrl('');
 await fetchModulesAndResources(showResourceModal);
 toast.success("Resource added");
 } catch (err) {
 toast.error("Failed to add resource");
 }
 };

 const handleSendChat = async (courseId: string) => {
 if (!chatInput.trim() || !user) return;
 setSendingMessage(true);
 try {
  const { error } = await db.from('course_chat_messages').insert({
  course_id: courseId,
  user_id: user.uid,
  content: chatInput,
  sender_name: user.displayName || 'Teacher',
  role: 'teacher',
  created_at: new Date().toISOString()
  });
 if (error) throw error;
 setChatInput('');
  } catch (e) {
  toast.error("Failed to send message");
 } finally {
 setSendingMessage(false);
 }
 };

 const handleScheduleClass = async (courseId: string, courseTitle: string) => {
 if (!sTitle.trim() || !sMeetLink.trim() || !user) {
 toast.error("Title and meeting link are required");
 return;
 }
 try {
 await db.from('scheduled_classes').insert({
 course_id: courseId,
 teacher_id: user.uid,
 title: sTitle,
 description: sDesc || '',
 meeting_link: sMeetLink,
 scheduled_at: sDate || new Date().toISOString(),
 created_at: new Date().toISOString()
 });
  const teacherName = user.displayName || user.email || 'A teacher';
  await notifyAdmins(courseTitle, sTitle, sMeetLink, teacherName);

  // Notify enrolled students
  try {
    const { data: enrolledStudents } = await db.from('enrollments').select('user_id').eq('course_id', courseId).eq('role', 'student');
    if (enrolledStudents && enrolledStudents.length > 0) {
      const notifInsert = enrolledStudents.map((s: any) => ({
        user_id: s.user_id,
        title: 'New Class Scheduled',
        message: `A new class "${sTitle}" has been scheduled for "${courseTitle}" on ${new Date(sDate || new Date()).toLocaleDateString()}. Join link: ${sMeetLink}`,
        type: 'schedule',
        is_read: false,
        created_at: new Date().toISOString()
      }));
      setCourseChatMessages(enriched);
    } catch (e) { console.error("Failed to load chat", e); }
  };

  const fetchScheduledClasses = async (courseId: string) => {
    try {
      const { data, error } = await db.from('scheduled_classes').select('*').eq('course_id', courseId).order('scheduled_at', { ascending: false });
      if (error) throw error;
      setScheduledClasses(data || []);
    } catch (e) { console.error("Failed to load scheduled classes", e); }
  };

  const fetchOverviewStats = async (teacherId: string) => {
    try {
      const myCourseIds = courses.map(c => c.courseId);
      let total = 0;
      if (myCourseIds.length > 0) { const { count } = await db.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', myCourseIds).eq('role', 'student'); total = count || 0; }
      setTotalStudents(total);
      const { data: earningsData } = await db.from('teacher_earnings').select('amount, created_at').eq('teacher_id', teacherId);
      if (earningsData) {
        const total = earningsData.reduce((s, r) => s + Number(r.amount || 0), 0);
        const thisMonth = earningsData.filter(r => { const d = new Date(r.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, r) => s + Number(r.amount || 0), 0);
        setEarnings({ total, monthly: thisMonth });
      }
      const { data: upcoming } = await db.from('scheduled_classes').select('*').eq('teacher_id', teacherId).gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(5);
      setUpcomingClasses(upcoming || []);
      const { data: recur } = await db.from('teacher_recurring_classes').select('*').eq('teacher_id', teacherId).eq('is_active', true);
      setRecurringClasses(recur || []);
    } catch (e) { console.error("Failed to load overview stats", e); }
  };

  const notifyAdmins = async (courseTitle: string, className: string, meetingLink: string, teacherName: string) => {
    try {
      const { data: adminUsers } = await db.from('users').select('*').in('email', ADMIN_EMAILS);
      if (adminUsers) { for (const admin of adminUsers) { await db.from('notifications').insert({ user_id: admin.id, title: 'New Class Scheduled by Teacher', message: `Teacher ${teacherName} scheduled "${className}" for course "${courseTitle}". Meeting link: ${meetingLink}`, type: 'class_scheduled', is_read: false, created_at: new Date().toISOString() }); } }
    } catch (e) { console.warn("Failed to notify admins", e); }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/login'); return; }
      setUser(u);
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesMap = new Map<string, Course>();
        coursesSnap.docs.forEach(d => coursesMap.set(d.id, { id: d.id, ...d.data() } as Course));
        const tq = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tq);
        const teacherCourses: any[] = [];
        for (const ds of tSnap.docs) {
          const data = ds.data();
          const course = coursesMap.get(data.courseId) || (() => { const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === data.courseId); return idx !== -1 ? { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course : null; })();
          if (!course) continue;
          const { count } = await db.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', data.courseId).neq('user_id', u.uid);
          teacherCourses.push({ id: ds.id, ...data, courseData: course, studentCount: count || 0 });
        }
        setCourses(teacherCourses);
        await fetchOverviewStats(u.uid);
      } catch (err) { console.error("Failed to load teacher data", err); toast.error("Failed to load courses"); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [navigate]);

  const toggleCourse = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId); setActiveCourseTab('modules');
    await fetchModulesAndResources(courseId); await fetchStudents(courseId); await fetchScheduledClasses(courseId);
  };

  const switchTab = async (tab: typeof activeCourseTab, courseId: string) => {
    setActiveCourseTab(tab);
    if (tab === 'chat') await fetchChatMessages(courseId);
    if (tab === 'students') await fetchStudents(courseId);
    if (tab === 'schedule') await fetchScheduledClasses(courseId);
    if (tab === 'modules') await fetchModulesAndResources(courseId);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showModuleModal) return;
    try {
      let finalThumbUrl = '';
      if (mThumbFile) { const fileRef = ref(storage, `module_thumbnails/${Date.now()}_${mThumbFile.name}`); const snap = await uploadBytes(fileRef, mThumbFile); finalThumbUrl = await getDownloadURL(snap.ref); }
      await addDoc(collection(db, 'course_modules'), { courseId: showModuleModal, teacherId: user.uid, title: mTitle, description: mDesc, order: modules.length + 1, lectures: [], thumbnailUrl: finalThumbUrl || '', createdAt: serverTimestamp() });
      setShowModuleModal(null); setMTitle(''); setMDesc(''); setMThumbFile(null);
      await fetchModulesAndResources(showModuleModal); toast.success("Module deployed");
    } catch (err) { toast.error("Failed to create module"); }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showLectureModal) return;
    try {
      const moduleRef = doc(db, 'course_modules', showLectureModal.moduleId);
      const newLecture: ModuleLecture = { id: Date.now().toString(), title: lTitle, meetingLink: lMeet, recordedLink: lRec, createdAt: new Date().toISOString() };
      const mod = modules.find(m => m.id === showLectureModal.moduleId);
      const currentLectures = mod?.lectures || [];
      await updateDoc(moduleRef, { lectures: [...currentLectures, newLecture] });
      setShowLectureModal(null); setLTitle(''); setLMeet(''); setLRec('');
      await fetchModulesAndResources(showLectureModal.courseId); toast.success("Lecture added");
    } catch (err) { toast.error("Failed to add lecture"); }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResourceModal) return;
    try {
      await addDoc(collection(db, 'resources'), { courseId: showResourceModal, title: rTitle, url: rUrl, createdAt: serverTimestamp() });
      setShowResourceModal(null); setRTitle(''); setRUrl('');
      await fetchModulesAndResources(showResourceModal); toast.success("Resource added");
    } catch (err) { toast.error("Failed to add resource"); }
  };

  const handleSendChat = async (courseId: string) => {
    if (!chatInput.trim() || !user) return;
    setSendingMessage(true);
    try {
      const { error } = await db.from('course_chat_messages').insert({ course_id: courseId, user_id: user.uid, content: chatInput, role: 'teacher', created_at: new Date().toISOString() });
      if (error) throw error;
      setChatInput(''); await fetchChatMessages(courseId);
    } catch (e) { toast.error("Failed to send message"); }
    finally { setSendingMessage(false); }
  };

  const handleScheduleClass = async (courseId: string, courseTitle: string) => {
    if (!sTitle.trim() || !sMeetLink.trim() || !user) { toast.error("Title and meeting link are required"); return; }
    try {
      await db.from('scheduled_classes').insert({ course_id: courseId, teacher_id: user.uid, title: sTitle, description: sDesc || '', meeting_link: sMeetLink, scheduled_at: sDate || new Date().toISOString(), created_at: new Date().toISOString() });
      const teacherName = user.displayName || user.email || 'A teacher';
      await notifyAdmins(courseTitle, sTitle, sMeetLink, teacherName);
      try {
        const { data: enrolledStudents } = await db.from('enrollments').select('user_id').eq('course_id', courseId).eq('role', 'student');
        if (enrolledStudents && enrolledStudents.length > 0) {
          const notifInsert = enrolledStudents.map((s: any) => ({ user_id: s.user_id, title: 'New Class Scheduled', message: `A new class "${sTitle}" has been scheduled for "${courseTitle}" on ${new Date(sDate || new Date()).toLocaleDateString()}. Join link: ${sMeetLink}`, type: 'schedule', is_read: false, created_at: new Date().toISOString() }));
          await db.from('notifications').insert(notifInsert);
        }
      } catch (e) { console.warn("Failed to notify students", e); }
      setShowScheduleModal(false); setSTitle(''); setSDesc(''); setSMeetLink(''); setSDate('');
      await fetchScheduledClasses(courseId); toast.success("Class scheduled! Students notified.");
    } catch (e) { toast.error("Failed to schedule class"); }
  };

  const handleCreateRecurringClass = async () => {
    if (!rcTitle.trim() || !rcLink.trim() || !user || !expandedCourse) { toast.error("Title and meeting link are required"); return; }
    try {
      await db.from('teacher_recurring_classes').insert({ teacher_id: user.uid, course_id: expandedCourse, title: rcTitle, description: rcDesc || '', meeting_link: rcLink, repeat_type: rcRepeat, start_time: rcStart || new Date().toISOString(), end_time: rcEnd || null, is_active: true, created_at: new Date().toISOString() });
      const teacherName = user.displayName || user.email || 'A teacher';
      await notifyAdmins(getCourseTitle(), rcTitle, rcLink, teacherName);
      setShowRecurringModal(false); setRcTitle(''); setRcDesc(''); setRcLink(''); setRcRepeat('daily'); setRcStart(''); setRcEnd('');
      await fetchScheduledClasses(expandedCourse); toast.success("Recurring class created! Share the link with students.");
    } catch (e) { toast.error("Failed to create recurring class"); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Link copied to clipboard!"); };

  const courseTabs = [
    { id: 'modules' as const, label: 'Modules' },
    { id: 'students' as const, label: 'Students' },
    { id: 'chat' as const, label: 'Chat' },
    { id: 'schedule' as const, label: 'Schedule' },
  ];

  const getCourseTitle = () => { if (!expandedCourse) return ''; const course = courses.find(c => c.courseId === expandedCourse); return course?.courseData?.title || 'Course'; };

  if (loading) {
    return (
      <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: 200 }} />
        <div className="skeleton skeleton-text" style={{ width: 300 }} />
        <div className="grid-3">
          <div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <span className="flabel">Teacher Console</span>
          <h1 style={{ margin: 0 }}>{viewMode === 'overview' ? 'Dashboard' : 'My Courses'}</h1>
          <p>{viewMode === 'overview' ? 'Your teaching at a glance.' : 'Manage your courses, students, chat, and schedule live classes.'}</p>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <button onClick={() => setViewMode('overview')} className="btn btn-sm" style={{ background: viewMode === 'overview' ? 'var(--accent)' : 'transparent', color: viewMode === 'overview' ? '#fff' : 'var(--ink)', borderColor: viewMode === 'overview' ? 'var(--accent)' : 'var(--ink)' }}>
Overview
          </button>
          <button onClick={() => setViewMode('courses')} className="btn btn-sm" style={{ background: viewMode === 'courses' ? 'var(--accent)' : 'transparent', color: viewMode === 'courses' ? '#fff' : 'var(--ink)', borderColor: viewMode === 'courses' ? 'var(--accent)' : 'var(--ink)' }}>
Courses
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="flex" style={{ flexDirection: 'column', gap: 24 }}>
          {/* Stats */}
          <div className="grid-4">
            <div className="bento-card" style={{ padding: '24px' }}>
              
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{totalStudents}</div>
              <span className="flabel">Total Students</span>
            </div>
            <div className="bento-card" style={{ padding: '24px' }}>
              
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{courses.length}</div>
              <span className="flabel">Total Courses</span>
            </div>
            <div className="bento-card" style={{ padding: '24px' }}>
              
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>₹{earnings.monthly.toLocaleString()}</div>
              <span className="flabel">Monthly Earnings</span>
            </div>
            <div className="bento-card" style={{ padding: '24px' }}>
              
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{upcomingClasses.length}</div>
              <span className="flabel">Upcoming Classes</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="bento-card">
              <h3 className="flex" style={{ alignItems: 'center', gap: 8, margin: '0 0 16px' }}>Total Earnings</h3>
              <div className="stat-value accented">₹{earnings.total.toLocaleString()}</div>
              <p>Lifetime earnings from all courses</p>
            </div>
            <div className="bento-card">
              <h3 className="flex" style={{ alignItems: 'center', gap: 8, margin: '0 0 16px' }}>Upcoming Classes</h3>
              {upcomingClasses.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No upcoming classes scheduled.</p>
              ) : (
                <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                  {upcomingClasses.map((c) => (
                    <div key={c.id} className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{c.title}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ink-mute)' }}>
                          {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}
                        </p>
                      </div>
                      <div className="flex" style={{ gap: 4, alignItems: 'center' }}>
                        <a href={c.meeting_link} target="_blank" rel="noreferrer" className="btn btn-xs btn-primary" style={{ textDecoration: 'none' }}>Join</a>
                        <button onClick={() => copyToClipboard(c.meeting_link)} className="btn btn-xs">Copy</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurring */}
          <div className="bento-card">
            <h3 className="flex" style={{ alignItems: 'center', gap: 8, margin: '0 0 16px' }}>Recurring / Daily Classes</h3>
            {recurringClasses.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No recurring classes. Switch to Courses tab to create one.</p>
            ) : (
              <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                {recurringClasses.map((rc) => (
                  <div key={rc.id} className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                    <div>
                      <div className="flex" style={{ alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{rc.repeat_type}</span>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{rc.title}</p>
                      </div>
                      {rc.description && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{rc.description}</p>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>
                        {rc.start_time ? new Date(rc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Anytime'}
                        {rc.end_time ? ` - ${new Date(rc.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                    </div>
                    <div className="flex" style={{ gap: 4, alignItems: 'center' }}>
                      <a href={rc.meeting_link} target="_blank" rel="noreferrer" className="btn btn-xs btn-primary" style={{ textDecoration: 'none' }}>Join</a>
                      <button onClick={() => copyToClipboard(rc.meeting_link)} className="btn btn-xs">Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'courses' && (courses.length === 0 ? (
        <div className="empty-state">
          
          <h3>No Courses Assigned</h3>
          <p>You haven't been assigned any courses to teach yet.</p>
        </div>
      ) : (
        <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
          {courses.map((course) => (
            <div key={course.id}>
              <button onClick={() => toggleCourse(course.courseId!)} className="btn" style={{ width: '100%', textAlign: 'left', padding: '16px 20px', justifyContent: 'space-between', background: 'var(--bg-surface)', height: 'auto' }}>
                <div>
                  <div className="flex" style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="flabel">Teacher</span>
                    <span className="badge">{course.studentCount} enrolled</span>
                  </div>
                  <h3 style={{ margin: 0, textAlign: 'left' }}>{course.courseData?.title || 'Unknown Course'}</h3>
                  <p style={{ margin: '4px 0 0', textAlign: 'left' }}>{course.courseData?.description}</p>
                </div>
                <div className="flex" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Link to={`/classroom/${course.courseId}`} onClick={(e) => e.stopPropagation()} className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>Open Classroom</Link>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5z" fill="var(--ink)" /></svg>
                </div>
              </button>

              {expandedCourse === course.courseId && (
                <div className="bento-card" style={{ marginTop: 0, borderTop: 'none' }}>
                  {/* Course Tabs */}
                  <div className="flex" style={{ gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                    {courseTabs.map(tab => (
                      <button key={tab.id} onClick={() => switchTab(tab.id, course.courseId!)}
                        className="btn btn-xs"
                        style={{ background: activeCourseTab === tab.id ? 'var(--accent)' : 'transparent', color: activeCourseTab === tab.id ? '#fff' : 'var(--ink)', borderColor: activeCourseTab === tab.id ? 'var(--accent)' : 'var(--ink)' }}
                      >{tab.label}</button>
                    ))}
                  </div>

                  {activeCourseTab === 'modules' && (
                    <div>
                      <div className="flex" style={{ gap: 8, marginBottom: 16 }}>
                        <button onClick={() => setShowModuleModal(course.courseId!)} className="btn btn-sm btn-primary">+ New Module</button>
                        <button onClick={() => setShowResourceModal(course.courseId!)} className="btn btn-sm btn-secondary">Add Resource</button>
                      </div>
                      {loadingModules ? (
                        <div className="flex" style={{ justifyContent: 'center', padding: 24 }}>Loading...</div>
                      ) : (
                        <div className="grid-2">
                          <div>
                            <h4 className="flex" style={{ alignItems: 'center', gap: 6, margin: '0 0 12px' }}>Modules ({modules.length})</h4>
                            {modules.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No modules yet. Create your first module to start building the curriculum.</p>
                            ) : (
                              <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                                {modules.map((mod) => (
                                  <div key={mod.id} className="bento-card-compact" style={{ border: '1px solid var(--rule-soft)' }}>
                                    <div className="flex" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{mod.title}</p>
                                        {mod.description && <p style={{ margin: '2px 0', fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{mod.description}</p>}
                                        <span className="flabel" style={{ fontSize: '0.6rem' }}>{mod.lectures?.length || 0} lectures</span>
                                      </div>
                                      <button onClick={() => setShowLectureModal({ courseId: course.courseId!, moduleId: mod.id })} className="btn btn-xs btn-secondary"> Add Lecture</button>
                                    </div>
                                    {mod.lectures && mod.lectures.length > 0 && (
                                      <div className="flex" style={{ flexDirection: 'column', gap: 4, marginTop: 8, borderTop: '1px solid var(--rule-soft)', paddingTop: 8 }}>
                                        {mod.lectures.map((lec) => (
                                          <div key={lec.id} className="flex" style={{ alignItems: 'center', gap: 8 }}>
                                            <span className="flabel" style={{ fontSize: '0.55rem' }}>{lec.title}</span>

                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="flex" style={{ alignItems: 'center', gap: 6, margin: '0 0 12px' }}>Resources ({resources.length})</h4>
                            {resources.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No resources yet.</p>
                            ) : (
                              <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
                                {resources.map((r) => (
                                  <div key={r.id} className="flex" style={{ alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--rule-soft)' }}>

                                    <p style={{ margin: 0, fontSize: '0.8rem', flex: 1 }}>{r.title}</p>
                                    <a href={r.url} target="_blank" rel="noreferrer"></a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeCourseTab === 'students' && (
                    <div>
                      <h4 className="flex" style={{ alignItems: 'center', gap: 6, margin: '0 0 12px' }}>Enrolled Students ({students.length})</h4>
                      {loadingStudents ? (
                        <div className="flex" style={{ justifyContent: 'center', padding: 24 }}>Loading...</div>
                      ) : students.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No students enrolled yet.</p>
                      ) : (
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr><th>Name</th><th>Plan</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                              {students.map((s) => (
                                <tr key={s.id}>
                                  <td>
                                    <div className="flex" style={{ alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 32, height: 32, border: '1px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                        {s.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>{s.name}</p>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>{s.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td><span className={`badge ${s.plan === 'full' ? 'badge-accent' : s.plan === 'trial' ? 'badge-warning' : ''}`} style={{ fontSize: '0.65rem' }}>{s.plan}</span></td>
                                  <td><span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>{s.student_status || 'active'}</span></td>
                                  <td>{s.plan === 'trial' || s.plan === 'first_class' ? <button className="btn btn-xs btn-primary">Upgrade</button> : null}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeCourseTab === 'chat' && (
                    <div>
                      <p className="flex" style={{ alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>
                        Course Chat — Students & Teacher
                      </p>
                      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
                        {courseChatMessages.length === 0 ? (
                          <div className="empty-state" style={{ padding: '24px' }}>
                            
                            <p>No messages yet. Start the conversation with your students.</p>
                          </div>
                        ) : (
                          <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                            {courseChatMessages.map((msg) => (
                              <div key={msg.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                                <div className="flex" style={{ alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                  <span className="flabel" style={{ fontSize: '0.65rem' }}>{msg.senderName}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--ink-mute)' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex" style={{ gap: 8 }}>
                        <input className="input" value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(course.courseId!); } }}
                          placeholder="Type a message to students..." />
                        <button className="btn btn-primary" onClick={() => handleSendChat(course.courseId!)} disabled={sendingMessage || !chatInput.trim()}>
                          {sendingMessage ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeCourseTab === 'schedule' && (
                    <div>
                      <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h4 className="flex" style={{ alignItems: 'center', gap: 6, margin: 0 }}>Scheduled Classes</h4>
                        <button onClick={() => { setShowScheduleModal(true); setShowRecurringModal(false); }} className="btn btn-sm btn-primary">+ Schedule Class</button>
                      </div>
                      {scheduledClasses.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink-mute)' }}>No classes scheduled yet.</p>
                      ) : (
                        <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                          {scheduledClasses.map((sc) => (
                            <div key={sc.id} className="bento-card-compact flex" style={{ alignItems: 'center', gap: 12, justifyContent: 'space-between', border: '1px solid var(--rule-soft)' }}>
                              <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
                                
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600 }}>{sc.title}</p>
                                  {sc.description && <p style={{ margin: '2px 0', fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{sc.description}</p>}
                                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>
                                    {sc.scheduled_at ? new Date(sc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date set'}
                                  </span>
                                </div>
                              </div>
                              <a href={sc.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>Join</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ── Modals ── */}
      {showModuleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-bg)' }} onClick={() => setShowModuleModal(null)} />
          <div className="bento-card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
            <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>New Module</h3>
              <button onClick={() => setShowModuleModal(null)} className="btn" style={{ padding: '6px 10px', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleCreateModule}>
              <div className="form-group"><label className="form-label">Title</label><input className="input" value={mTitle} onChange={e => setMTitle(e.target.value)} required placeholder="e.g. Introduction to the Course" /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="input" value={mDesc} onChange={e => setMDesc(e.target.value)} rows={3} placeholder="Brief overview of this module" /></div>
              <div className="form-group"><label className="form-label">Thumbnail (optional)</label><input type="file" accept="image/*" onChange={e => setMThumbFile(e.target.files?.[0] || null)} /></div>
              <button type="submit" className="btn btn-primary btn-full">Create Module</button>
            </form>
          </div>
        </div>
      )}

      {showLectureModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-bg)' }} onClick={() => setShowLectureModal(null)} />
          <div className="bento-card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
            <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>New Lecture</h3>
              <button onClick={() => setShowLectureModal(null)} className="btn" style={{ padding: '6px 10px', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAddLecture}>
              <div className="form-group"><label className="form-label">Title</label><input className="input" value={lTitle} onChange={e => setLTitle(e.target.value)} required placeholder="e.g. Live Session 1" /></div>
              <div className="form-group"><label className="form-label">Meeting Link (for live classes)</label><input className="input" value={lMeet} onChange={e => setLMeet(e.target.value)} placeholder="https://meet.google.com/..." /></div>
              <div className="form-group"><label className="form-label">Recorded Link (optional)</label><input className="input" value={lRec} onChange={e => setLRec(e.target.value)} placeholder="https://youtube.com/..." /></div>
              <button type="submit" className="btn btn-primary btn-full">Add Lecture</button>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-bg)' }} onClick={() => setShowResourceModal(null)} />
          <div className="bento-card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
            <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Add Resource</h3>
              <button onClick={() => setShowResourceModal(null)} className="btn" style={{ padding: '6px 10px', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group"><label className="form-label">Title</label><input className="input" value={rTitle} onChange={e => setRTitle(e.target.value)} required placeholder="e.g. Course Notes PDF" /></div>
              <div className="form-group"><label className="form-label">URL</label><input className="input" value={rUrl} onChange={e => setRUrl(e.target.value)} required placeholder="https://..." /></div>
              <button type="submit" className="btn btn-primary btn-full">Add Resource</button>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-bg)' }} onClick={() => setShowScheduleModal(false)} />
          <div className="bento-card" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
            <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Schedule a Class</h3>
              <button onClick={() => setShowScheduleModal(false)} className="btn" style={{ padding: '6px 10px', lineHeight: 1 }}>×</button>
            </div>
            <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
              <div className="form-group"><label className="form-label">Class Title</label><input className="input" value={sTitle} onChange={e => setSTitle(e.target.value)} required placeholder="e.g. Live Q&A Session" /></div>
              <div className="form-group"><label className="form-label">Description (optional)</label><textarea className="input" value={sDesc} onChange={e => setSDesc(e.target.value)} rows={2} placeholder="What is this class about?" /></div>
              <div className="form-group"><label className="form-label">Meeting Link</label><input className="input" value={sMeetLink} onChange={e => setSMeetLink(e.target.value)} required placeholder="https://meet.google.com/..." /></div>
              <div className="form-group"><label className="form-label">Scheduled Date & Time</label><input className="input" value={sDate} onChange={e => setSDate(e.target.value)} type="datetime-local" /></div>
              <button onClick={() => handleScheduleClass(expandedCourse!, getCourseTitle())} className="btn btn-primary btn-full">
                Schedule Class & Notify Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  setShowScheduleModal(false);
  setSTitle(''); setSDesc(''); setSMeetLink(''); setSDate('');
  await fetchScheduledClasses(courseId);
  toast.success("Class scheduled! Students notified.");
 } catch (e) {
 toast.error("Failed to schedule class");
 }
 };

 const handleCreateRecurringClass = async () => {
 if (!rcTitle.trim() || !rcLink.trim() || !user || !expandedCourse) {
 toast.error("Title and meeting link are required");
 return;
 }
 try {
 await db.from('teacher_recurring_classes').insert({
 teacher_id: user.uid,
 course_id: expandedCourse,
 title: rcTitle,
 description: rcDesc || '',
 meeting_link: rcLink,
 repeat_type: rcRepeat,
 start_time: rcStart || new Date().toISOString(),
 end_time: rcEnd || null,
 is_active: true,
 created_at: new Date().toISOString()
 });
 const teacherName = user.displayName || user.email || 'A teacher';
 await notifyAdmins(getCourseTitle(), rcTitle, rcLink, teacherName);
 setShowRecurringModal(false);
 setRcTitle(''); setRcDesc(''); setRcLink(''); setRcRepeat('daily'); setRcStart(''); setRcEnd('');
 await fetchScheduledClasses(expandedCourse);
 toast.success("Recurring class created! Share the link with students.");
 } catch (e) {
 toast.error("Failed to create recurring class");
 }
 };

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 toast.success("Link copied to clipboard!");
 };

 const courseTabs = [
 { id: 'modules' as const, label: 'Modules', icon: BookOpen },
 { id: 'students' as const, label: 'Students', icon: Users },
 { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
 { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
 ];

 const getCourseTitle = () => {
 if (!expandedCourse) return '';
 const course = courses.find(c => c.courseId === expandedCourse);
 return course?.courseData?.title || 'Course';
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-slate-50 [#020617] flex items-center justify-center">
 <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
 </div>
 );
 }

 return (
 <div className="min-h-screen pt-24 sm:pt-28 pb-24 sm:pb-32 px-4 sm:px-6 bg-slate-50 [#020617] selection:bg-purple-500/30">
 <div className="fixed inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[60px] rounded-full" />
 <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[60px] rounded-full" />
 </div>
 <div className="max-w-[1400px] mx-auto relative z-10">
 <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 :text-white transition-colors text-sm font-bold mb-8 group">
 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
 Back to Dashboard
 </Link>

 <header className="mb-8">
 <div className="flex items-center gap-3 mb-4">
 <span className="px-4 py-1.5 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
 Teacher Console
 </span>
 </div>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-[2rem] sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-2">
  {viewMode === 'overview' ? 'Dashboard' : <>My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Courses</span></>}
 </h1>
 <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-xl">
 {viewMode === 'overview' ? 'Your teaching at a glance.' : 'Manage your courses, students, chat, and schedule live classes.'}
 </p>
 </div>
 <div className="flex gap-2 w-full sm:w-auto">
 <button onClick={() => setViewMode('overview')} className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm transition-colors ${viewMode === 'overview' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700'}`}>
 <BarChart3 className="w-4 h-4 inline mr-2" />Overview
 </button>
 <button onClick={() => setViewMode('courses')} className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm transition-colors ${viewMode === 'courses' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700'}`}>
 <BookOpen className="w-4 h-4 inline mr-2" />Courses
 </button>
 </div>
 </div>
 </header>

 {viewMode === 'overview' && (
 <div className="space-y-8">
 {/* Stats cards */}
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">{totalStudents}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Students</p>
  </div>
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">{courses.length}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Courses</p>
  </div>
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">{firstClassStudents}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">First Class</p>
  </div>
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">{fullAccessStudents}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Full Access</p>
  </div>
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">₹{earnings.monthly.toLocaleString()}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Monthly Earnings</p>
  </div>
   <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 shadow-sm">
   <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-2" />
   <p className="text-xl sm:text-2xl font-black text-slate-900 ">{upcomingClasses.length}</p>
  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Upcoming Classes</p>
  </div>
  </div>

 {/* Total earnings & Upcoming classes */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm">
  <h3 className="font-black text-lg mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-500" /> Total Earnings</h3>
  <p className="text-3xl sm:text-4xl font-black text-slate-900 ">₹{earnings.total.toLocaleString()}</p>
 <p className="text-xs text-slate-400 font-medium mt-1">Lifetime earnings from all courses</p>
 </div>
  <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm">
  <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> Upcoming Classes</h3>
 {upcomingClasses.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-6">No upcoming classes scheduled.</p>
 ) : (
 <div className="space-y-3">
 {upcomingClasses.map((c) => (
 <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 /50 rounded-xl">
 <div>
 <p className="font-bold text-sm text-slate-900 ">{c.title}</p>
 <p className="text-xs text-slate-400">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}</p>
 </div>
 <div className="flex gap-2">
 <a href={c.meeting_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 transition-colors">Join</a>
 <button onClick={() => copyToClipboard(c.meeting_link)} className="p-2 bg-slate-200 rounded-xl hover:bg-slate-300 :bg-slate-600 transition-colors"><Copy className="w-4 h-4" /></button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Recurring classes */}
 <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
 <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-purple-500" /> Recurring / Daily Classes</h3>
 {recurringClasses.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-6">No recurring classes. Switch to Courses tab to create one.</p>
 ) : (
 <div className="space-y-3">
 {recurringClasses.map((rc) => (
 <div key={rc.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 /50 rounded-2xl border border-slate-200 /50">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="px-2 py-0.5 bg-purple-100 /30 text-purple-600 rounded-lg text-[10px] font-bold uppercase">{rc.repeat_type}</span>
 <p className="font-bold text-slate-900 ">{rc.title}</p>
 </div>
 {rc.description && <p className="text-xs text-slate-500">{rc.description}</p>}
 <p className="text-xs text-slate-400 font-medium mt-1">{rc.start_time ? new Date(rc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Anytime'} {rc.end_time ? `- ${new Date(rc.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
 </div>
 <div className="flex gap-2 shrink-0 ml-4">
 <a href={rc.meeting_link} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 transition-colors">Join</a>
 <button onClick={() => copyToClipboard(rc.meeting_link)} className="p-2.5 bg-slate-200 rounded-xl hover:bg-slate-300 :bg-slate-600 transition-colors"><Copy className="w-4 h-4" /></button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {viewMode === 'courses' && (courses.length === 0 ? (
 <div className="text-center py-24 bg-white /50 rounded-[3rem] border-2 border-dashed border-slate-200 ">
 <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-6" />
 <h3 className="text-2xl font-black text-slate-400">No Teaching Courses Yet</h3>
 <p className="text-slate-500 font-medium mt-2">Once an admin approves your mentor application, your courses will appear here.</p>
 </div>
 ) : (
 <div className="space-y-6">
 {courses.map((course, idx) => (
 <motion.div
 key={course.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.05 }}
 className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm"
 >
 <button onClick={() => toggleCourse(course.courseId!)} className="w-full p-5 sm:p-8 flex items-center justify-between hover:bg-slate-50 :bg-slate-800/30 transition-colors text-left">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className="px-3 py-1 bg-purple-100 /30 text-purple-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Teacher</span>
  <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
  <Users className="w-4 h-4" /> {course.studentCount} enrolled
  </span>
  {unreadCounts[course.courseId!] > 0 && (
  <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full">
  {unreadCounts[course.courseId!]} new
  </span>
  )}
  </div>
  <h3 className="text-xl sm:text-2xl font-black text-slate-900 ">{course.courseData?.title || 'Unknown Course'}</h3>
  <p className="text-slate-500 font-medium mt-1 line-clamp-1">{course.courseData?.description}</p>
  </div>
  <div className="flex items-center gap-3 shrink-0 ml-6">
  <Link to={`/classroom/${course.courseId}`} onClick={(e) => e.stopPropagation()} className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-colors text-sm">
  Open Classroom
  </Link>
 <div className={`w-3 h-3 rounded-full transition-transform ${expandedCourse === course.courseId ? 'rotate-180' : ''}`}>
 <svg viewBox="0 0 24 24" className="w-3 h-3 fill-slate-400"><path d="M7 10l5 5 5-5z"/></svg>
 </div>
 </div>
 </button>

 <AnimatePresence mode="wait">
  {expandedCourse === course.courseId && (
  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden will-change-transform">
 <div className="px-5 sm:px-8 pb-5 sm:pb-8 border-t border-slate-100 ">
 {/* Course Tabs */}
 <div className="flex gap-1 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-4 pb-2 border-b border-slate-100 mb-6 overflow-x-auto">
  {courseTabs.map(tab => (
  <button
  key={tab.id}
  onClick={() => switchTab(tab.id, course.courseId!)}
  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap ${
  activeCourseTab === tab.id
  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
  : 'text-slate-500 hover:bg-slate-100 :bg-slate-800'
  }`}
  >
  <tab.icon className="w-4 h-4" />
  {tab.label}
  {tab.id === 'chat' && unreadCounts[course.courseId!] > 0 && activeCourseTab !== 'chat' && (
  <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full min-w-[18px] text-center">
  {unreadCounts[course.courseId!]}
  </span>
  )}
  </button>
  ))}
 </div>

 {/* Tab Content */}
 {activeCourseTab === 'modules' && (
 <div className="space-y-8">
 {/* Quick Actions */}
 <div className="flex flex-wrap gap-3">
 <button onClick={() => setShowModuleModal(course.courseId!)} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors text-sm">
 <Plus className="w-4 h-4" /> New Module
 </button>
 <button onClick={() => setShowResourceModal(course.courseId!)} className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors text-sm">
 <FileText className="w-4 h-4" /> Add Resource
 </button>
 </div>

 {loadingModules ? (
 <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
 ) : (
 <>
 <div>
 <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
 <BookOpen className="w-5 h-5 text-purple-500" /> Modules ({modules.length})
 </h4>
 {modules.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-6 text-center bg-slate-50 /30 rounded-2xl">No modules yet. Create your first module to start building the curriculum.</p>
 ) : (
 <div className="space-y-3">
 {modules.map((mod) => (
 <div key={mod.id} className="bg-slate-50 /30 rounded-2xl p-4 sm:p-5 border border-slate-200 /50">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <h5 className="font-bold text-slate-900 ">{mod.title}</h5>
 {mod.description && <p className="text-sm text-slate-500 mt-1">{mod.description}</p>}
 <p className="text-xs text-slate-400 font-medium mt-2">{mod.lectures?.length || 0} lectures</p>
 </div>
 <button onClick={() => setShowLectureModal({ courseId: course.courseId!, moduleId: mod.id })} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white font-bold rounded-xl transition-colors text-xs">
 <Video className="w-3.5 h-3.5" /> Add Lecture
 </button>
 </div>
 {mod.lectures && mod.lectures.length > 0 && (
 <div className="mt-4 space-y-2 pl-4 border-l-2 border-purple-200 ">
 {mod.lectures.map((lec) => (
 <div key={lec.id} className="flex items-center gap-3 text-sm">
 <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
 <span className="font-medium text-slate-700 flex-1">{lec.title}</span>
 {lec.meetingLink && (
 <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600">
 <Video className="w-4 h-4" />
 </a>
 )}
 {lec.recordedLink && (
 <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600">
 <ExternalLink className="w-4 h-4" />
 </a>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 <div>
 <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-blue-500" /> Resources ({resources.length})
 </h4>
 {resources.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-6 text-center bg-slate-50 /30 rounded-2xl">No resources yet.</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {resources.map((r) => (
 <div key={r.id} className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 /30 rounded-2xl border border-slate-200 /50">
 <FileText className="w-5 h-5 text-blue-500 shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="font-bold text-sm text-slate-900 truncate">{r.title}</p>
 </div>
 <a href={r.url} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-colors">
 <ExternalLink className="w-4 h-4" />
 </a>
 </div>
 ))}
 </div>
 )}
 </div>
 </>
 )}
 </div>
 )}

 {/* Students Tab */}
 {activeCourseTab === 'students' && (
 <div>
 <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-purple-500" /> Enrolled Students ({students.length})
 </h4>
 {loadingStudents ? (
 <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
 ) : students.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-12 text-center bg-slate-50 /30 rounded-2xl">No students enrolled yet.</p>
 ) : (
 <div className="space-y-3">
  {students.map((s) => (
  <div key={s.id} className="flex items-center gap-4 p-4 sm:p-5 bg-slate-50 /30 rounded-2xl border border-slate-200 /50">
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center font-black text-white text-lg shrink-0">
  {s.name.charAt(0).toUpperCase()}
  </div>
   <div className="flex-1 min-w-0">
     <p className="font-bold text-slate-900 truncate">{s.name}</p>
     <p className="text-xs text-slate-400 font-medium truncate">{s.email}</p>
     <div className="flex items-center gap-2 mt-1 flex-wrap">
       {s.plan === 'full' && (
         <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase tracking-wider">Full</span>
       )}
       {s.plan === 'first_class' && (
         <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wider">First Class</span>
       )}
       {s.created_at && (
         <span className="text-[9px] text-slate-400 font-medium">Joined {new Date(s.created_at).toLocaleDateString()}</span>
       )}
     </div>
   </div>
   <div className="flex items-center gap-2 shrink-0">
     {s.plan === 'first_class' ? (
       <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] transition-colors whitespace-nowrap">
         Upgrade
       </button>
     ) : null}
     <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
      s.student_status === 'active'
      ? 'bg-emerald-100 /30 text-emerald-600 '
      : 'bg-slate-100 text-slate-500'
     }`}>
      {s.student_status || 'active'}
     </span>
   </div>
  </div>
  ))}
 </div>
 )}
 </div>
 )}

 {/* Chat Tab */}
 {activeCourseTab === 'chat' && (
 <div className="flex flex-col h-[500px] bg-slate-50 /30 rounded-2xl border border-slate-200 /50 overflow-hidden">
 <div className="p-4 border-b border-slate-200 /50">
 <h4 className="font-black text-sm flex items-center gap-2">
 <MessageSquare className="w-4 h-4 text-purple-500" />
 Course Chat — Students & Teacher
 </h4>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {courseChatMessages.length === 0 ? (
 <div className="text-center py-16">
 <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <p className="text-sm font-medium text-slate-400">No messages yet</p>
 <p className="text-xs text-slate-500 mt-1">Start the conversation with your students</p>
 </div>
 ) : (
 courseChatMessages.map((msg) => (
 <div key={msg.id} className={`flex ${msg.role === 'teacher' && msg.user_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[75%] p-4 rounded-2xl ${
 msg.role === 'teacher' && msg.user_id === user?.uid
 ? 'bg-purple-500 text-white rounded-br-md'
 : 'bg-white text-slate-900 rounded-bl-md border border-slate-200 /50'
 }`}>
 <p className="text-xs font-bold opacity-70 mb-1">{msg.senderName}</p>
 <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
 <p className={`text-[10px] mt-1 ${msg.role === 'teacher' && msg.user_id === user?.uid ? 'text-purple-200' : 'text-slate-400'}`}>
 {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 <div className="p-4 border-t border-slate-200 /50">
 <div className="flex gap-3">
 <input
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(course.courseId!); } }}
 placeholder="Type a message to students..."
 className="flex-1 p-4 bg-white rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors text-sm"
 />
 <button
 onClick={() => handleSendChat(course.courseId!)}
 disabled={sendingMessage || !chatInput.trim()}
 className="px-6 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Schedule Tab */}
 {activeCourseTab === 'schedule' && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
 <Calendar className="w-5 h-5 text-purple-500" /> Scheduled Classes
 </h4>
 <button onClick={() => setShowScheduleModal(true)} className="flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl transition-colors text-sm">
 <Plus className="w-4 h-4" /> Schedule Class
 </button>
 </div>

 {scheduledClasses.length === 0 ? (
 <p className="text-slate-400 font-medium text-sm py-12 text-center bg-slate-50 /30 rounded-2xl">No classes scheduled yet.</p>
 ) : (
 <div className="space-y-3">
 {scheduledClasses.map((sc) => (
 <div key={sc.id} className="flex items-center gap-4 p-5 bg-slate-50 /30 rounded-2xl border border-slate-200 /50">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white shrink-0">
 <Calendar className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-slate-900 ">{sc.title}</p>
 {sc.description && <p className="text-xs text-slate-500 mt-0.5">{sc.description}</p>}
 <p className="text-xs text-slate-400 font-medium mt-1">
 {sc.scheduled_at ? new Date(sc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date set'}
 </p>
 </div>
 <a href={sc.meeting_link} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors text-xs flex items-center gap-1.5 shrink-0">
 <Video className="w-3.5 h-3.5" /> Join
 </a>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 ))}
 </div>
 ))}
 </div>

 {/* Module Modal */}
 <AnimatePresence>
 {showModuleModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModuleModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 sm:p-8">
  <div className="flex justify-between items-center mb-6">
  <h3 className="text-2xl font-black">New Module</h3>
 <button onClick={() => setShowModuleModal(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleCreateModule} className="space-y-5">
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
 <input value={mTitle} onChange={e => setMTitle(e.target.value)} required placeholder="e.g. Introduction to the Course" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
 <textarea value={mDesc} onChange={e => setMDesc(e.target.value)} rows={3} placeholder="Brief overview of this module" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors resize-none" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Thumbnail (optional)</label>
 <input type="file" accept="image/*" onChange={e => setMThumbFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100" />
 </div>
 <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-colors">Create Module</button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Lecture Modal */}
 <AnimatePresence>
 {showLectureModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLectureModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 sm:p-8">
  <div className="flex justify-between items-center mb-6">
  <h3 className="text-2xl font-black">New Lecture</h3>
 <button onClick={() => setShowLectureModal(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleAddLecture} className="space-y-5">
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
 <input value={lTitle} onChange={e => setLTitle(e.target.value)} required placeholder="e.g. Live Session 1" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Meeting Link (for live classes)</label>
 <input value={lMeet} onChange={e => setLMeet(e.target.value)} placeholder="https://meet.google.com/..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Recorded Link (optional)</label>
 <input value={lRec} onChange={e => setLRec(e.target.value)} placeholder="https://youtube.com/..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <button type="submit" className="w-full py-4 bg-purple-500 text-white font-black rounded-2xl hover:bg-purple-600 transition-colors">Add Lecture</button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Resource Modal */}
 <AnimatePresence>
 {showResourceModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResourceModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 sm:p-8">
  <div className="flex justify-between items-center mb-6">
  <h3 className="text-2xl font-black">Add Resource</h3>
 <button onClick={() => setShowResourceModal(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleCreateResource} className="space-y-5">
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
 <input value={rTitle} onChange={e => setRTitle(e.target.value)} required placeholder="e.g. Course Notes PDF" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">URL</label>
 <input value={rUrl} onChange={e => setRUrl(e.target.value)} required placeholder="https://..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <button type="submit" className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-600 transition-colors">Add Resource</button>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Schedule Class Modal */}
 <AnimatePresence>
 {showScheduleModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScheduleModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-2xl font-black">Schedule a Class</h3>
 <button onClick={() => setShowScheduleModal(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
 </div>
 <div className="space-y-5">
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Class Title</label>
 <input value={sTitle} onChange={e => setSTitle(e.target.value)} required placeholder="e.g. Live Q&A Session" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Description (optional)</label>
 <textarea value={sDesc} onChange={e => setSDesc(e.target.value)} rows={2} placeholder="What is this class about?" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors resize-none" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Meeting Link</label>
 <input value={sMeetLink} onChange={e => setSMeetLink(e.target.value)} required placeholder="https://meet.google.com/..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors" />
 </div>
 <div>
 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Scheduled Date & Time</label>
 <input value={sDate} onChange={e => setSDate(e.target.value)} type="datetime-local" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors" />
 </div>
 <button onClick={() => handleScheduleClass(expandedCourse!, getCourseTitle())} className="w-full py-4 bg-purple-500 text-white font-black rounded-2xl hover:bg-purple-600 transition-colors">
 Schedule Class & Notify Admin
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default TeacherPanel;
