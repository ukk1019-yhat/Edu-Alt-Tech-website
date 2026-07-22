import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, onAuthStateChanged, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, where, createEnrollment } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, CalendarClock, X, LayoutDashboard, Database, ClipboardList, ArrowLeft, MessageSquare, BarChart3, Send, MoreVertical, Calendar, Video, Pencil, Trash2, Plus, Save, Eye, EyeOff } from 'lucide-react';
import { TeacherApplication } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import HamsterLoader from '../components/HamsterLoader';

const ADMIN_EMAILS = ['ukkukk97@gmail.com', 'umakrishnakanthchokkapu15@gmail.com', 'akulasatyanarayana2006@gmail.com'];

const AdminDashboard: React.FC = () => {
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<'applications' | 'chat' | 'stats' | 'classes' | 'courses'>('applications');
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const navigate = useNavigate();

  // Data states
  const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
 const [selectedApp, setSelectedApp] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string }) | null>(null);

 // Chat states
 const [chatContacts, setChatContacts] = useState<{ id: string; name: string; email: string }[]>([]);
 const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; email: string } | null>(null);
 const [chatMessages, setChatMessages] = useState<{ id: string; user_id: string; content: string; role: string; created_at: string }[]>([]);
 const [chatInput, setChatInput] = useState('');
 const [sendingMessage, setSendingMessage] = useState(false);

 // Stats states
 const [coursesList, setCoursesList] = useState<any[]>([]);
 const [enrollments, setEnrollments] = useState<any[]>([]);

 // Scheduled classes
 const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
 const [loadingClasses, setLoadingClasses] = useState(false);

  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [enrollmentUserMap, setEnrollmentUserMap] = useState<Record<string, { name: string; email: string }>>({});

  // Course management states
 const [courseSearch, setCourseSearch] = useState('');
 const [coursePriceFilter, setCoursePriceFilter] = useState<'all' | 'free' | 'paid'>('all');
 const [editingCourse, setEditingCourse] = useState<any>(null);
 const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
 const [courseForm, setCourseForm] = useState({
 title: '', description: '', price: 0, folder: '', category: 'alternative' as string,
 thumbnailUrl: '', duration: '', level: '', classLevel: '', externalUrl: '', comingSoon: false
 });
 const [savingCourse, setSavingCourse] = useState(false);

 const openAddCourse = () => {
 setCourseForm({ title: '', description: '', price: 0, folder: '', category: 'alternative', thumbnailUrl: '', duration: '', level: '', classLevel: '', externalUrl: '', comingSoon: false });
 setEditingCourse(null);
 setIsCourseModalOpen(true);
 };

 const openEditCourse = (course: any) => {
 setCourseForm({
 title: course.title || '',
 description: course.description || '',
 price: course.price ?? 0,
 folder: course.folder || '',
 category: course.category || 'alternative',
 thumbnailUrl: course.thumbnailUrl || '',
 duration: course.duration || '',
 level: course.level || '',
 classLevel: course.classLevel || '',
 externalUrl: course.externalUrl || '',
 comingSoon: course.comingSoon ?? false,
 });
 setEditingCourse(course);
 setIsCourseModalOpen(true);
  };

  const isPlatformCourse = (id: string) => id.startsWith('pc-');

  const savePlatformOverrides = (overrides: Record<string, any>) => {
  localStorage.setItem('platformCourseOverrides', JSON.stringify(overrides));
  };

  const applyPlatformOverrides = (list: any[]) => {
  try {
  const raw = localStorage.getItem('platformCourseOverrides');
  if (!raw) return list;
  const overrides = JSON.parse(raw);
  return list.map(c => overrides[c.id] ? { ...c, ...overrides[c.id] } : c);
  } catch { return list; }
  };

  const deletePlatformFromStorage = (id: string) => {
  try {
  const raw = localStorage.getItem('platformCourseOverrides');
  if (raw) {
  const overrides = JSON.parse(raw);
  delete overrides[id];
  localStorage.setItem('platformCourseOverrides', JSON.stringify(overrides));
  }
  const deleted = JSON.parse(localStorage.getItem('platformCourseDeletions') || '[]');
  if (!deleted.includes(id)) {
  deleted.push(id);
  localStorage.setItem('platformCourseDeletions', JSON.stringify(deleted));
  }
  } catch (e) { console.error('AdminDashboard: Failed to delete platform course from storage', e); }
  };

  const handleSaveCourse = async () => {
  if (!courseForm.title.trim()) { toast.error('Title is required'); return; }
  setSavingCourse(true);
  try {
  if (editingCourse) {
  if (isPlatformCourse(editingCourse.id)) {
   const overrides = { ...courseForm, comingSoon: editingCourse.comingSoon };
   savePlatformOverrides({ ...JSON.parse(localStorage.getItem('platformCourseOverrides') || '{}'), [editingCourse.id]: overrides });
   setCoursesList(prev => applyPlatformOverrides(prev.map(c => c.id === editingCourse.id ? { ...c, ...courseForm } : c)));
    try { await db.from('platform_overrides').upsert({ id: editingCourse.id, data: overrides }, { onConflict: 'id' }); } catch (e) { console.error('AdminDashboard: Failed to sync platform course overrides to Supabase', e); }
    toast.success('Platform course updated');
  } else {
  await updateDoc(doc(db, 'courses', editingCourse.id), courseForm);
  toast.success('Course updated');
  }
  } else {
  await addDoc(collection(db, 'courses'), { ...courseForm, createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' });
  toast.success('Course created');
  }
  setIsCourseModalOpen(false);
  } catch (e: any) {
  toast.error(e?.message || 'Failed to save course');
  } finally {
  setSavingCourse(false);
  }
  await fetchData();
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
   if (isPlatformCourse(courseId)) {
   deletePlatformFromStorage(courseId);
   setCoursesList(prev => prev.filter(c => c.id !== courseId));
    try { await db.from('platform_overrides').upsert({ id: courseId, data: { __deleted: true } }, { onConflict: 'id' }); } catch (e) { console.error('AdminDashboard: Failed to sync platform course deletion to Supabase', e); }
    toast.success('Platform course hidden');
   return;
  }
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
  await deleteDoc(doc(db, 'courses', courseId));
  toast.success('Course deleted');
  } catch (e: any) {
  toast.error(e?.message || 'Failed to delete course');
  }
  await fetchData();
  };

   const handleToggleComingSoon = async (course: any) => {
   const newVal = !course.comingSoon;
   if (isPlatformCourse(course.id)) {
    const overrides = { comingSoon: newVal };
    savePlatformOverrides({ ...JSON.parse(localStorage.getItem('platformCourseOverrides') || '{}'), [course.id]: overrides });
    setCoursesList(prev => applyPlatformOverrides(prev.map(c => c.id === course.id ? { ...c, ...overrides } : c)));
    try { await db.from('platform_overrides').upsert({ id: course.id, data: overrides }, { onConflict: 'id' }); } catch (e) { console.error('AdminDashboard: Failed to sync coming soon toggle to Supabase', e); }
    toast.success(newVal ? 'Marked as Coming Soon' : 'Course released');
    return;
   }
  try {
  await updateDoc(doc(db, 'courses', course.id), { comingSoon: newVal });
  toast.success(newVal ? 'Marked as Coming Soon' : 'Course released');
  } catch (e: any) {
  toast.error(e?.message || 'Failed to update course');
  }
  await fetchData();
  };

 const filteredCoursesList = useMemo(() => {
 return coursesList.filter((c: any) => {
 const term = courseSearch.toLowerCase();
 const matchesSearch = !term || (c.title || '').toLowerCase().includes(term) || (c.folder || '').toLowerCase().includes(term);
 const matchesPrice = coursePriceFilter === 'all' || (coursePriceFilter === 'free' ? (!c.price || c.price === 0) : (c.price && c.price > 0));
 return matchesSearch && matchesPrice;
 });
 }, [coursesList, courseSearch, coursePriceFilter]);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [cSnap, aSnap, eSnap] = await Promise.all([
 getDocs(collection(db, 'courses')),
 getDocs(collection(db, 'teacher_applications')),
 getDocs(collection(db, 'enrollments'))
 ]);

   const dbCourses = cSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => !c.id.startsWith('pc-'));
   const platformCourses = applyPlatformOverrides(PLATFORM_COURSES.map((pc, i) => ({ id: `pc-${i}`, ...pc }))).filter((c: any) => {
  try {
  const deleted = JSON.parse(localStorage.getItem('platformCourseDeletions') || '[]');
  return !deleted.includes(c.id);
  } catch { return true; }
  });
   setCoursesList([...dbCourses, ...platformCourses]);

  const enrollmentsData = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  setEnrollments(enrollmentsData);

  // Resolve user names for enrolled students
  const userIds = [...new Set(enrollmentsData.map((e: any) => e.userId || e.user_id).filter(Boolean))];
  const userMap: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
  try {
  const { data: userRows } = await db.from('users').select('id, display_name, email').in('id', userIds);
  if (userRows) {
  userRows.forEach((u: any) => { userMap[u.id] = { name: u.display_name || u.email || 'Unknown', email: u.email || '' }; });
  }
  } catch (_) {}
  }
  setEnrollmentUserMap(userMap);

  const rawApps = aSnap.docs.map((d) => {
 const data = d.data() as TeacherApplication;
 const courseIdVal = data.qualification || '';
 const cFind = [...dbCourses, ...platformCourses].find((c: any) => c.id === courseIdVal);
 return {
 ...data,
 id: d.id,
 courseTitle: cFind?.title || 'Unknown Course',
 userName: data.name || 'Unknown',
 userEmail: data.email || 'No Email',
 courseId: courseIdVal,
  skills: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n')[0]?.replace('Skills: ', '') : 'Course Expert',
 message: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n').slice(1).join('\n').trim() : (data.message || '')
 };
 });

 setTeacherApps(rawApps as any);
 } catch (e) {
 console.error("Dashboard data fetch failed", e);
 toast.error("Failed to sync dashboard data");
 } finally {
 setLoading(false);
 }
 };

 const fetchScheduledClasses = async () => {
 setLoadingClasses(true);
 try {
 const { data, error } = await db.from('scheduled_classes').select('*, users:teacher_id (display_name, email)').order('scheduled_at', { ascending: false });
 if (!error) setScheduledClasses(data || []);
 } catch (e) {
 console.error("Failed to load scheduled classes", e);
 } finally {
 setLoadingClasses(false);
 }
 };

 useEffect(() => {
 const unsub = onAuthStateChanged(auth, (u) => {
 if (!u || !ADMIN_EMAILS.includes(u.email || '')) {
 navigate('/');
 } else {
 fetchData();
 fetchScheduledClasses();
 }
 });
 return () => unsub();
 }, [navigate]);

 // Build chat contacts from teacher_applications + all chat_messages senders
 useEffect(() => {
 const buildContacts = async () => {
 const map = new Map<string, { id: string; name: string; email: string }>();

 // Add teacher applicant contacts
 teacherApps.forEach(app => {
 const id = app.userId || app.id;
 if (!map.has(id)) {
 map.set(id, { id, name: app.userName || 'Unknown', email: app.userEmail || 'No Email' });
 }
 });

 // Add contacts from chat_messages (users who messaged but didn't apply as teacher)
 try {
 const { data: msgs } = await db.from('chat_messages').select('user_id');
 if (msgs) {
 const seen = new Set<string>();
 for (const m of msgs) {
 if (m.user_id && !seen.has(m.user_id)) {
 seen.add(m.user_id);
 if (!map.has(m.user_id)) {
 const { data: userData } = await db.from('users').select('name, email').eq('id', m.user_id).maybeSingle();
 map.set(m.user_id, {
 id: m.user_id,
 name: userData?.name || m.user_id.slice(0, 8),
 email: userData?.email || ''
 });
 }
 }
 }
 }
 } catch (e) {
 console.error("Failed to load chat message senders", e);
 }

 setChatContacts(Array.from(map.values()));
 };
 buildContacts();
 }, [teacherApps]);

 const loadChatMessages = async (userId: string) => {
 try {
 const { data, error } = await db.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
 if (!error && data) setChatMessages(data);
 } catch (e) {
 console.error("Failed to load messages", e);
 }
 };

 const handleSendMessage = async () => {
 if (!chatInput.trim() || !selectedContact) return;
 setSendingMessage(true);
 try {
 await db.from('chat_messages').insert({
 user_id: selectedContact.id,
 content: chatInput,
 role: 'admin',
 created_at: new Date().toISOString()
 });
 setChatInput('');
 await loadChatMessages(selectedContact.id);
 } catch (e) {
 toast.error("Failed to send message");
 } finally {
 setSendingMessage(false);
 }
 };

 const handleFinalVerdictTeacher = async (appId: string, emailStr: string | undefined, verdict: 'approved' | 'rejected') => {
 try {
 await updateDoc(doc(db, 'teacher_applications', appId), {
 status: verdict
 });

 if (verdict === 'approved') {
 const appDoc = await getDoc(doc(db, 'teacher_applications', appId));
 if (appDoc.exists()) {
 const data = appDoc.data();
 const courseIdVal = data.qualification || appId;
 const enrollmentId = crypto.randomUUID();
 await createEnrollment({
 id: enrollmentId,
 userId: data.userId || data.user_id,
 courseId: courseIdVal,
 role: 'teacher',
 studentStatus: 'active',
 });
 }
 }

 if (emailStr && (verdict === 'approved' || verdict === 'rejected')) {
 try {
 const { error: mailErr } = await db.from('mail').insert({
 to: emailStr,
 subject: `Teacher Application ${verdict === 'approved' ? 'Approved' : 'Rejected'}`,
 text: verdict === 'approved' 
 ? 'Congratulations! You have been approved to teach this course.'
 : 'Thank you for your interest, but we are unable to proceed.'
 });
 if (mailErr) console.warn("Mail insert warning:", mailErr);
 } catch(mailErr) {
 console.warn("Mail send failed (non-blocking)", mailErr);
 }
 }
 setSelectedApp(null);
 fetchData();
 toast.success(`Application ${verdict}`);
 } catch(e: any) { toast.error(e?.message || "Verdict update failed"); console.error(e); }
 };

  const [, setSchedulingId] = useState<string | null>(null);
 const [meetLink, setMeetLink] = useState('');
 const [meetDate, setMeetDate] = useState('');

 const handleApproveApp = async (appId: string, emailStr?: string) => {
 if(!meetLink) { toast.error("Provide a meet link"); return; }
 try {
 const existingApp = await getDoc(doc(db, 'teacher_applications', appId));
 const existingMsg = existingApp.exists() ? existingApp.data().message || '' : '';
 const updatedMsg = existingMsg + `\n[Interview Link: ${meetLink}]` + (meetDate ? `\n[Interview Date: ${new Date(meetDate).toISOString()}]` : '');

 const updateData: any = {
 status: 'scheduled',
 message: updatedMsg,
 meetingLink: meetLink,
 };
 if (meetDate) {
 updateData.meetingDate = new Date(meetDate).toISOString();
 }

 try {
 await updateDoc(doc(db, 'teacher_applications', appId), updateData);
 } catch (dbErr: any) {
 console.warn("DB update with explicit columns failed, falling back to message-only storage", dbErr);
 await updateDoc(doc(db, 'teacher_applications', appId), {
 status: 'scheduled',
 message: updatedMsg,
 });
 }

  if (emailStr) {
  const dateStr = meetDate ? new Date(meetDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : '';
  const emailText = `Your application has been reviewed. Join the interview here: ${meetLink}${dateStr ? ` on ${dateStr}` : ''}`;
  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="padding:40px 40px 24px;text-align:center;background:#0B1220">
<img src="https://www.edualttech.com/logo.png" alt="EduAltTech" width="56" style="margin-bottom:12px"/>
<h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff">Interview Scheduled</h1>
</td></tr>
<tr><td style="padding:32px 40px">
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6">Dear Applicant,</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6">Your teacher application has been reviewed. We are pleased to invite you for an interview.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px">
<tr><td style="padding:20px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${meetLink ? `<tr><td style="padding-bottom:12px"><span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Meeting Link</span><br/><a href="${meetLink}" style="font-size:15px;font-weight:600;color:#059669;text-decoration:none">${meetLink}</a></td></tr>` : ''}
${dateStr ? `<tr><td><span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Date & Time</span><br/><span style="font-size:15px;font-weight:600;color:#0f172a">${dateStr}</span></td></tr>` : ''}
</table>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6">Please be prepared with your qualifications and experience details. Click the link above at the scheduled time to join the interview.</p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.6">Best regards,<br/><strong style="color:#0f172a">Edu-Alt-Tech Team</strong></p>
</td></tr>
<tr><td style="padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
<p style="margin:0;font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} Edu-Alt-Tech. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
  try {
  await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
  to: emailStr,
  subject: 'Interview Scheduled - Edu-Alt-Tech',
  text: emailText,
  html: emailHtml,
  }),
  });
  } catch {
  // non-blocking
  }
  }

 setSchedulingId(null);
 setMeetLink('');
 setMeetDate('');
 setSelectedApp(null);
 fetchData();
 toast.success("Interview scheduled");
 } catch (e: any) {
 console.error("Schedule error:", e?.message || e);
 toast.error("Scheduling failed");
 }
 };

  const handleDeleteApplication = async (appId: string, name?: string) => {
   if (!confirm(`Permanently delete ${name || 'this'} application? This cannot be undone.`)) return;
   try {
   await deleteDoc(doc(db, 'teacher_applications', appId));
   if (selectedApp?.id === appId) setSelectedApp(null);
   selectedAppIds.delete(appId);
   setSelectedAppIds(new Set(selectedAppIds));
   fetchData();
   toast.success("Application deleted");
   } catch (e: any) {
   toast.error(e?.message || "Failed to delete application");
   }
  };

  const handleBulkDeleteApplications = async () => {
   if (selectedAppIds.size === 0) return;
   if (!confirm(`Permanently delete ${selectedAppIds.size} selected applications? This cannot be undone.`)) return;
   try {
   await Promise.all(Array.from(selectedAppIds).map(id => deleteDoc(doc(db, 'teacher_applications', id))));
   setSelectedAppIds(new Set());
   setSelectedApp(null);
   fetchData();
   toast.success(`${selectedAppIds.size} applications deleted`);
   } catch (e: any) {
   toast.error(e?.message || "Failed to delete applications");
   }
  };

  const toggleSelectApp = (id: string) => {
   setSelectedAppIds(prev => {
   const next = new Set(prev);
   if (next.has(id)) next.delete(id); else next.add(id);
   return next;
   });
  };

  const toggleSelectAllApps = () => {
   if (selectedAppIds.size === teacherApps.length) {
   setSelectedAppIds(new Set());
   } else {
   setSelectedAppIds(new Set(teacherApps.map(a => a.id)));
   }
  };

  const handleRemoveTeacher = async (appId: string, teacherUserId: string | undefined, courseId: string | undefined) => {
 if (!teacherUserId || !courseId) { toast.error("Missing teacher or course info"); return; }
 if (!confirm("Remove this teacher from the course? This will delete their enrollment.")) return;
 try {
 const eq = query(collection(db, 'enrollments'), where('userId', '==', teacherUserId), where('courseId', '==', courseId), where('role', '==', 'teacher'));
 const eSnap = await getDocs(eq);
 for (const d of eSnap.docs) {
 await deleteDoc(doc(db, 'enrollments', d.id));
 }
 await updateDoc(doc(db, 'teacher_applications', appId), { status: 'rejected' });
 setSelectedApp(null);
 fetchData();
 toast.success("Teacher removed from course");
 } catch (e) {
 toast.error("Failed to remove teacher");
 }
 };

 const selectChatContact = async (contact: { id: string; name: string; email: string }) => {
 setSelectedContact(contact);
 await loadChatMessages(contact.id);
 };

  const activeCount = useMemo(() => enrollments.filter((e: any) => e.status === 'active').length, [enrollments]);
  const enrollmentCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  enrollments.forEach((e: any) => {
  const id = e.course_id || e.courseId;
  counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
  }, [enrollments]);
  const courseMap = useMemo(() => {
   const map: Record<string, string> = {};
   coursesList.forEach((c: any) => { map[c.id] = c.title || 'Untitled'; });
   return map;
   }, [coursesList]);

 if (loading) {
 return <HamsterLoader />;
 }

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30">
 {/* Mobile Sidebar Toggle */}
 <button 
 onClick={() => setIsSidebarOpen(true)}
 className="md:hidden fixed top-4 left-4 z-[60] p-2.5 bg-white border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 :bg-slate-800 transition-colors"
 >
 <MoreVertical className="w-5 h-5" />
 </button>

 {/* Desktop Sidebar (always visible on md+) */}
 <nav className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white [#0f172a] border-r border-slate-200/50 /50 z-40 flex-col p-8">
 <div className="mb-12 flex items-center gap-3">
 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
 <LayoutDashboard className="w-7 h-7 text-white" />
 </div>
 <div className="flex flex-col">
 <span className="font-black text-xl tracking-tighter leading-none">CORE <span className="text-emerald-500">OPS</span></span>
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Admin Terminal</span>
 </div>
 </div>

 <div className="flex-1 space-y-3">
 {[
 { id: 'applications', label: 'Applications', icon: Users, desc: 'Provider review' },
 { id: 'courses', label: 'Course Management', icon: Database, desc: 'CRUD operations' },
 { id: 'chat', label: 'Messages', icon: MessageSquare, desc: 'All conversations' },
 { id: 'stats', label: 'Course Stats', icon: BarChart3, desc: 'Enrollment analytics' },
 { id: 'classes', label: 'Scheduled Classes', icon: Calendar, desc: 'Teacher-scheduled classes' },
 ].map((item) => (
 <button
 key={item.id}
 onClick={() => { setActiveTab(item.id as any); }}
 className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-colors relative group overflow-hidden ${
 activeTab === item.id 
 ? 'bg-slate-900 text-white shadow-2xl shadow-emerald-500/20' 
 : 'text-slate-500 hover:bg-slate-50 :bg-slate-800/50'
 }`}
 >
 {activeTab === item.id && (
 <motion.div layoutId="nav-bg" className="absolute inset-0 bg-emerald-500 -z-10" />
 )}
 <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
 <div className="flex flex-col items-start">
 <span className="text-sm">{item.label}</span>
 <span className={`text-[9px] font-medium uppercase tracking-widest ${activeTab === item.id ? 'text-white/60' : 'text-slate-400'}`}>{item.desc}</span>
 </div>
 </button>
 ))}
 </div>

 <div className="mt-auto pt-8 border-t border-slate-100 /50">
 <button 
 onClick={() => navigate('/')}
 className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 :bg-rose-500/10 transition-colors border border-transparent hover:border-rose-200 :border-rose-500/20"
 >
 <ArrowLeft className="w-5 h-5" />
 <span>Exit Console</span>
 </button>
 </div>
 </nav>

 {/* Mobile Sidebar (overlay, controlled by state) */}
 <AnimatePresence>
 {isSidebarOpen && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsSidebarOpen(false)}
 className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55]"
 />
 <motion.nav 
 initial={{ x: -100, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: -100, opacity: 0 }}
 className="md:hidden fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-white [#0f172a] border-r border-slate-200/50 /50 z-[60] flex flex-col p-6 shadow-2xl"
 >
 <div className="mb-12 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
 <LayoutDashboard className="w-7 h-7 text-white" />
 </div>
 <div className="flex flex-col">
 <span className="font-black text-xl tracking-tighter leading-none">CORE <span className="text-emerald-500">OPS</span></span>
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Admin Terminal</span>
 </div>
 </div>
 <button onClick={() => setIsSidebarOpen(false)} className="p-3 hover:bg-slate-100 :bg-slate-800 rounded-lg transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 space-y-3">
 {[
 { id: 'applications', label: 'Applications', icon: Users, desc: 'Provider review' },
 { id: 'courses', label: 'Course Management', icon: Database, desc: 'CRUD operations' },
{ id: 'chat', label: 'Messages', icon: MessageSquare, desc: 'All conversations' },
 { id: 'stats', label: 'Course Stats', icon: BarChart3, desc: 'Enrollment analytics' },
 { id: 'classes', label: 'Scheduled Classes', icon: Calendar, desc: 'Teacher-scheduled classes' },
 ].map((item) => (
 <button
 key={item.id}
 onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
 className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-colors relative group overflow-hidden ${
 activeTab === item.id 
 ? 'bg-slate-900 text-white shadow-2xl shadow-emerald-500/20' 
 : 'text-slate-500 hover:bg-slate-50 :bg-slate-800/50'
 }`}
 >
 <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
 <div className="flex flex-col items-start">
 <span className="text-sm">{item.label}</span>
 <span className={`text-[9px] font-medium uppercase tracking-widest ${activeTab === item.id ? 'text-white/60' : 'text-slate-400'}`}>{item.desc}</span>
 </div>
 </button>
 ))}
 </div>

 <div className="mt-auto pt-8 border-t border-slate-100 /50">
 <button 
 onClick={() => navigate('/')}
 className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 :bg-rose-500/10 transition-colors border border-transparent hover:border-rose-200 :border-rose-500/20"
 >
 <ArrowLeft className="w-5 h-5" />
 <span>Exit Console</span>
 </button>
 </div>
 </motion.nav>
 </>
 )}
 </AnimatePresence>

 {/* Main Content Area */}
 <main className="md:pl-72 pt-20 md:pt-12 pb-12 sm:pb-24 px-4 sm:px-6 md:px-16">
 <div className="max-w-[1400px] mx-auto">
 {/* Header */}
 <header className="mb-16">
 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Admin Console</span>
 <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 ">
 {activeTab === 'applications' ? 'Provider Applications' : activeTab === 'chat' ? 'Messages' : activeTab === 'stats' ? 'Course Statistics' : activeTab === 'courses' ? 'Course Management' : 'Scheduled Classes'}
 </h1>
 <p className="text-slate-500 font-medium mt-2">
 {activeTab === 'applications' ? 'Review and manage teacher/provider applications' : activeTab === 'chat' ? 'Direct messaging with providers' : activeTab === 'stats' ? 'Enrollment analytics per course' : activeTab === 'courses' ? 'Create, edit, and delete courses' : 'Live classes scheduled by teachers'}
 </p>
 </header>

 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 0.3, ease: "circOut" }}
 >
  {activeTab === 'applications' && (
  <div className="space-y-8">
  {/* Selection toolbar */}
  {teacherApps.length > 0 && (
  <div className="flex items-center justify-between gap-4">
  <label className="flex items-center gap-2 cursor-pointer select-none">
  <input type="checkbox" checked={selectedAppIds.size === teacherApps.length && teacherApps.length > 0}
   onChange={toggleSelectAllApps}
   className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
  <span className="text-xs font-bold text-slate-500">
   {selectedAppIds.size === 0 ? 'Select All' : `${selectedAppIds.size} of ${teacherApps.length} selected`}
  </span>
  </label>
  {selectedAppIds.size > 0 && (
  <button onClick={handleBulkDeleteApplications}
   className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors text-xs">
   <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedAppIds.size})
  </button>
  )}
  </div>
  )}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
  {teacherApps.length === 0 ? (
  <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 ">
  <CalendarClock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
  <h3 className="text-xl font-black text-slate-400">NO PENDING DOSSIERS</h3>
  <p className="text-slate-500 text-sm font-medium mt-2">The system is currently clear of applicants.</p>
  </div>
  ) : (
  teacherApps.map(app => (
  <motion.div 
  layout
  key={app.id} 
  className={`group bg-white p-6 sm:p-8 rounded-[2.5rem] border transition-shadow duration-500 relative ${
   selectedAppIds.has(app.id) ? 'border-emerald-500 shadow-[0_0_0_1px_#10b981,0_16px_32px_-12px_rgba(16,185,129,0.2)]' : 'border-slate-200/50 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]'
  }`}
  >
  {/* Selection checkbox */}
  <div className="absolute top-0 left-0 p-6 z-10">
  <input type="checkbox" checked={selectedAppIds.has(app.id)}
   onChange={() => toggleSelectApp(app.id)}
   onClick={(e) => e.stopPropagation()}
   className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
  </div>
   <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
   <button onClick={(e) => { e.stopPropagation(); handleDeleteApplication(app.id, app.userName); }}
    className="p-1.5 hover:bg-rose-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Delete application">
    <Trash2 className="w-4 h-4 text-rose-500" />
   </button>
  <div className={`w-2 h-2 rounded-full animate-pulse ${
  app.status === 'pending' ? 'bg-amber-500' :
  app.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'
  }`} />
  <span className={`text-[10px] font-black uppercase tracking-widest ${
  app.status === 'pending' ? 'text-amber-500' :
  app.status === 'approved' ? 'text-emerald-500' : 'text-blue-500'
  }`}>
  {app.status}
  </span>
  </div>

 <div className="mb-8">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Applicant</span>
 <h4 className="font-black text-2xl text-slate-900 mb-1 line-clamp-1">{app.userName}</h4>
 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{app.userEmail}</p>
 </div>

 <div className="p-5 bg-slate-50 /50 rounded-2xl border border-slate-100 mb-8">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Curriculum</span>
 <p className="font-bold text-slate-700 flex items-center gap-2">
 <ClipboardList className="w-4 h-4 text-emerald-500" /> {app.courseTitle}
 </p>
 </div>

 <div className="flex items-center gap-4 mb-8">
 <div className="flex-1 p-3 bg-white rounded-xl border border-slate-100 text-center">
 <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Experience</span>
 <span className="text-xl font-black text-slate-900 ">{app.experience}y</span>
 </div>
 <div className="flex-1 p-3 bg-white rounded-xl border border-slate-100 text-center">
 <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Skills</span>
 <span className="text-xl font-black text-emerald-500">{app.skills?.split(',').length || 0}</span>
 </div>
 </div>

 {app.status === 'scheduled' && (() => {
 const linkMatch = app.message?.match(/\[Interview Link:\s*([^\]\n]+)\]/);
 const meetingUrl = linkMatch ? linkMatch[1] : app.meetingLink;
 const formattedUrl = meetingUrl ? (meetingUrl.startsWith('http') ? meetingUrl : `https://${meetingUrl}`) : null;
 return formattedUrl ? (
 <a href={formattedUrl} target="_blank" rel="noreferrer" className="block mb-4 p-3 bg-blue-50 /20 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm truncate hover:underline">
 <Video className="w-3.5 h-3.5 inline mr-2" />{meetingUrl}
 </a>
 ) : null;
 })()}

 <button 
 onClick={() => setSelectedApp(app)}
 className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl group-hover:bg-emerald-500 group-hover:text-white"
 >
 REVIEW DOSSIER
 </button>
 </motion.div>
 ))
 )}
 </div>
 </div>
 )}

 {activeTab === 'chat' && (
 <div className="flex flex-col lg:flex-row gap-8 min-h-[60vh] lg:h-[calc(100vh-320px)] sm:min-h-[500px]">
 {/* Contacts sidebar */}
 <div className="lg:w-80 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col shrink-0">
 <div className="p-6 border-b border-slate-100 ">
 <h3 className="font-black text-lg">Contacts</h3>
 <p className="text-xs text-slate-400 font-medium mt-1">{chatContacts.length} contacts</p>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {chatContacts.length === 0 ? (
 <div className="p-8 text-center">
 <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
 <p className="text-sm font-medium text-slate-400">No contacts yet</p>
 <p className="text-xs text-slate-500 mt-1">Messages from users will appear here</p>
 </div>
 ) : (
 chatContacts.map(contact => (
 <button
 key={contact.id}
 onClick={() => selectChatContact(contact)}
 className={`w-full p-5 flex items-center gap-4 hover:bg-slate-50 :bg-slate-800/50 transition-colors border-b border-slate-100 /50 text-left ${
 selectedContact?.id === contact.id ? 'bg-emerald-500/5 /10' : ''
 }`}
 >
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white text-lg shrink-0">
 {contact.name.charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="font-bold text-sm truncate">{contact.name}</p>
 <p className="text-[10px] text-slate-400 font-medium truncate">{contact.email}</p>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* Chat area */}
 <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 flex flex-col overflow-hidden">
 {!selectedContact ? (
 <div className="flex-1 flex items-center justify-center">
 <div className="text-center">
 <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
 <h3 className="text-xl font-black text-slate-400">Select a Contact</h3>
 <p className="text-sm text-slate-500 mt-1">Choose a provider from the sidebar to start chatting</p>
 </div>
 </div>
 ) : (
 <>
 {/* Chat header */}
 <div className="p-6 border-b border-slate-100 flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white">
 {selectedContact.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="font-bold">{selectedContact.name}</p>
 <p className="text-[10px] text-slate-400 font-medium">{selectedContact.email}</p>
 </div>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
 {chatMessages.length === 0 ? (
 <div className="text-center py-12">
 <p className="text-slate-400 font-medium">No messages yet</p>
 <p className="text-xs text-slate-500 mt-1">Send a message to start the conversation</p>
 </div>
 ) : (
 chatMessages.map((msg) => (
 <div key={msg.id} className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[80%] p-4 rounded-2xl ${
 msg.role === 'admin' 
 ? 'bg-emerald-500 text-white rounded-br-md' 
 : 'bg-slate-100 text-slate-900 rounded-bl-md'
 }`}>
 <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
 <p className={`text-[10px] mt-1 ${msg.role === 'admin' ? 'text-emerald-200' : 'text-slate-400'}`}>
 {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Input */}
 <div className="p-6 border-t border-slate-100 ">
 <div className="flex gap-4">
 <input
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
 placeholder="Type a message..."
 className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors"
 />
 <button
 onClick={handleSendMessage}
 disabled={sendingMessage || !chatInput.trim()}
 className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
 </button>
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {activeTab === 'stats' && (
 <div className="space-y-8">
 {/* Summary cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Courses</span>
 <p className="text-3xl sm:text-4xl font-black mt-2 text-slate-900 ">{coursesList.length}</p>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrollments</span>
 <p className="text-3xl sm:text-4xl font-black mt-2 text-emerald-500">{enrollments.length}</p>
 </div>
   <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Enrollments</span>
   <p className="text-3xl sm:text-4xl font-black mt-2 text-blue-500">{activeCount}</p>
   </div>
   </div>

   {/* All Enrollments */}
   <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
   <div className="p-4 sm:p-8 border-b border-slate-100">
   <h3 className="text-xl font-black tracking-tight">All Enrollments</h3>
   </div>
   <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
   <table className="w-full text-left border-collapse">
   <thead>
   <tr className="bg-slate-50/50 sticky top-0 backdrop-blur-md">
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student</th>
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Course</th>
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plan</th>
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Payment</th>
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Amount</th>
   <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Enrolled</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-slate-100">
   {enrollments.length === 0 ? (
   <tr>
   <td colSpan={6} className="px-8 py-16 text-center">
   <p className="text-slate-400 font-medium">No enrollments yet</p>
   </td>
   </tr>
   ) : (
   enrollments.map((e: any) => {
   const uid = e.userId || e.user_id;
   const user = enrollmentUserMap[uid];
   const courseTitle = courseMap[e.course_id || e.courseId] || 'Unknown Course';
   const planLabel = e.plan === 'full' ? 'Full Access' : 'First Class';
   const ps = e.paymentStatus || e.payment_status || 'not-required';
   const paymentLabel = ps === 'paid' ? 'Paid' : ps === 'pending' ? 'Pending' : 'N/A';
   const paymentColor = ps === 'paid' ? 'text-emerald-600 bg-emerald-50' : ps === 'pending' ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50';
   const planColor = e.plan === 'full' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';
   const enrolledDate = e.createdAt?.toDate ? e.createdAt.toDate() : e.created_at ? new Date(e.created_at) : e.createdAt ? new Date(e.createdAt) : null;
   return (
   <tr key={e.id || uid} className="hover:bg-slate-50/80 transition-colors">
   <td className="px-4 sm:px-6 py-4">
   <div className="flex items-center gap-2">
   <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
   {(user?.name || '?').charAt(0).toUpperCase()}
   </div>
   <div className="min-w-0">
   <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Unknown'}</p>
   <p className="text-[9px] text-slate-400 truncate sm:hidden">{courseTitle}</p>
   </div>
   </div>
   </td>
   <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
   <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{courseTitle}</p>
   </td>
   <td className="px-4 sm:px-6 py-4">
   <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${planColor}`}>{planLabel}</span>
   </td>
   <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
   <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${paymentColor}`}>{paymentLabel}</span>
   </td>
   <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
   <span className="text-xs font-bold text-slate-800">{e.amount ? `₹${e.amount}` : '-'}</span>
   </td>
   <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
   <span className="text-[10px] text-slate-400 font-medium">{enrolledDate ? enrolledDate.toLocaleDateString() : '-'}</span>
   </td>
   </tr>
   );
   })
   )}
   </tbody>
   </table>
   </div>
   </div>

   {/* Course enrollment table */}
 <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
 <div className="p-4 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <h3 className="text-xl font-black tracking-tight">Enrollments by Course</h3>
 <div className="flex gap-2">
 {(['all', 'free', 'paid'] as const).map(f => (
 <button key={f} onClick={() => setPriceFilter(f)}
 className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
 priceFilter === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700'
 }`}
 >
 {f === 'free' ? '₹0 (Free)' : f === 'paid' ? 'Paid' : 'All'}
 </button>
 ))}
 </div>
 </div>
 <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 /30 sticky top-0 backdrop-blur-md">
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Course</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Price</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Category</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Enrollments</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 /50">
 {coursesList
 .filter(c => priceFilter === 'all' || (priceFilter === 'free' ? (!c.price || c.price === 0) : (c.price && c.price > 0)))
 .map((course: any) => {
 const count = enrollmentCounts[course.id] || 0;
 return (
 <tr key={course.id} className="hover:bg-slate-50/80 :bg-slate-800/40 transition-colors">
 <td className="px-4 sm:px-8 py-4 sm:py-5">
 <div className="flex items-center gap-3 sm:gap-4">
 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
 {course.title?.charAt(0) || 'C'}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{course.title || 'Untitled'}</p>
 {course.comingSoon && <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-600 font-black uppercase tracking-wider rounded-full">Soon</span>}
 </div>
 <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{course.id?.slice(0, 8)}...</p>
 </div>
 </div>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
 <span className={`text-xs font-bold ${!course.price || course.price === 0 ? 'text-emerald-500' : 'text-slate-700 '}`}>
  {!course.price || course.price === 0 ? 'Free' : `₹${course.price}/month`}
 </span>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
 <span className="text-xs font-medium text-slate-500">{course.category || 'Uncategorized'}</span>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
 <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-black text-lg ${
 count > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
 }`}>
 {count}
 </span>
 </td>
 </tr>
 );
 })}
 {coursesList.filter(c => priceFilter === 'all' || (priceFilter === 'free' ? (!c.price || c.price === 0) : (c.price && c.price > 0))).length === 0 && (
 <tr>
 <td colSpan={4} className="px-8 py-16 text-center">
 <p className="text-slate-400 font-medium">No {priceFilter === 'free' ? 'free' : priceFilter === 'paid' ? 'paid' : ''} courses found</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 {activeTab === 'classes' && (
 <div className="space-y-6">
 {loadingClasses ? (
 <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
 ) : scheduledClasses.length === 0 ? (
 <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 ">
 <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-6" />
 <h3 className="text-xl font-black text-slate-400">No Scheduled Classes</h3>
 <p className="text-slate-500 text-sm font-medium mt-2">Teachers have not scheduled any live classes yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
 {scheduledClasses.map((sc) => (
 <div key={sc.id} className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white shrink-0">
 <Calendar className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-black text-slate-900 truncate">{sc.title}</p>
 <p className="text-[10px] text-slate-400 font-medium mt-0.5">
 {sc.scheduled_at ? new Date(sc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}
 </p>
 </div>
 </div>
 <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{sc.description || 'No description'}</p>
 <div className="flex items-center gap-3 mb-4">
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher:</span>
 <span className="text-xs font-bold text-slate-700 ">{sc.users?.display_name || sc.teacher_id?.slice(0, 8) || 'Unknown'}</span>
 </div>
 <a href={sc.meeting_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors text-sm">
 <Video className="w-4 h-4" /> Join Class
 </a>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {activeTab === 'courses' && (
 <div className="space-y-8">
 {/* Summary cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Courses</span>
 <p className="text-3xl sm:text-4xl font-black mt-2 text-slate-900 ">{coursesList.length}</p>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrollments</span>
 <p className="text-3xl sm:text-4xl font-black mt-2 text-emerald-500">{enrollments.length}</p>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Enrollments</span>
 <p className="text-3xl sm:text-4xl font-black mt-2 text-blue-500">{activeCount}</p>
 </div>
 </div>

 {/* Search & Add bar */}
 <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
 <input type="text" placeholder="Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
 className="w-full sm:w-64 p-4 bg-white rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold text-sm" />
 <div className="flex gap-2">
 {(['all', 'free', 'paid'] as const).map(f => (
 <button key={f} onClick={() => setCoursePriceFilter(f)}
 className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
 coursePriceFilter === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700'
 }`}>
 {f === 'free' ? 'Free' : f === 'paid' ? 'Paid' : 'All'}
 </button>
 ))}
 </div>
 </div>
 <button onClick={openAddCourse} className="flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-colors shadow-lg shadow-emerald-500/20">
 <Plus className="w-5 h-5" /> Add Course
 </button>
 </div>

 {/* Course table */}
 <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
 <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 /30 sticky top-0 backdrop-blur-md">
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Course</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Folder</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price</th>
 <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 /50">
 {filteredCoursesList.map((course: any) => (
 <tr key={course.id} className="hover:bg-slate-50/80 :bg-slate-800/40 transition-colors">
 <td className="px-4 sm:px-8 py-4 sm:py-5">
 <div className="flex items-center gap-3 sm:gap-4">
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
  {course.title?.charAt(0) || 'C'}
  </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{course.title || 'Untitled'}</p>
 {course.comingSoon && <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-600 font-black uppercase tracking-wider rounded-full">Soon</span>}
 </div>
 <p className="text-[10px] text-slate-400 font-medium">{course.id?.slice(0, 8)}...</p>
 </div>
 </div>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5 hidden md:table-cell">
 <span className="text-xs font-medium text-slate-500">{course.folder || '—'}</span>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5">
 <span className={`text-xs font-bold ${!course.price || course.price === 0 ? 'text-emerald-500' : 'text-slate-700 '}`}>
  {!course.price || course.price === 0 ? 'Free' : `₹${course.price}/month`}
 </span>
 </td>
 <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
 <div className="flex items-center justify-end gap-2">
 <button onClick={() => handleToggleComingSoon(course)} className={`p-2.5 rounded-xl transition-colors ${
 course.comingSoon
 ? 'bg-amber-100 /30 text-amber-600 hover:bg-amber-200 :bg-amber-900/50'
 : 'bg-emerald-100 /30 text-emerald-600 hover:bg-emerald-200 :bg-emerald-900/50'
 }`} title={course.comingSoon ? 'Release course' : 'Mark as Coming Soon'}>
 {course.comingSoon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 <button onClick={() => openEditCourse(course)} className="p-2.5 bg-slate-100 hover:bg-emerald-100 :bg-emerald-900/30 rounded-xl transition-colors" title="Edit">
 <Pencil className="w-4 h-4 text-slate-600 " />
 </button>
 <button onClick={() => handleDeleteCourse(course.id, course.title)} className="p-2.5 bg-slate-100 hover:bg-rose-100 :bg-rose-900/30 rounded-xl transition-colors" title="Delete">
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filteredCoursesList.length === 0 && (
 <tr>
 <td colSpan={4} className="px-8 py-16 text-center">
 <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
 <p className="text-slate-400 font-medium">{courseSearch ? 'No courses match your search' : 'No courses yet. Add your first course.'}</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 </main>

 {/* Premium Application Modal */}
 <AnimatePresence>
 {selectedApp && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedApp(null)}
 className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-2xl mx-2 sm:mx-0 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden"
 >
 <div className="p-4 sm:p-10">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Mentor Review</h2>
 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Application Dossier #{selectedApp.id.slice(0, 8)}</p>
 </div>
 <button onClick={() => setSelectedApp(null)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 :bg-slate-700 transition-colors">
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
 <section>
 <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Applicant Profile</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
 <div>
 <p className="text-sm font-black text-slate-400 uppercase mb-1">Name</p>
 <p className="font-bold text-base sm:text-lg">{selectedApp.userName}</p>
 </div>
 <div>
 <p className="text-sm font-black text-slate-400 uppercase mb-1">Target Curriculum</p>
 <p className="font-bold text-base sm:text-lg">{selectedApp.courseTitle}</p>
 </div>
 <div>
 <p className="text-sm font-black text-slate-400 uppercase mb-1">Highest Qualification</p>
 <p className="font-bold text-base sm:text-lg">{selectedApp.highestQualification || (selectedApp as any).highest_qualification || 'Not specified'}</p>
 </div>
 <div className="sm:col-span-2">
 <p className="text-sm font-black text-slate-400 uppercase mb-1">Languages to Teach (Total: {selectedApp.languagesCount || 0})</p>
 <p className="font-bold text-base text-emerald-600">{selectedApp.languages || 'Not specified'}</p>
 </div>
 </div>
 </section>

 <section>
 <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Professional Experience</label>
 <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 /50 p-6 rounded-[2rem]">
 {selectedApp.experience || 'No experience provided.'}
 </p>
 </section>

 {selectedApp.status === 'pending' && (
 <div className="pt-8 border-t border-slate-100 ">
 <div className="bg-slate-50 /50 p-4 sm:p-6 rounded-[2rem] mb-6">
 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Schedule Interview</label>
 <div className="flex flex-col gap-4">
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Interview Date & Time</label>
 <input
 type="datetime-local"
 value={meetDate}
 onChange={e => setMeetDate(e.target.value)}
 className="w-full p-4 bg-white rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors"
 />
 </div>
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Google Meet / Zoom Link</label>
 <input
 value={meetLink}
 onChange={e => setMeetLink(e.target.value)}
 placeholder="Paste Link..."
 className="w-full p-4 bg-white rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors"
 />
 </div>
 </div>
 <button
 onClick={() => handleApproveApp(selectedApp.id, selectedApp.userEmail)}
 className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
 >
 Schedule Interview & Send Link
 </button>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <button
 onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
 className="flex-1 py-4 sm:py-5 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-transform text-sm sm:text-base"
 >
 APPROVE MENTOR NOW
 </button>
  <button
  onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
  className="flex-1 py-4 sm:py-5 bg-red-500 text-white font-black rounded-[2rem] shadow-xl shadow-red-500/20 hover:scale-[1.01] transition-transform text-sm sm:text-base"
  >
  REJECT APPLICATION
  </button>
  </div>
  <button
  onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.userName)}
  className="w-full mt-3 py-3 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-colors text-xs flex items-center justify-center gap-2 border border-rose-200"
  >
  <Trash2 className="w-3.5 h-3.5" /> DELETE APPLICATION PERMANENTLY
  </button>
  </div>
  )}

  {selectedApp.status === 'scheduled' && (
 <div className="pt-8 border-t border-slate-100 ">
 <div className="bg-blue-50 /20 p-4 sm:p-6 rounded-[2rem] mb-6 border border-blue-200 ">
 <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Scheduled Interview Link</label>
 {(() => {
 const linkMatch = selectedApp.message?.match(/\[Interview Link:\s*([^\]\n]+)\]/);
 const meetingUrl = linkMatch ? linkMatch[1] : selectedApp.meetingLink;
 const formattedUrl = meetingUrl ? (meetingUrl.startsWith('http') ? meetingUrl : `https://${meetingUrl}`) : null;
 return formattedUrl ? (
 <a href={formattedUrl} target="_blank" rel="noreferrer" className="block w-full p-4 bg-white rounded-2xl font-bold text-blue-600 hover:underline truncate">
 {meetingUrl}
 </a>
 ) : <p className="text-sm text-slate-500">No meeting link found.</p>;
 })()}

 {(() => {
 const dateMatch = selectedApp.message?.match(/\[Interview Date:\s*([^\]\n]+)\]/);
 const meetingDateVal = dateMatch ? dateMatch[1] : selectedApp.meetingDate;
 return meetingDateVal ? (
 <div className="mt-4">
 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Interview Date & Time</label>
 <p className="text-sm font-bold text-slate-700 ">
 {new Date(meetingDateVal).toLocaleString()}
 </p>
 </div>
 ) : null;
 })()}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
 <button
 onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
 className="flex-1 py-4 sm:py-5 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-transform text-sm sm:text-base"
 >
 APPROVE MENTOR NOW
 </button>
  <button
  onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
  className="flex-1 py-4 sm:py-5 bg-red-500 text-white font-black rounded-[2rem] shadow-xl shadow-red-500/20 hover:scale-[1.01] transition-transform text-sm sm:text-base"
  >
  REJECT APPLICATION
  </button>
  </div>
  <button
  onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.userName)}
  className="w-full mt-3 py-3 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-colors text-xs flex items-center justify-center gap-2 border border-rose-200"
  >
  <Trash2 className="w-3.5 h-3.5" /> DELETE APPLICATION PERMANENTLY
  </button>
  </div>
  )}

  {selectedApp.status === 'approved' && (
 <div className="pt-8 border-t border-slate-100 ">
 <div className="bg-rose-50 /20 p-6 rounded-[2rem] border border-rose-200 ">
 <label className="block text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Active Mentor</label>
 <p className="text-sm text-slate-600 mb-6 font-medium">This mentor is currently assigned to teach this course.</p>
  <button
  onClick={() => handleRemoveTeacher(selectedApp.id, selectedApp.userId || (selectedApp as any).user_id, selectedApp.courseId || selectedApp.qualification)}
  className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-colors"
  >
  REMOVE TEACHER
  </button>
  <button
  onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.userName)}
  className="w-full mt-3 py-3 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-colors text-xs flex items-center justify-center gap-2 border border-rose-200"
  >
  <Trash2 className="w-3.5 h-3.5" /> DELETE APPLICATION PERMANENTLY
  </button>
  </div>
  </div>
  )}
  </div>
  </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Course Edit/Create Modal */}
 <AnimatePresence>
 {isCourseModalOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCourseModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
 <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
 <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
 <div>
 <h2 className="text-2xl font-black tracking-tight">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
 <p className="text-xs text-slate-400 font-medium mt-1">{editingCourse ? `Editing: ${editingCourse.title}` : 'Create a new course'}</p>
 </div>
 <button onClick={() => setIsCourseModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 :bg-slate-700 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
 <div className="sm:col-span-2">
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course Title *</label>
 <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to AI" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div className="sm:col-span-2">
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
 <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Course description..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors resize-none" />
 </div>
 <div>
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (₹/month)</label>
 <input type="number" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0 = Free" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
 <select value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors">
 <option value="alternative">Alternative</option>
 <option value="education">Education</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Folder</label>
 <input value={courseForm.folder} onChange={e => setCourseForm(f => ({ ...f, folder: e.target.value }))} placeholder="e.g. Artificial Intelligence" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Level</label>
 <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors">
 <option value="">Any Level</option>
 <option value="beginner">Beginner</option>
 <option value="intermediate">Intermediate</option>
 <option value="advanced">Advanced</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</label>
 <input value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 8 weeks" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Class Level</label>
 <input value={courseForm.classLevel} onChange={e => setCourseForm(f => ({ ...f, classLevel: e.target.value }))} placeholder="e.g. 6-8" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
  </div>
 <div className="sm:col-span-2">
 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">External URL (for provider courses)</label>
 <input value={courseForm.externalUrl} onChange={e => setCourseForm(f => ({ ...f, externalUrl: e.target.value }))} placeholder="https://..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <div className="sm:col-span-2">
 <label className="flex items-center gap-3 cursor-pointer">
 <div className="relative">
 <input type="checkbox" checked={courseForm.comingSoon} onChange={e => setCourseForm(f => ({ ...f, comingSoon: e.target.checked }))} className="sr-only peer" />
 <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-amber-500 transition-colors" />
 <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
 </div>
 <div>
 <span className="block text-sm font-bold text-slate-900 ">Coming Soon</span>
 <span className="block text-[10px] text-slate-400 font-medium">Hide course from students until ready</span>
 </div>
 </label>
 </div>
 </div>
 </div>

 <div className="p-6 sm:p-8 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
 <button onClick={() => setIsCourseModalOpen(false)} className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 :bg-slate-700 transition-colors">
 Cancel
 </button>
 <button onClick={handleSaveCourse} disabled={savingCourse} className="flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-black rounded-2xl transition-colors shadow-lg shadow-emerald-500/20">
 {savingCourse ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
 {editingCourse ? 'Update Course' : 'Create Course'}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default AdminDashboard;
