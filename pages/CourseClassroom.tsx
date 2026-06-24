import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, storage, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, arrayUnion, arrayRemove, ref, uploadBytes, getDownloadURL, onAuthStateChanged } from '../lib/firebase';
import { Course, CourseEnrollment, CourseModule, ModuleLecture, CourseResource } from '../types';
import type { User } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import CourseChat from '../components/CourseChat';
import { recordModuleComplete, getOrCreateMetrics } from '../lib/userProgress';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { adaptDifficulty } from '../lib/learningPath';
import type { EnrollmentPlan } from '../types';
import DoubtSolver from '../components/DoubtSolver';
import LearningPathView from '../components/LearningPathView';

const CourseClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [allEnrollments, setAllEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [activeTab, setActiveTab] = useState<'classroom' | 'roadmap' | 'chat' | 'path' | 'live'>('classroom');
  const [enrolledCount, setEnrolledCount] = useState(0);

  const [activeLecture, setActiveLecture] = useState<ModuleLecture | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (modules.length > 0 && !activeLecture) {
      const firstModuleWithLectures = modules.find(m => m.lectures && m.lectures.length > 0);
      if (firstModuleWithLectures && firstModuleWithLectures.lectures && firstModuleWithLectures.lectures.length > 0) {
        setActiveLecture(firstModuleWithLectures.lectures[0]);
      }
    }
  }, [modules, activeLecture]);

  useEffect(() => {
    if (activeLecture) {
      const savedNotes = localStorage.getItem(`notes-${courseId}-${activeLecture.id}`);
      setNotes(savedNotes || '');
    }
  }, [activeLecture, courseId]);

  const saveNotes = () => {
    if (activeLecture) {
      localStorage.setItem(`notes-${courseId}-${activeLecture.id}`, notes);
      toast.success("Notes saved successfully!");
    }
  };

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);

  const fetchLiveClasses = async (courseIdStr: string) => {
    setLoadingLiveClasses(true);
    try {
      const { data, error } = await db.from('scheduled_classes').select('*').eq('course_id', courseIdStr).order('scheduled_at', { ascending: false });
      if (!error) setLiveClasses(data || []);
    } catch (e) { console.error("Failed to load live classes", e); }
    finally { setLoadingLiveClasses(false); }
  };

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState<string | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mThumb, setMThumb] = useState('');
  const [mThumbFile, setMThumbFile] = useState<File | null>(null);

  const [lTitle, setLTitle] = useState('');
  const [lMeet, setLMeet] = useState('');
  const [lRec, setLRec] = useState('');

  const [rTitle, setRTitle] = useState('');
  const [rUrl, setRUrl] = useState('');

  const fetchClassroomData = async (courseIdStr: string) => {
    try {
      const mQ = query(collection(db, 'course_modules'), where('courseId', '==', courseIdStr));
      const mSnap = await getDocs(mQ);
      const loadedModules = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseModule));
      loadedModules.sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(loadedModules);
      const rQ = query(collection(db, 'resources'), where('courseId', '==', courseIdStr));
      const rSnap = await getDocs(rQ);
      setResources(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseResource)));
      await fetchLiveClasses(courseIdStr);
    } catch (e) { console.error("Failed to load classroom items", e); }
  };

  useEffect(() => {
    const init = async (currentUser: User | null) => {
      if (!courseId) return;
      if (!currentUser) { navigate('/login'); return; }
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        } else {
          const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === courseId);
          if (idx !== -1) setCourse({ id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course);
        }
        const eQ = query(collection(db, 'enrollments'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
        const eSnap = await getDocs(eQ);
        if (eSnap.empty) { navigate(`/courses/${courseId}`); return; }
        const allDocs = eSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment));
        const studentEnrs = allDocs.filter(d => d.role === 'student' && d.studentStatus === 'active');
        const teacherEnr = allDocs.find(d => d.role === 'teacher');
        let primaryEnr: CourseEnrollment;
        if (teacherEnr) { primaryEnr = teacherEnr; setAllEnrollments([teacherEnr]); }
        else if (studentEnrs.length > 0) { primaryEnr = studentEnrs[0]; setAllEnrollments(studentEnrs); }
        else { navigate(`/courses/${courseId}`); return; }
        setEnrollment(primaryEnr);
        try {
          const { count } = await db.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId).eq('role', 'student');
          setEnrolledCount(count || 0);
        } catch (_) {}
        if (primaryEnr.role === 'teacher') {
          const tQ = query(collection(db, 'teacher_applications'), where('userId', '==', currentUser.uid), where('status', '==', 'approved'));
          const tSnap = await getDocs(tQ);
          const isApprovedForCourse = tSnap.docs.some(d => (d.data().qualification || '') === courseId);
          if (!isApprovedForCourse) { navigate(`/courses/${courseId}`); return; }
          setRole('teacher');
        } else {
          if (primaryEnr.studentStatus !== 'active') { navigate(`/courses/${courseId}`); return; }
          setRole('student');
        }
        await fetchClassroomData(courseId);
      } catch (err) { console.error("Access error", err); }
      finally { setLoading(false); }
    };
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); init(currentUser); });
    const safetyTimer = setTimeout(() => setLoading(false), 8000);
    return () => { unsubscribe(); clearTimeout(safetyTimer); };
  }, [courseId, navigate]);

  const loadRazorpayScript = () => new Promise((resolve) => { const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => resolve(true); s.onerror = () => resolve(false); document.body.appendChild(s); });

  const handleUpgradeFullAccess = async () => {
    if (!user || !course) return;
    setUpgradeLoading(true);
    try {
      const amountInPaise = (course.price || 0) * 100;
      const resOrder = await fetch('/api/createOrder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise })
      });
      if (!resOrder.ok) {
        if (resOrder.status === 404) throw new Error("Payment API not found. If running locally, please use 'npx vercel dev' instead of 'npm run dev'.");
        const errorData = await resOrder.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${resOrder.status})`);
      }
      const orderData = await resOrder.json();
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) { alert("Payment gateway failed to load. Please check your internet connection."); setUpgradeLoading(false); return; }
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T2D67OLLpfRjtJ",
        amount: amountInPaise, currency: "INR", name: "Edu Alt Tech",
        description: `Upgrade subscription for ${course.title}`, image: "/edulogo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const resVerify = await fetch('/api/verifyPayment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature })
            });
            if (!resVerify.ok) { const verifyErrorData = await resVerify.json().catch(() => ({})); throw new Error(verifyErrorData.error || "Payment verification failed on server"); }
            const verifyData = await resVerify.json();
            if (verifyData.success) {
              if (enrollment) {
                const enrRef = doc(db, 'enrollments', enrollment.id);
                await updateDoc(enrRef, { paymentStatus: 'paid', plan: 'full' });
                setEnrollment({ ...enrollment, paymentStatus: 'paid', plan: 'full' });
                toast.success("Successfully upgraded to full access!");
                try { await addDoc(collection(db, 'mail'), { to: user.email, message: { subject: `Subscription Upgraded: ${course.title}`, text: `Hi ${user.displayName || 'Student'},\n\nThank you for upgrading! Your subscription to ${course.title} is now fully active. You have full access to all classes, community forums, and assets.\n\nHappy Learning,\nEdu-Alt-Tech` } }); } catch (e) { console.error("Email notification failed", e); }
              }
            } else throw new Error(verifyData.error || "Invalid Security Signature");
          } catch (e: any) { console.error("Verification error:", e); alert(`Payment processed, but upgrade failed: ${e.message}`); }
        },
        prefill: { name: user.displayName || "", email: user.email || "" },
        theme: { color: "#10b981" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => alert(`Payment Failed: ${resp.error.description}`));
      rzp.open();
    } catch (err: any) { console.error("Payment flow error:", err); alert(err.message || "An unexpected error occurred during payment."); }
    finally { setUpgradeLoading(false); }
  };

  const handleTabClick = (tabName: 'classroom' | 'roadmap' | 'chat' | 'path' | 'live') => setActiveTab(tabName);

  const toggleModule = (id: string) => setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      let finalThumbUrl = mThumb;
      if (mThumbFile) { const fileRef = ref(storage, `module_thumbnails/${Date.now()}_${mThumbFile.name}`); const snap = await uploadBytes(fileRef, mThumbFile); finalThumbUrl = await getDownloadURL(snap.ref); }
      await addDoc(collection(db, 'course_modules'), { courseId, teacherId: user.uid, title: mTitle, description: mDesc, order: modules.length + 1, lectures: [], thumbnailUrl: finalThumbUrl || '', createdAt: serverTimestamp() });
      setShowModuleModal(false); setMTitle(''); setMDesc(''); setMThumb(''); setMThumbFile(null);
      fetchClassroomData(courseId); toast.success("Module deployed to roadmap");
    } catch (err) { toast.error("Deployment failed"); }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId || !showLectureModal) return;
    try {
      const moduleRef = doc(db, 'course_modules', showLectureModal);
      const newLecture: ModuleLecture = { id: Date.now().toString(), title: lTitle, meetingLink: lMeet, recordedLink: lRec, createdAt: new Date().toISOString() };
      const mod = modules.find(m => m.id === showLectureModal);
      const currentLectures = mod?.lectures || [];
      await updateDoc(moduleRef, { lectures: [...currentLectures, newLecture] });
      setShowLectureModal(null); setLTitle(''); setLMeet(''); setLRec('');
      fetchClassroomData(courseId); toast.success("Lecture synced to module");
    } catch (err) { toast.error("Sync failed"); }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      await addDoc(collection(db, 'resources'), { courseId, title: rTitle, url: rUrl, createdAt: serverTimestamp() });
      setShowResourceModal(false); setRTitle(''); setRUrl('');
      fetchClassroomData(courseId); toast.success("Resource uploaded");
    } catch (err) { toast.error("Upload failed"); }
  };

  const handleToggleComplete = async (moduleId: string) => {
    if (!enrollment || role !== 'student') return;
    try {
      const isCompleted = enrollment.completedModules?.includes(moduleId);
      const enrRef = doc(db, 'enrollments', enrollment.id);
      let newCompleted = enrollment.completedModules || [];
      if (isCompleted) { newCompleted = newCompleted.filter(id => id !== moduleId); }
      else { newCompleted = [...newCompleted, moduleId]; }
      await updateDoc(enrRef, { completedModules: isCompleted ? arrayRemove(moduleId) : arrayUnion(moduleId) });
      setEnrollment({ ...enrollment, completedModules: newCompleted });
      if (!isCompleted && user) {
        await recordModuleComplete(user.uid, courseId!);
        const metrics = await getOrCreateMetrics(user.uid, courseId!, modules.length);
        await adaptDifficulty(user.uid, courseId!, { ...metrics, completedModules: newCompleted.length });
      }
      toast.success(isCompleted ? "Checkpoint reset" : "Module mastered! Progress updated.");
    } catch (err) { toast.error("Status update failed"); }
  };

  if (loading) {
    return (
      <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: 200 }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (!course) return (
    <div className="empty-state">
      <h3>Course not found</h3>
      <p>The course you're looking for doesn't exist or has been removed.</p>
      <Link to="/courses" className="btn btn-primary" style={{ marginTop: 12 }}>Browse Courses</Link>
    </div>
  );

  const completedCount = enrollment?.completedModules?.length || 0;
  const totalCount = modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const plan = enrollment?.plan || 'full';
  const planLimits: Record<EnrollmentPlan, number> = { trial: 1, first_class: 2, full: Infinity };
  const maxModuleIndex = planLimits[plan] ?? Infinity;
  const isRestricted = plan !== 'full';

  return (
    <div>
      {/* ── Breadcrumbs ── */}
      <div className="breadcrumbs">
        <Link to="/dashboard">Dashboard</Link>
        <span className="sep">→</span>
        <span>{course.title}</span>
      </div>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="flex" style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="flabel">{role === 'teacher' ? 'Instructional Mode' : 'Learning Pathway'}</span>
            {role === 'student' && allEnrollments.length > 1 && (
              <select className="input" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}
                value={enrollment?.id || ''}
                onChange={(e) => { const sel = allEnrollments.find(en => en.id === e.target.value); if (sel) setEnrollment(sel); }}
              >
                {allEnrollments.map((en, i) => <option key={en.id} value={en.id}>Mentor {i + 1}</option>)}
              </select>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-mute)' }}>Updated 2d ago</span>
          </div>
          <h1 style={{ margin: 0 }}>{course.title}</h1>
        </div>
        {role === 'teacher' && (
          <div className="flex" style={{ gap: 8 }}>
            <button onClick={() => setShowResourceModal(true)} className="btn btn-sm btn-secondary">Add Resource</button>
            <button onClick={() => setShowModuleModal(true)} className="btn btn-sm btn-primary">New Module</button>
          </div>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="tab-bar mb-24">
        {([
          { id: 'classroom' as const, label: 'Active Classroom' },
          { id: 'roadmap' as const, label: 'Curriculum Roadmap' },
          { id: 'chat' as const, label: 'Chat' },
          ...(role === 'student' ? [{ id: 'path' as const, label: 'AI Roadmap' }] : []),
          { id: 'live' as const, label: 'Live Classes' },
        ]).map(t => (
          <button key={t.id} onClick={() => handleTabClick(t.id)}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="classroom-grid">
        {/* ===== MAIN (LEFT) ===== */}
        <div>
          {activeTab === 'classroom' ? (
            <div className="flex flex-col gap-24">
              {activeLecture ? (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <span className="flabel">Now Playing</span>
                      <h2 style={{ margin: '4px 0 0' }}>{activeLecture.title}</h2>
                    </div>
                    {activeLecture.recordedLink && (
                      <span className="badge badge-accent">RECORDED SESSION</span>
                    )}
                  </div>
                  
                  {getEmbedUrl(activeLecture.recordedLink || activeLecture.meetingLink) ? (
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 0 var(--ink)' }}>
                      <iframe
                        src={getEmbedUrl(activeLecture.recordedLink || activeLecture.meetingLink)!}
                        title={activeLecture.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    </div>
                  ) : (
                    <div className="bento-card justify-center items-center" style={{ minHeight: 320, background: 'var(--bg-surface-hover)', cursor: 'pointer', textAlign: 'center' }}>
                      <h3 style={{ margin: 0 }}>{activeLecture.title}</h3>
                      <p style={{ margin: '8px 0 16px', fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Click to join live external session stream</p>
                      <a href={activeLecture.meetingLink || activeLecture.recordedLink || '#'} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        Launch Live Stream
                      </a>
                    </div>
                  )}

                  {/* Notes Card */}
                  <div className="bento-card mt-24">
                    <span className="flabel mb-4">Classroom Notes</span>
                    <h3 style={{ margin: '4px 0 12px' }}>Personal Study Log</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', marginBottom: 8 }}>
                      Notes are automatically saved locally for this lecture.
                    </p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Type your notes here while watching the lecture..."
                      className="input mb-12"
                      style={{ minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}
                    />
                    <button onClick={saveNotes} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bento-card text-center py-48">
                  <h3>No session selected</h3>
                  <p>Select a lecture from the curriculum sidebar to start learning.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'roadmap' ? (
            <div className="flex flex-col gap-24">
              {/* Progress Card */}
              <div className="bento-card">
                <div className="flex" style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Your Progress</h4>
                    <div className="flex" style={{ alignItems: 'baseline', gap: 4 }}>
                      <span className="stat-value" style={{ fontSize: '1.8rem', margin: 0 }}>{progressPercent}%</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Complete</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--bg)', border: '1px solid var(--ink)', marginBottom: 8 }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>{completedCount} of {totalCount} milestones mastered</p>
              </div>

              {/* Upgrade Card */}
              {role === 'student' && isRestricted && (
                <div className="bento-card bento-card-accent">
                  <h4 style={{ margin: '0 0 4px' }}>{plan === 'trial' ? 'Trial Mode' : 'First Class'}</h4>
                  <p style={{ fontSize: '0.8rem', margin: '0 0 12px' }}>
                    {plan === 'trial' ? "You're viewing module 1. Upgrade to full access and unlock the complete course." : 'You have access to beginner modules. Upgrade to unlock all advanced content.'}
                  </p>
                  <button className="btn btn-primary btn-full" onClick={handleUpgradeFullAccess} disabled={upgradeLoading}>
                    {upgradeLoading ? 'Processing...' : `Upgrade to Full — ₹${course?.price || 0}/mo`}
                  </button>
                </div>
              )}

              {/* Students (teacher) */}
              {role === 'teacher' && (
                <div className="bento-card">
                  <div className="flex" style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h4 style={{ margin: 0 }}>Students</h4>
                    <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>{enrolledCount} enrolled</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Monitor student progress and engagement from the Teacher Panel.</p>
                </div>
              )}

              {/* Resources (Vault) Card */}
              <div className="bento-card">
                <div className="flex" style={{ alignItems: 'center', gap: 8, justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="flex items-center gap-6" style={{ margin: 0 }}>Vault</h3>
                  <span className="flabel">{resources.length} ITEMS</span>
                </div>
                {resources.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 16px' }}>
                    <p style={{ margin: 0 }}>No resources yet.</p>
                  </div>
                ) : (
                  <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
                    {resources.map((res) => {
                      const isResourceLocked = isRestricted;
                      return (
                        <a key={res.id} href={isResourceLocked ? undefined : res.url} target={isResourceLocked ? undefined : "_blank"} rel="noreferrer"
                          onClick={(e) => { if (isResourceLocked) { e.preventDefault(); if (confirm("Vault resources require full course access. Upgrade now to unlock?")) handleUpgradeFullAccess(); return; } if (user) { (async () => { try { await db.from('user_downloads').insert({ user_id: user.uid, resource_title: res.title, resource_url: res.url, resource_type: 'link', course_id: courseId, downloaded_at: new Date().toISOString() }); } catch {} })(); } }}
                          className="flex" style={{ alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)', textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{ flexShrink: 0 }}>
                            {isResourceLocked ? (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--ink-mute)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : null}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{res.title}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--ink-mute)' }}>{isResourceLocked ? 'Locked (Trial)' : 'External Asset'}</p>
                          </div>

                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'live' ? (
            <div className="bento-card">
              <h3 className="flex" style={{ alignItems: 'center', gap: 8, margin: '0 0 16px' }}>Upcoming Live Classes</h3>
              {liveClasses.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <p>No live classes scheduled yet.</p>
                </div>
              ) : (
                <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
                  {liveClasses.map((lc) => (
                    <div key={lc.id} className="bento-card-compact flex" style={{ alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                      <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{lc.title}</h4>
                          {lc.description && <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>{lc.description}</p>}
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date set'}
                          </span>
                        </div>
                      </div>
                      <a href={lc.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">Join Now</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'path' ? (
            <LearningPathView courseId={courseId!} courseTitle={course.title} courseDescription={course.description} />
          ) : (
            <div className="bento-card">
              <CourseChat courseId={courseId!} currentUser={user} mentorId={role === 'teacher' ? user!.uid : enrollment?.mentorId || ''} role={role as 'student' | 'teacher'} />
            </div>
          )}
        </div>

        {/* ===== SIDEBAR (RIGHT) ===== */}
        <div className="flex flex-col gap-20">
          <div className="bento-card bento-card-compact">
            <h4 className="flex items-center gap-8 mb-12">Course Modules</h4>
            <div className="flex flex-col gap-8" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {modules.length === 0 ? (
                <div className="empty-state">
                  <p style={{ margin: 0 }}>No modules yet.</p>
                </div>
              ) : (
                modules.map((mod, idx) => {
                  const isCompleted = enrollment?.completedModules?.includes(mod.id);
                  const isExpanded = expandedModules.includes(mod.id);
                  const isLocked = idx >= maxModuleIndex;
                  return (
                    <div key={mod.id} className={`accordion-item ${isExpanded ? 'active' : ''}`}>
                      <button className="accordion-trigger" onClick={() => toggleModule(mod.id)} style={{ padding: '8px 12px' }}>
                        <span className="flex items-center gap-8" style={{ minWidth: 0 }}>
                          <span className="flabel" style={{ flexShrink: 0 }}>M0{idx + 1}</span>
                          <span className="truncate" style={{ fontWeight: 600, fontSize: '0.8rem' }}>{mod.title}</span>
                          {isCompleted && <span className="badge badge-accent btn-xs" style={{ fontSize: '0.55rem', padding: '1px 4px', flexShrink: 0 }}>Mastered</span>}
                        </span>

                      </button>
                      <div className="accordion-content" style={{ padding: '0 12px 8px' }}>
                        {mod.description && <p className="text-xs mb-8" style={{ color: 'var(--ink-soft)' }}>{mod.description}</p>}
                        
                        {(!mod.lectures || mod.lectures.length === 0) ? (
                          <p style={{ fontSize: '0.75rem', color: 'var(--ink-mute)', margin: 0 }}>No sessions scheduled.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {mod.lectures.map((lec, lIdx) => {
                              const locked = isLocked;
                              const isActiveLec = activeLecture?.id === lec.id;
                              return (
                                <div key={lec.id}
                                  className="flex items-center gap-8"
                                  style={{
                                    padding: '6px 8px',
                                    border: '1px solid var(--rule-soft)',
                                    cursor: 'pointer',
                                    background: isActiveLec ? 'var(--accent-soft)' : 'var(--bg)',
                                    borderColor: isActiveLec ? 'var(--accent)' : 'var(--rule-soft)'
                                  }}
                                  onClick={() => {
                                    if (locked) {
                                      if (confirm(`Upgrade to unlock "${lec.title}"?`)) handleUpgradeFullAccess();
                                      return;
                                    }
                                    setActiveLecture(lec);
                                    if (activeTab !== 'classroom') {
                                      setActiveTab('classroom');
                                    }
                                  }}
                                >
                                  <span className="flabel" style={{ fontSize: '0.55rem' }}>{lIdx + 1}</span>
                                  <h4 style={{ margin: 0, fontSize: '0.75rem', flex: 1 }} className="truncate">
                                    {lec.title}
                                    {locked && <span className="badge" style={{ marginLeft: 6, fontSize: '0.5rem', padding: '0 2px' }}>Locked</span>}
                                  </h4>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="flex gap-8 mt-12">
                          {role === 'teacher' && <button onClick={() => setShowLectureModal(mod.id)} className="btn btn-xs btn-secondary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>+ Add Lecture</button>}
                          {role === 'student' && (
                            <button onClick={() => handleToggleComplete(mod.id)} className="btn btn-xs" style={{ fontSize: '0.65rem', padding: '2px 6px', background: isCompleted ? 'var(--accent-soft)' : 'transparent', borderColor: isCompleted ? 'var(--accent)' : 'var(--ink)' }}>
                              {isCompleted ? 'Checkpoint Reset' : 'Mark Complete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Inline Chat inside Active Classroom tab */}
          {activeTab === 'classroom' && (
            <div className="bento-card bento-card-compact" style={{ flex: 1, minHeight: 350, display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-center mb-8">
                <span className="flabel">Live Class Discussion</span>
                <span className="badge badge-accent">CHAT</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CourseChat courseId={courseId!} currentUser={user} mentorId={role === 'teacher' ? user!.uid : enrollment?.mentorId || ''} role={role as 'student' | 'teacher'} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doubt Solver */}
      {role === 'student' && <DoubtSolver courseId={courseId!} courseTitle={course.title} />}

      {/* ── Modals ── */}
      {(showModuleModal || showLectureModal || showResourceModal) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-bg)' }} onClick={() => { setShowModuleModal(false); setShowLectureModal(null); setShowResourceModal(false); }} />
          <div className="bento-card" style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
            <div className="flex" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>{showModuleModal ? 'New Milestone' : showLectureModal ? 'New Session' : 'New Asset'}</h3>
                <span className="flabel">Curriculum Deployment</span>
              </div>
              <button className="btn" style={{ padding: '6px 10px', lineHeight: 1 }} onClick={() => { setShowModuleModal(false); setShowLectureModal(null); setShowResourceModal(false); }}>×</button>
            </div>

            {showModuleModal && (
              <form onSubmit={handleCreateModule}>
                <div className="form-group"><label className="form-label">Module Title</label><input className="input" required placeholder="E.g. Foundational Theory" value={mTitle} onChange={e => setMTitle(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Mission Description</label><textarea className="input" required placeholder="What's the core objective?" value={mDesc} onChange={e => setMDesc(e.target.value)} style={{ minHeight: 80 }} /></div>
                <div className="form-group">
                  <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                    <span>{mThumbFile ? mThumbFile.name : 'Upload Thumbnail'}</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && setMThumbFile(e.target.files[0])} />
                  </label>
                </div>
                <button type="submit" className="btn btn-primary btn-full">DEPLOY MODULE</button>
              </form>
            )}

            {showLectureModal && (
              <form onSubmit={handleAddLecture}>
                <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
                  <input className="input" required placeholder="Session Title" value={lTitle} onChange={e => setLTitle(e.target.value)} />
                  <input className="input" placeholder="Live Meeting Link (Optional)" type="url" value={lMeet} onChange={e => setLMeet(e.target.value)} />
                  <input className="input" placeholder="Recording Link (Optional)" type="url" value={lRec} onChange={e => setLRec(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>SYNC SESSION</button>
              </form>
            )}

            {showResourceModal && (
              <form onSubmit={handleCreateResource}>
                <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
                  <input className="input" required placeholder="Asset Title" value={rTitle} onChange={e => setRTitle(e.target.value)} />
                  <input className="input" required placeholder="Direct URL (Drive/Dropbox)" type="url" value={rUrl} onChange={e => setRUrl(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>UPLOAD ASSET</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseClassroom;
