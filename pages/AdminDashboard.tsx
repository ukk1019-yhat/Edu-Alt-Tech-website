import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, storage, onAuthStateChanged, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, where, orderBy, ref, uploadBytes, getDownloadURL, createEnrollment } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { TeacherApplication } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { toast } from 'react-hot-toast';

const ADMIN_EMAILS = ['ukkukk97@gmail.com', 'umakrishnakanthchokkapu15@gmail.com', 'akulasatyanarayana2006@gmail.com'];

const AdminDashboard: React.FC = () => {
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<'applications' | 'chat' | 'stats' | 'classes' | 'courses'>('applications');
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const navigate = useNavigate();

 // Data states
 const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
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
  } catch {}
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
   try { await db.from('platform_overrides').upsert({ id: editingCourse.id, data: overrides }, { onConflict: 'id' }); } catch {}
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
  fetchData();
  } catch (e: any) {
  toast.error(e?.message || 'Failed to save course');
  } finally {
  setSavingCourse(false);
  }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
   if (isPlatformCourse(courseId)) {
   deletePlatformFromStorage(courseId);
   setCoursesList(prev => prev.filter(c => c.id !== courseId));
   try { await db.from('platform_overrides').upsert({ id: courseId, data: { __deleted: true } }, { onConflict: 'id' }); } catch {}
   toast.success('Platform course hidden');
   return;
  }
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
  await deleteDoc(doc(db, 'courses', courseId));
  toast.success('Course deleted');
  fetchData();
  } catch (e: any) {
  toast.error(e?.message || 'Failed to delete course');
  }
  };

   const handleToggleComingSoon = async (course: any) => {
   const newVal = !course.comingSoon;
   if (isPlatformCourse(course.id)) {
    const overrides = { comingSoon: newVal };
    savePlatformOverrides({ ...JSON.parse(localStorage.getItem('platformCourseOverrides') || '{}'), [course.id]: overrides });
    setCoursesList(prev => applyPlatformOverrides(prev.map(c => c.id === course.id ? { ...c, ...overrides } : c)));
    try { await db.from('platform_overrides').upsert({ id: course.id, data: overrides }, { onConflict: 'id' }); } catch {}
    toast.success(newVal ? 'Marked as Coming Soon' : 'Course released');
    return;
   }
  try {
  await updateDoc(doc(db, 'courses', course.id), { comingSoon: newVal });
  toast.success(newVal ? 'Marked as Coming Soon' : 'Course released');
  fetchData();
  } catch (e: any) {
  toast.error(e?.message || 'Failed to update course');
  }
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
 skills: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n')[0].replace('Skills: ', '') : 'Course Expert',
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

 const [schedulingId, setSchedulingId] = useState<string | null>(null);
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
 try {
 const { error: mailErr } = await db.from('mail').insert({
 to: emailStr,
 subject: 'Interview Scheduled: Teacher Application',
 text: `Your application has been reviewed. Join the interview here: ${meetLink}${meetDate ? ` on ${new Date(meetDate).toLocaleString()}` : ''}`
 });
 if (mailErr) console.warn("Mail insert warning:", mailErr);
 } catch(mailErr) {
 console.warn("Mail send failed (non-blocking)", mailErr);
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
  const planBreakdown = useMemo(() => {
   const counts = { trial: 0, first_class: 0, full: 0 };
   enrollments.forEach((e: any) => {
    const p = e.plan || 'trial';
    if (p in counts) counts[p as keyof typeof counts]++;
   });
   return counts;
  }, [enrollments]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-16" style={{ background: 'var(--bg)' }}>
        <p>Loading...</p>
        <p className="font-mono text-xs flabel" style={{ animation: 'pulse 1.5s infinite' }}>Syncing Core Systems...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="admin-nav-toggle"
      >

      </button>

      {/* Desktop Sidebar (always visible on md+) */}
      <nav className="admin-sidebar">
        <div className="mb-24 flex items-center gap-8">
          <div className="w-10 h-10 flex items-center justify-center text-white" style={{ background: 'var(--accent)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0 0 var(--ink)', borderRadius: '2px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>OPS</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">CORE <span className="text-accent">OPS</span></span>
            <span className="flabel" style={{ fontSize: '0.55rem', marginTop: '2px' }}>Admin Terminal</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-12">
          {[
            { id: 'applications', label: 'Applications', desc: 'Provider review' },
            { id: 'courses', label: 'Course Management', desc: 'CRUD operations' },
            { id: 'chat', label: 'Messages', desc: 'All conversations' },
            { id: 'stats', label: 'Course Stats', desc: 'Enrollment analytics' },
            { id: 'classes', label: 'Scheduled Classes', desc: 'Teacher classes' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); }}
                className="w-full text-left p-12 flex items-center gap-12"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--ink-soft)',
                  border: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                  boxShadow: isActive ? '3px 3px 0 0 var(--ink)' : 'none',
                  cursor: 'pointer',
                  borderRadius: isActive ? '4px' : '0px',
                  fontWeight: 700,
                  transition: 'all 0.1s'
                }}
              >
                
                <div className="flex flex-col items-start">
                  <span className="text-sm">{item.label}</span>
                  <span className="flabel" style={{ fontSize: '0.55rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--ink-mute)' }}>{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-16 border-top">
          <button 
            onClick={() => navigate('/')}
            className="btn btn-full"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            <span>← Exit Console</span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar (overlay, controlled by state) */}
      {isSidebarOpen && (
        <>
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="drawer-overlay visible"
          />
          <nav
            className="admin-sidebar"
            style={{ display: 'flex', zIndex: 60 }}
          >
              <div className="mb-24 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="w-10 h-10 flex items-center justify-center text-white" style={{ background: 'var(--accent)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0 0 var(--ink)', borderRadius: '2px' }}>

                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none">CORE <span className="text-accent">OPS</span></span>
                    <span className="flabel" style={{ fontSize: '0.55rem', marginTop: '2px' }}>Admin Terminal</span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="btn btn-xs">

                </button>
              </div>

              <div className="flex-1 flex flex-col gap-12">
                {[
                  { id: 'applications', label: 'Applications', desc: 'Provider review' },
                  { id: 'courses', label: 'Course Management', desc: 'CRUD operations' },
                  { id: 'chat', label: 'Messages', desc: 'All conversations' },
                  { id: 'stats', label: 'Course Stats', desc: 'Enrollment analytics' },
                  { id: 'classes', label: 'Scheduled Classes', desc: 'Teacher classes' },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                      className="w-full text-left p-12 flex items-center gap-12"
                      style={{
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--ink-soft)',
                        border: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                        boxShadow: isActive ? '3px 3px 0 0 var(--ink)' : 'none',
                        cursor: 'pointer',
                        borderRadius: isActive ? '4px' : '0px',
                        fontWeight: 700,
                        transition: 'all 0.1s'
                      }}
                    >
                      
                      <div className="flex flex-col items-start">
                        <span className="text-sm">{item.label}</span>
                        <span className="flabel" style={{ fontSize: '0.55rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--ink-mute)' }}>{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-16 border-top">
                <button 
                  onClick={() => navigate('/')}
                  className="btn btn-full"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >

                  <span>Exit Console</span>
                </button>
              </div>
            </nav>
          </>
        )}

      {/* Main Content Area */}
      <main className="admin-main">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <header className="mb-40">
            <span className="flabel">Admin Console</span>
            <h1 className="mb-8">
              {activeTab === 'applications' ? 'Provider Applications' : activeTab === 'chat' ? 'Messages' : activeTab === 'stats' ? 'Course Statistics' : activeTab === 'courses' ? 'Course Management' : 'Scheduled Classes'}
            </h1>
            <p className="text-ink-soft">
              {activeTab === 'applications' ? 'Review and manage teacher/provider applications' : activeTab === 'chat' ? 'Direct messaging with providers' : activeTab === 'stats' ? 'Enrollment analytics per course' : activeTab === 'courses' ? 'Create, edit, and delete courses' : 'Live classes scheduled by teachers'}
            </p>
          </header>

          <div>
              {activeTab === 'applications' && (
                <div>
                  <div className="grid-3">
                    {teacherApps.length === 0 ? (
                      <div className="empty-state bento-card" style={{ gridColumn: 'span 3' }}>

                        <h3>NO PENDING DOSSIERS</h3>
                        <p>The system is currently clear of applicants.</p>
                      </div>
                    ) : (
                      teacherApps.map(app => (
                        <div 
                          key={app.id} 
                          className="bento-card"
                          style={{ position: 'relative' }}
                        >
                          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="badge badge-accent">
                              {app.status}
                            </div>
                          </div>

                          <div className="mb-24">
                            <span className="flabel mb-4 block">Applicant</span>
                            <h4 className="font-bold text-lg mb-4">{app.userName}</h4>
                            <p className="text-xs text-accent font-bold uppercase">{app.userEmail}</p>
                          </div>

                          <div className="p-16 mb-24" style={{ background: 'var(--bg-surface)', border: '2px solid var(--ink)', borderRadius: '4px' }}>
                            <span className="flabel mb-4 block">Target Curriculum</span>
                            <p className="font-bold flex items-center gap-8">
                              {app.courseTitle}
                            </p>
                          </div>

                          <div className="flex gap-12 mb-24">
                            <div className="flex-1 p-12 text-center" style={{ background: 'var(--bg-surface)', border: '2px solid var(--ink)', borderRadius: '4px' }}>
                              <span className="block flabel mb-4">Experience</span>
                              <span className="font-bold text-base">{app.experience}y</span>
                            </div>
                            <div className="flex-1 p-12 text-center" style={{ background: 'var(--bg-surface)', border: '2px solid var(--ink)', borderRadius: '4px' }}>
                              <span className="block flabel mb-4">Skills</span>
                              <span className="font-bold text-base text-accent">{app.skills?.split(',').length || 0}</span>
                            </div>
                          </div>

                          {app.status === 'scheduled' && (() => {
                            const linkMatch = app.message?.match(/\[Interview Link:\s*([^\]\n]+)\]/);
                            const meetingUrl = linkMatch ? linkMatch[1] : app.meetingLink;
                            const formattedUrl = meetingUrl ? (meetingUrl.startsWith('http') ? meetingUrl : `https://${meetingUrl}`) : null;
                            return formattedUrl ? (
                              <a href={formattedUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-full mb-12 text-accent truncate">
                                {meetingUrl}
                              </a>
                            ) : null;
                          })()}

                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="btn btn-primary btn-full mt-auto"
                          >
                            REVIEW DOSSIER
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col md:flex-row gap-24" style={{ height: 'calc(100vh - 280px)', minHeight: '550px' }}>
                  {/* Contacts sidebar */}
                  <div className="bento-card flex-col" style={{ width: '280px', flexShrink: 0, padding: 0 }}>
                    <div className="p-16 border-bottom">
                      <h3 className="font-bold text-lg">Contacts</h3>
                      <p className="text-xs text-ink-soft">{chatContacts.length} contacts</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                      {chatContacts.length === 0 ? (
                        <div className="p-24 text-center">

                          <p className="text-sm font-bold text-ink-soft">No contacts yet</p>
                        </div>
                      ) : (
                        chatContacts.map(contact => (
                          <button
                            key={contact.id}
                            onClick={() => selectChatContact(contact)}
                            className="w-full p-12 flex items-center gap-12 text-left border-bottom"
                            style={{
                              background: selectedContact?.id === contact.id ? 'var(--accent-soft)' : 'transparent',
                              border: 'none',
                              borderBottom: '2px solid var(--rule-soft)',
                              cursor: 'pointer',
                              color: 'var(--ink)'
                            }}
                          >
                            <div className="w-10 h-10 flex items-center justify-center font-bold text-white text-sm" style={{ background: 'var(--accent)', borderRadius: '2px' }}>
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-sm truncate">{contact.name}</p>
                              <p className="text-xs text-ink-mute truncate">{contact.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="bento-card flex-1" style={{ padding: 0 }}>
                    {!selectedContact ? (
                      <div className="flex-1 flex items-center justify-center text-center p-24">
                        <div>

                          <h3 className="text-xl font-bold text-ink-soft">Select a Contact</h3>
                          <p className="text-sm text-ink-mute">Choose a provider to start chatting</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full w-full">
                        {/* Chat header */}
                        <div className="p-16 border-bottom flex items-center gap-12">
                          <div className="w-8 h-8 flex items-center justify-center font-bold text-white text-xs" style={{ background: 'var(--accent)', borderRadius: '2px' }}>
                            {selectedContact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{selectedContact.name}</p>
                            <p className="text-xs text-ink-mute">{selectedContact.email}</p>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-auto p-16 flex flex-col gap-12">
                          {chatMessages.length === 0 ? (
                            <div className="text-center py-24">
                              <p className="text-ink-soft font-bold">No messages yet</p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div key={msg.id} className="flex" style={{ justifyContent: msg.role === 'admin' ? 'flex-end' : 'flex-start' }}>
                                <div 
                                  className="p-12"
                                  style={{
                                    maxWidth: '75%',
                                    background: msg.role === 'admin' ? 'var(--accent)' : 'var(--bg-surface-hover)',
                                    color: msg.role === 'admin' ? '#fff' : 'var(--ink)',
                                    border: '2px solid var(--ink)',
                                    borderRadius: '4px',
                                    boxShadow: '2px 2px 0 0 var(--ink)'
                                  }}
                                >
                                  <p className="text-sm leading-relaxed">{msg.content}</p>
                                  <p className="text-[10px] mt-4 text-right" style={{ color: msg.role === 'admin' ? '#fff' : 'var(--ink-mute)', opacity: 0.8 }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input */}
                        <div className="p-16 border-top">
                          <div className="flex gap-12">
                            <input
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                              placeholder="Type a message..."
                              className="input flex-1"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={sendingMessage || !chatInput.trim()}
                              className="btn btn-primary"
                            >
                              {sendingMessage ? '...' : ''}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="flex flex-col gap-24">
                  {/* Summary cards */}
                  <div className="grid-3">
                    <div className="bento-card">
                      <span className="flabel">Total Courses</span>
                      <p className="stat-value">{coursesList.length}</p>
                    </div>
                    <div className="bento-card">
                      <span className="flabel">Total Enrollments</span>
                      <p className="stat-value accented">{enrollments.length}</p>
                    </div>
                    <div className="bento-card">
                      <span className="flabel">Active Enrollments</span>
                      <p className="stat-value" style={{ color: 'var(--accent)' }}>{activeCount}</p>
                    </div>
                  </div>

                  {/* Plan Breakdown */}
                  <div className="grid-3">
                    <div className="bento-card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
                      <span className="flabel" style={{ color: 'var(--accent)' }}>Trial</span>
                      <p className="stat-value" style={{ color: 'var(--accent)' }}>{planBreakdown.trial}</p>
                    </div>
                    <div className="bento-card" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
                      <span className="flabel" style={{ color: 'var(--warning)' }}>First Class</span>
                      <p className="stat-value" style={{ color: 'var(--warning)' }}>{planBreakdown.first_class}</p>
                    </div>
                    <div className="bento-card" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)' }}>
                      <span className="flabel" style={{ color: 'var(--danger)' }}>Full Access</span>
                      <p className="stat-value" style={{ color: 'var(--danger)' }}>{planBreakdown.full}</p>
                    </div>
                  </div>

                  {/* Course enrollment table */}
                  <div className="bento-card" style={{ padding: 0 }}>
                    <div className="p-16 border-bottom flex justify-between items-center flex-wrap gap-12">
                      <h3 className="font-bold text-lg">Enrollments by Course</h3>
                      <div className="flex gap-8">
                        {(['all', 'free', 'paid'] as const).map(f => (
                          <button key={f} onClick={() => setPriceFilter(f)}
                            className="btn btn-xs"
                            style={priceFilter === f ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : undefined}
                          >
                            {f === 'free' ? '₹0 (Free)' : f === 'paid' ? 'Paid' : 'All'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Enrollments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coursesList
                            .filter(c => priceFilter === 'all' || (priceFilter === 'free' ? (!c.price || c.price === 0) : (c.price && c.price > 0)))
                            .map((course: any) => {
                              const count = enrollmentCounts[course.id] || 0;
                              return (
                                <tr key={course.id}>
                                  <td>
                                    <div className="flex items-center gap-12">
                                      <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-xs" style={{ background: 'var(--accent)', borderRadius: '2px' }}>
                                        {course.title?.charAt(0) || 'C'}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-8">
                                          <p className="font-bold text-sm text-ink">{course.title || 'Untitled'}</p>
                                          {course.comingSoon && <span className="badge badge-warning text-[10px]">Soon</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="text-xs font-semibold text-ink">
                                      {!course.price || course.price === 0 ? 'Free' : `₹${course.price}/month`}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="text-xs text-ink-soft">{course.category || 'Uncategorized'}</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className={`badge ${count > 0 ? 'badge-accent' : ''}`} style={{ fontFamily: 'var(--font-mono)' }}>
                                      {count}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'classes' && (
                <div>
                  {loadingClasses ? (
                    <div className="flex justify-center py-24"><p>Loading...</p></div>
                  ) : scheduledClasses.length === 0 ? (
                    <div className="empty-state bento-card">

                      <h3>No Scheduled Classes</h3>
                      <p>Teachers have not scheduled any live classes yet.</p>
                    </div>
                  ) : (
                    <div className="grid-3">
                      {scheduledClasses.map((sc) => (
                        <div key={sc.id} className="bento-card">
                          <div className="flex items-center gap-12 mb-12">
                            <div className="w-10 h-10 flex items-center justify-center font-bold text-white shrink-0" style={{ background: 'var(--accent)', borderRadius: '2px' }}>

                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate">{sc.title}</p>
                              <p className="text-xs text-ink-mute font-mono mt-4">
                                {sc.scheduled_at ? new Date(sc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-ink-soft mb-16" style={{ minHeight: '40px' }}>{sc.description || 'No description'}</p>
                          <div className="flex items-center gap-8 mb-16">
                            <span className="flabel">Teacher:</span>
                            <span className="text-xs font-bold text-ink">{sc.users?.display_name || sc.teacher_id?.slice(0, 8) || 'Unknown'}</span>
                          </div>
                          <a href={sc.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-full mt-auto">
                            Join Class
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="flex flex-col gap-24">
                  {/* Summary cards */}
                  <div className="grid-3">
                    <div className="bento-card">
                      <span className="flabel">Total Courses</span>
                      <p className="stat-value">{coursesList.length}</p>
                    </div>
                    <div className="bento-card">
                      <span className="flabel">Total Enrollments</span>
                      <p className="stat-value accented">{enrollments.length}</p>
                    </div>
                    <div className="bento-card">
                      <span className="flabel">Active Enrollments</span>
                      <p className="stat-value" style={{ color: 'var(--accent)' }}>{activeCount}</p>
                    </div>
                  </div>

                  {/* Search & Add bar */}
                  <div className="flex justify-between items-center flex-wrap gap-12">
                    <div className="flex items-center flex-wrap gap-12 w-full md:w-auto">
                      <input 
                        type="text" 
                        placeholder="Search courses..." 
                        value={courseSearch} 
                        onChange={e => setCourseSearch(e.target.value)}
                        className="input" 
                        style={{ width: '240px' }}
                      />
                      <div className="flex gap-8">
                        {(['all', 'free', 'paid'] as const).map(f => (
                          <button key={f} onClick={() => setCoursePriceFilter(f)}
                            className="btn btn-xs"
                            style={coursePriceFilter === f ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : undefined}
                          >
                            {f === 'free' ? 'Free' : f === 'paid' ? 'Paid' : 'All'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={openAddCourse} className="btn btn-primary">
                      Add Course
                    </button>
                  </div>

                  {/* Course table */}
                  <div className="bento-card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Folder</th>
                            <th>Price</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCoursesList.map((course: any) => (
                            <tr key={course.id}>
                              <td>
                                <div className="flex items-center gap-12">
                                  <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-xs" style={{ background: 'var(--accent)', borderRadius: '2px' }}>
                                    {course.title?.charAt(0) || 'C'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-8">
                                      <p className="font-bold text-sm text-ink">{course.title || 'Untitled'}</p>
                                      {course.comingSoon && <span className="badge badge-warning text-[10px]">Soon</span>}
                                    </div>
                                    <p className="text-[10px] text-ink-mute font-mono">{course.id?.slice(0, 8)}...</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-xs text-ink-soft">{course.folder || '—'}</span>
                              </td>
                              <td>
                                <span className={`text-xs font-bold ${!course.price || course.price === 0 ? 'text-accent' : 'text-ink'}`}>
                                  {!course.price || course.price === 0 ? 'Free' : `₹${course.price}/month`}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="flex items-center justify-end gap-8">
                                  <button onClick={() => handleToggleComingSoon(course)} className="btn btn-xs" title={course.comingSoon ? 'Release course' : 'Mark as Coming Soon'}>
                                    {course.comingSoon ? '' : ''}
                                  </button>
                                  <button onClick={() => openEditCourse(course)} className="btn btn-xs" title="Edit">

                                  </button>
                                  <button onClick={() => handleDeleteCourse(course.id, course.title)} className="btn btn-xs" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} title="Delete">

                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredCoursesList.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-16 text-center">

                                <p className="text-ink-soft font-bold">{courseSearch ? 'No courses match your search' : 'No courses yet.'}</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      </main>

      {/* Premium Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-16">
          <div
            onClick={() => setSelectedApp(null)}
            className="drawer-overlay visible"
          />
          <div
            className="relative w-full max-w-2xl bg-white"
            style={{ border: '2px solid var(--ink)', boxShadow: '8px 8px 0 0 var(--ink)', borderRadius: '4px', overflow: 'hidden' }}
          >
              <div className="p-24">
                <div className="flex justify-between items-center mb-24">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Mentor Review</h2>
                    <p className="flabel">Application Dossier #{selectedApp.id.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="btn btn-xs">

                  </button>
                </div>
                
                <div className="flex flex-col gap-24 overflow-auto pr-8" style={{ maxHeight: '60vh' }}>
                  <div>
                    <label className="flabel block mb-8">Applicant Profile</label>
                    <div className="grid-2">
                      <div>
                        <p className="text-xs flabel mb-4">Name</p>
                        <p className="font-bold text-sm">{selectedApp.userName}</p>
                      </div>
                      <div>
                        <p className="text-xs flabel mb-4">Target Curriculum</p>
                        <p className="font-bold text-sm">{selectedApp.courseTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs flabel mb-4">Highest Qualification</p>
                        <p className="font-bold text-sm">{selectedApp.highestQualification || (selectedApp as any).highest_qualification || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs flabel mb-4">Languages to Teach</p>
                        <p className="font-bold text-sm text-accent">{selectedApp.languages || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flabel block mb-8">Professional Experience</label>
                    <p className="text-sm text-ink-soft p-12" style={{ background: 'var(--bg-surface)', border: '2px solid var(--ink)', borderRadius: '4px' }}>
                      {selectedApp.experience || 'No experience provided.'}
                    </p>
                  </div>

                  {selectedApp.status === 'pending' && (
                    <div className="border-top pt-16">
                      <div className="p-16 mb-16" style={{ background: 'var(--bg-surface)', border: '2px solid var(--ink)', borderRadius: '4px' }}>
                        <label className="flabel block mb-12">Schedule Interview</label>
                        <div className="flex flex-col gap-12">
                          <div className="flex flex-col md:flex-row gap-12">
                            <div className="flex-1">
                              <label className="text-xs font-bold block mb-4">Interview Date & Time</label>
                              <input
                                type="datetime-local"
                                value={meetDate}
                                onChange={e => setMeetDate(e.target.value)}
                                className="input"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-bold block mb-4">Google Meet / Zoom Link</label>
                              <input
                                value={meetLink}
                                onChange={e => setMeetLink(e.target.value)}
                                placeholder="Paste Link..."
                                className="input"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleApproveApp(selectedApp.id, selectedApp.userEmail)}
                            className="btn btn-primary"
                          >
                            Schedule Interview & Send Link
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-12">
                        <button
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
                          className="btn btn-primary flex-1"
                        >
                          APPROVE MENTOR NOW
                        </button>
                        <button
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
                          className="btn flex-1"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                          REJECT APPLICATION
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedApp.status === 'scheduled' && (
                    <div className="border-top pt-16">
                      <div className="p-16 mb-16" style={{ background: 'var(--accent-soft)', border: '2px solid var(--accent)', borderRadius: '4px' }}>
                        <label className="flabel block mb-8" style={{ color: 'var(--accent)' }}>Scheduled Interview Link</label>
                        {(() => {
                          const linkMatch = selectedApp.message?.match(/\[Interview Link:\s*([^\]\n]+)\]/);
                          const meetingUrl = linkMatch ? linkMatch[1] : selectedApp.meetingLink;
                          const formattedUrl = meetingUrl ? (meetingUrl.startsWith('http') ? meetingUrl : `https://${meetingUrl}`) : null;
                          return formattedUrl ? (
                            <a href={formattedUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-full text-accent truncate">
                              {meetingUrl}
                            </a>
                          ) : <p className="text-xs text-ink-mute">No meeting link found.</p>;
                        })()}

                        {(() => {
                          const dateMatch = selectedApp.message?.match(/\[Interview Date:\s*([^\]\n]+)\]/);
                          const meetingDateVal = dateMatch ? dateMatch[1] : selectedApp.meetingDate;
                          return meetingDateVal ? (
                            <div className="mt-12">
                              <label className="flabel block mb-4">Interview Date & Time</label>
                              <p className="text-xs font-bold text-ink">
                                {new Date(meetingDateVal).toLocaleString()}
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      <div className="flex gap-12">
                        <button
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
                          className="btn btn-primary flex-1"
                        >
                          APPROVE MENTOR NOW
                        </button>
                        <button
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
                          className="btn flex-1"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                          REJECT APPLICATION
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedApp.status === 'approved' && (
                    <div className="border-top pt-16">
                      <div className="p-16" style={{ background: 'var(--danger-bg)', border: '2px solid var(--danger)', borderRadius: '4px' }}>
                        <label className="flabel block mb-4" style={{ color: 'var(--danger)' }}>Active Mentor</label>
                        <p className="text-xs text-ink-soft mb-16">This mentor is currently assigned to teach this course.</p>
                        <button
                          onClick={() => handleRemoveTeacher(selectedApp.id, selectedApp.userId || (selectedApp as any).user_id, selectedApp.courseId || selectedApp.qualification)}
                          className="btn btn-full"
                          style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
                        >
                          REMOVE TEACHER
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Course Edit/Create Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-16">
          <div onClick={() => setIsCourseModalOpen(false)} className="drawer-overlay visible" />
          <div
            className="relative w-full max-w-2xl bg-white max-h-[90vh] flex flex-col"
            style={{ border: '2px solid var(--ink)', boxShadow: '8px 8px 0 0 var(--ink)', borderRadius: '4px', overflow: 'hidden' }}>
              <div className="p-16 border-bottom flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
                  <p className="text-xs text-ink-soft mt-4">{editingCourse ? `Editing: ${editingCourse.title}` : 'Create a new course'}</p>
                </div>
                <button onClick={() => setIsCourseModalOpen(false)} className="btn btn-xs">
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-auto p-16 space-y-16">
                <div className="grid-2">
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="flabel block mb-8">Course Title *</label>
                    <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to AI" className="input" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="flabel block mb-8">Description</label>
                    <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Course description..." className="input" style={{ resize: 'none' }} />
                  </div>
                  <div>
                    <label className="flabel block mb-8">Price (₹/month)</label>
                    <input type="number" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0 = Free" className="input" />
                  </div>
                  <div>
                    <label className="flabel block mb-8">Category</label>
                    <select value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))} className="input">
                      <option value="alternative">Alternative</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                  <div>
                    <label className="flabel block mb-8">Folder</label>
                    <input value={courseForm.folder} onChange={e => setCourseForm(f => ({ ...f, folder: e.target.value }))} placeholder="e.g. Artificial Intelligence" className="input" />
                  </div>
                  <div>
                    <label className="flabel block mb-8">Level</label>
                    <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} className="input">
                      <option value="">Any Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="flabel block mb-8">Duration</label>
                    <input value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 8 weeks" className="input" />
                  </div>
                  <div>
                    <label className="flabel block mb-8">Class Level</label>
                    <input value={courseForm.classLevel} onChange={e => setCourseForm(f => ({ ...f, classLevel: e.target.value }))} placeholder="e.g. 6-8" className="input" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="flabel block mb-8">External URL (for provider courses)</label>
                    <input value={courseForm.externalUrl} onChange={e => setCourseForm(f => ({ ...f, externalUrl: e.target.value }))} placeholder="https://..." className="input" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="flex items-center gap-12 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={courseForm.comingSoon} onChange={e => setCourseForm(f => ({ ...f, comingSoon: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-amber-500 transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-ink">Coming Soon</span>
                        <span className="block text-[10px] text-ink-mute">Hide course from students until ready</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-16 border-top flex items-center justify-end gap-12 shrink-0">
                <button onClick={() => setIsCourseModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveCourse} disabled={savingCourse} className="btn btn-primary">
                  {savingCourse ? '...' : ''}
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminDashboard;
