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
import { getLastReadTimestamps, markCourseRead, computeUnreadCount } from '../lib/chatNotifications';
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
 // Active Expand States
 const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Live Classes
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

 const fetchLiveClasses = async (courseIdStr: string) => {
 setLoadingLiveClasses(true);
 try {
 const { data, error } = await db.from('scheduled_classes').select('*').eq('course_id', courseIdStr).order('scheduled_at', { ascending: false });
 if (!error) setLiveClasses(data || []);
 } catch (e) {
 console.error("Failed to load live classes", e);
 } finally {
 setLoadingLiveClasses(false);
 }
 };

 // Teacher Modals
 const [showModuleModal, setShowModuleModal] = useState(false);
 const [showLectureModal, setShowLectureModal] = useState<string | null>(null);
 const [showResourceModal, setShowResourceModal] = useState(false);
 
 // Forms
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
 } catch (e) {
 console.error("Failed to load classroom items", e);
 }
 };

 useEffect(() => {
 const init = async (currentUser: User | null) => {
 if (!courseId) return;
 if (!currentUser) {
 navigate('/login');
 return;
 }
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

  const eQ = query(collection(db, 'enrollments'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
  const eSnap = await getDocs(eQ);
  
  if (eSnap.empty) {
  navigate(`/courses/${courseId}`);
  return;
  }

  const allDocs = eSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment));
  const studentEnrs = allDocs.filter(d => d.role === 'student' && d.studentStatus === 'active');
  const teacherEnr = allDocs.find(d => d.role === 'teacher');

  let primaryEnr: CourseEnrollment;
  if (teacherEnr) {
  primaryEnr = teacherEnr;
  setAllEnrollments([teacherEnr]);
  } else if (studentEnrs.length > 0) {
  primaryEnr = studentEnrs[0];
  setAllEnrollments(studentEnrs);
  } else {
  navigate(`/courses/${courseId}`);
  return;
  }
  setEnrollment(primaryEnr);

  // Fetch enrolled student count
  try {
    const { count } = await db.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId).eq('role', 'student');
    setEnrolledCount(count || 0);
  } catch (_) {}

  if (primaryEnr.role === 'teacher') {
  const tQ = query(collection(db, 'teacher_applications'), where('userId', '==', currentUser.uid), where('status', '==', 'approved'));
  const tSnap = await getDocs(tQ);
  const isApprovedForCourse = tSnap.docs.some(d => (d.data().qualification || '') === courseId);
  if (!isApprovedForCourse) {
  navigate(`/courses/${courseId}`);
  return;
  }
  setRole('teacher');
  } else {
  if (primaryEnr.studentStatus !== 'active') {
  navigate(`/courses/${courseId}`);
  return;
  }
  setRole('student');
  }

 await fetchClassroomData(courseId);

 } catch (err) {
 console.error("Access error", err);
 } finally {
 setLoading(false);
 }
 };

 const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
 setUser(currentUser);
 init(currentUser);
 });

   const safetyTimer = setTimeout(() => setLoading(false), 8000);
   return () => { unsubscribe(); clearTimeout(safetyTimer); };
   }, [courseId, navigate]);

   // Poll unread message count for this course
   useEffect(() => {
   if (!user || !courseId) return;
   if (activeTab === 'chat') { setChatUnreadCount(0); return; }
   const checkUnread = async () => {
   const timestamps = getLastReadTimestamps(user.uid);
   const lastRead = timestamps[courseId];
   try {
   const { count } = await db.from('course_chat_messages').select('id', { count: 'exact', head: true }).eq('course_id', courseId).gt('created_at', lastRead || '1970-01-01');
   setChatUnreadCount(count || 0);
   } catch (_) {}
   };
   checkUnread();
   const interval = setInterval(checkUnread, 10000);
   return () => clearInterval(interval);
   }, [user, courseId, activeTab]);

  const loadRazorpayScript = () => {
  return new Promise((resolve) => {
   const script = document.createElement("script");
   script.src = "https://checkout.razorpay.com/v1/checkout.js";
   script.onload = () => resolve(true);
   script.onerror = () => resolve(false);
   document.body.appendChild(script);
  });
 };

 const handleUpgradeFullAccess = async () => {
  if (!user || !course) return;
  setUpgradeLoading(true);
  try {
   const amountInPaise = (course.price || 0) * 100;
   const resOrder = await fetch('/api/createOrder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountInPaise })
   });
   
   if (!resOrder.ok) {
    if (resOrder.status === 404) {
     throw new Error("Payment API not found. If running locally, please use 'npx vercel dev' instead of 'npm run dev'.");
    }
    const errorData = await resOrder.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${resOrder.status})`);
   }

   const orderData = await resOrder.json();
   const scriptLoaded = await loadRazorpayScript();
   if (!scriptLoaded) {
    alert("Payment gateway failed to load. Please check your internet connection.");
    setUpgradeLoading(false);
    return;
   }

   const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T4jaXd9nkSffIH",
    amount: amountInPaise,
    currency: "INR",
    name: "Edu Alt Tech",
    description: `Upgrade subscription for ${course.title}`,
    image: "/edulogo.png",
    order_id: orderData.id,
    handler: async function (response: any) {
     try {
      const resVerify = await fetch('/api/verifyPayment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
       })
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
 };

  const handleTabClick = (tabName: 'roadmap' | 'chat' | 'path' | 'live') => {
  setActiveTab(tabName);
  if (tabName === 'chat' && user) {
  markCourseRead(user.uid, courseId!);
  setChatUnreadCount(0);
  }
  };

 const toggleModule = (id: string) => {
 setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
 };

 const handleCreateModule = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || role !== 'teacher' || !courseId) return;
 try {
 let finalThumbUrl = mThumb;
 if (mThumbFile) {
 const fileRef = ref(storage, `module_thumbnails/${Date.now()}_${mThumbFile.name}`);
 const snap = await uploadBytes(fileRef, mThumbFile);
 finalThumbUrl = await getDownloadURL(snap.ref);
 }

 await addDoc(collection(db, 'course_modules'), {
 courseId,
 teacherId: user.uid,
 title: mTitle,
 description: mDesc,
 order: modules.length + 1,
 lectures: [],
 thumbnailUrl: finalThumbUrl || '',
 createdAt: serverTimestamp()
 });
 setShowModuleModal(false);
 setMTitle(''); setMDesc(''); setMThumb(''); setMThumbFile(null);
 fetchClassroomData(courseId);
 toast.success("Module deployed to roadmap");
 } catch (err) { toast.error("Deployment failed"); }
 };

 const handleAddLecture = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || role !== 'teacher' || !courseId || !showLectureModal) return;
 try {
 const moduleRef = doc(db, 'course_modules', showLectureModal);
 const newLecture: ModuleLecture = {
 id: Date.now().toString(),
 title: lTitle,
 meetingLink: lMeet,
 recordedLink: lRec,
 createdAt: new Date().toISOString()
 };
 
 const mod = modules.find(m => m.id === showLectureModal);
 const currentLectures = mod?.lectures || [];

 await updateDoc(moduleRef, {
 lectures: [...currentLectures, newLecture]
 });

 setShowLectureModal(null);
 setLTitle(''); setLMeet(''); setLRec('');
 fetchClassroomData(courseId);
 toast.success("Lecture synced to module");
 } catch (err) { toast.error("Sync failed"); }
 };

 const handleCreateResource = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || role !== 'teacher' || !courseId) return;
 try {
 await addDoc(collection(db, 'resources'), {
 courseId,
 title: rTitle,
 url: rUrl,
 createdAt: serverTimestamp()
 });
 setShowResourceModal(false);
 setRTitle(''); setRUrl('');
 fetchClassroomData(courseId);
 toast.success("Resource uploaded");
 } catch (err) { toast.error("Upload failed"); }
 };

 const handleToggleComplete = async (moduleId: string) => {
 if (!enrollment || role !== 'student') return;
 try {
 const isCompleted = enrollment.completedModules?.includes(moduleId);
 const enrRef = doc(db, 'enrollments', enrollment.id);
 
 let newCompleted = enrollment.completedModules || [];
 if (isCompleted) {
 newCompleted = newCompleted.filter(id => id !== moduleId);
 } else {
 newCompleted = [...newCompleted, moduleId];
 }

 await updateDoc(enrRef, {
 completedModules: isCompleted ? arrayRemove(moduleId) : arrayUnion(moduleId)
 });
 
 setEnrollment({ ...enrollment, completedModules: newCompleted });

 if (!isCompleted && user) {
 await recordModuleComplete(user.uid, courseId!);
 const metrics = await getOrCreateMetrics(user.uid, courseId!, modules.length);
 await adaptDifficulty(user.uid, courseId!, { ...metrics, completedModules: newCompleted.length });
 }

 toast.success(isCompleted ? "Checkpoint reset" : "Module mastered! Progress updated.");
 } catch(err) {
 toast.error("Status update failed");
 }
 };

 if (loading) return (
 <div className="min-h-screen bg-slate-50 [#020617] flex flex-col items-center justify-center gap-4">
 <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ willChange: 'transform' }}>
 <Loader2 className="w-12 h-12 text-purple-500" />
 </motion.div>
 <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Entering Virtual Environment...</p>
 </div>
 );
 
 if (!course) return null;

  const completedCount = enrollment?.completedModules?.length || 0;
  const totalCount = modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const plan = enrollment?.plan || 'full';
  const planLimits: Record<EnrollmentPlan, number> = { trial: 1, first_class: 1, full: Infinity };
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
 <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 [#020617] selection:bg-purple-500/30">
 {/* Background Ambience */}
 <div className="fixed inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[60px] rounded-full" />
 <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[60px] rounded-full" />
 </div>

 <div className="max-w-[1400px] mx-auto relative z-10">

 {/* Navigation & Title */}
 <header className="mb-12">
 <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 :text-white transition-colors text-sm font-bold mb-6 group">
 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
 Back to Command Center
 </Link>
 
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
 <div className="max-w-3xl">
 <div className="flex items-center gap-3 mb-4">
  <span className="px-4 py-1.5 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
  {role === 'teacher' ? 'Instructional Mode' : 'Learning Pathway'}
  </span>
  {role === 'student' && allEnrollments.length > 1 && (
    <select
      value={enrollment?.id || ''}
      onChange={(e) => {
        const sel = allEnrollments.find(en => en.id === e.target.value);
        if (sel) setEnrollment(sel);
      }}
      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/20"
    >
      {allEnrollments.map((en, i) => (
        <option key={en.id} value={en.id}>Mentor {i + 1}</option>
      ))}
    </select>
  )}
  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
  <Clock className="w-3 h-3" /> Updated 2d ago
  </span>
 </div>
 <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6">
 {course.title}
 </h1>
 </div>

 {role === 'teacher' && (
 <div className="flex gap-3">
 <button onClick={()=>setShowResourceModal(true)} className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
 Add Resource
 </button>
 <button onClick={()=>setShowModuleModal(true)} className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-colors shadow-xl shadow-purple-600/20 flex items-center gap-2">
 <Plus className="w-4 h-4" /> New Module
 </button>
 </div>
 )}
 </div>
 </header>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
 {/* Main Content Area */}
 <div className="lg:col-span-8 space-y-12">
 
 {/* Tab Navigation */}
 <div className="flex items-center gap-4 p-2 bg-white rounded-3xl border border-slate-200 w-fit">
 <button 
 onClick={() => handleTabClick('roadmap')}
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'roadmap' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:bg-slate-50 :bg-slate-800'}`}
 >
 <Layout className="w-4 h-4" /> Curriculum Roadmap
 </button>
  <button 
  onClick={() => handleTabClick('chat')}
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50 :bg-slate-800'}`}
  >
  <MessageCircle className="w-4 h-4" /> Intelligence Exchange
  {chatUnreadCount > 0 && activeTab !== 'chat' && (
  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full min-w-[18px] text-center">
  {chatUnreadCount}
  </span>
  )}
  </button>
 {role === 'student' && (
 <button 
 onClick={() => handleTabClick('path')}
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'path' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:bg-slate-50 :bg-slate-800'}`}
 >
 <Target className="w-4 h-4" /> AI Roadmap
 </button>
 )}
 <button 
 onClick={() => handleTabClick('live')}
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'live' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:bg-slate-50 :bg-slate-800'}`}
 >
 <Calendar className="w-4 h-4" /> Live Classes
 </button>
 </div>

 {activeTab === 'roadmap' ? (
 <>
 <div className="flex items-center justify-between">
 <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
 <BookOpen className="w-6 h-6 text-purple-500" />
 Curriculum Roadmap
 </h2>
 </div>

 {modules.length === 0 ? (
 <div className="py-24 text-center bg-white/50 /50 backdrop-blur rounded-[3rem] border-2 border-dashed border-slate-200 ">
 <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
 <p className="text-slate-500 font-bold">Awaiting curriculum deployment...</p>
 </div>
 ) : (
 <div className="relative space-y-12 pb-20">
 {/* Visual Timeline Connector */}
 <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-transparent opacity-20 hidden md:block" />

 {modules.map((mod, idx) => {
 const isCompleted = enrollment?.completedModules?.includes(mod.id);
 const isExpanded = expandedModules.includes(mod.id);
 const isOdd = idx % 2 !== 0;

 return (
 <motion.div 
 key={mod.id}
 initial={{ opacity: 0, x: -20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: idx * 0.1 }}
 className="relative md:pl-20"
 >
 {/* Milestone Marker */}
 <div className={`absolute left-[30px] top-10 w-5 h-5 rounded-full border-4 border-slate-50 [#020617] z-20 transition-all duration-500 hidden md:flex items-center justify-center ${
 isCompleted ? 'bg-emerald-500 scale-125 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-300 '
 }`} />

 <div className={`group bg-white /80 backdrop-blur-xl border-2 rounded-[2.5rem] transition-all duration-500 overflow-hidden ${
 isCompleted ? 'border-emerald-500/20 shadow-emerald-500/5' : 'border-slate-200/50 shadow-xl'
 } ${isExpanded ? 'shadow-2xl border-purple-500/30' : 'hover:-translate-y-1 hover:border-purple-500/30'}`}>
 
 <div className="p-8 md:p-10 cursor-pointer" onClick={() => toggleModule(mod.id)}>
 <div className="flex flex-col md:flex-row gap-8 items-start">
 <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center ${isCompleted ? 'ring-4 ring-emerald-500/20' : ''}`}>
 {mod.thumbnailUrl ? (
 <img src={mod.thumbnailUrl} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
 ) : (
 <span className="text-3xl font-black text-slate-300 ">{idx + 1}</span>
 )}
 </div>

 <div className="flex-1">
 <div className="flex justify-between items-start mb-4">
 <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-purple-500 transition-colors">
 {mod.title}
 </h3>
 {isCompleted && (
 <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
 <Award className="w-3 h-3" /> Mastered
 </span>
 )}
 </div>
 <p className="text-slate-600 font-medium leading-relaxed mb-6 line-clamp-2">
 {mod.description}
 </p>
 <div className="flex items-center gap-4">
 <div className="flex -space-x-2">
 {[1,2,3].map(i => (
 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 " />
 ))}
 </div>
 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
 {mod.lectures?.length || 0} Sessions • Interactive
 </span>
 </div>
 </div>
 
 <div className={`mt-4 md:mt-0 p-3 rounded-2xl bg-slate-50 /50 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
 <ChevronRight className="w-6 h-6 text-slate-400" />
 </div>
 </div>
 </div>

 <AnimatePresence mode="wait">
  {isExpanded && (
  <motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="overflow-hidden will-change-transform"
  >
 <div className="px-8 pb-10 md:px-10 space-y-6">
 <div className="pt-8 border-t border-slate-100 ">
 {(!mod.lectures || mod.lectures.length === 0) ? (
 <p className="text-sm text-slate-400 italic font-medium">No sessions scheduled for this module yet.</p>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {mod.lectures.map((lec, lIdx) => {
    const isLocked = idx >= maxModuleIndex;
   return (
    <div 
     key={lec.id}
     onClick={() => {
      if (isLocked) {
       if (confirm(`Upgrade to unlock "${lec.title}" and all remaining classes in this course?`)) {
        handleUpgradeFullAccess();
       }
      }
     }}
     className={`p-5 rounded-3xl border border-transparent transition-colors group/lec relative ${
      isLocked 
       ? 'opacity-65 cursor-pointer bg-slate-50/50 hover:border-amber-500/30 hover:bg-amber-500/5' 
       : 'bg-slate-50/50 hover:border-purple-500/20 hover:bg-white :bg-slate-800 transition-colors'
     }`}
    >
     <div className="flex justify-between items-start mb-4">
      <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-black">
       {lIdx + 1}
      </span>
      <div className="flex gap-2">
       {isLocked ? (
        <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
         </svg>
        </span>
       ) : (
        <>
         {lec.meetingLink && (
          <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
           <Video className="w-4 h-4" />
          </a>
         )}
         {lec.recordedLink && (
          <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors">
           <PlayCircle className="w-4 h-4" />
          </a>
         )}
        </>
       )}
      </div>
     </div>
     <h4 className="font-bold text-slate-900 mb-1 group-hover/lec:text-purple-500 transition-colors flex items-center gap-2">
      {lec.title}
      {isLocked && <span className="text-[9px] px-2 py-0.5 bg-amber-500/15 text-amber-600 rounded-full font-black uppercase tracking-wider">Locked</span>}
     </h4>
     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
      {isLocked ? 'Upgrade to Unlock' : (lec.meetingLink ? 'Live Interactive' : 'Recorded Session')}
     </p>
    </div>
   );
  })}
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-8 border-t border-slate-100 ">
 {role === 'teacher' && (
 <button onClick={() => setShowLectureModal(mod.id)} className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-colors">
 <Plus className="w-4 h-4" /> Add Lecture
 </button>
 )}
 {role === 'student' && (
 <button 
 onClick={() => handleToggleComplete(mod.id)}
 className={`ml-auto flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-transform ${
 isCompleted 
 ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
 : 'bg-slate-900 text-white hover:scale-105 active:scale-95'
 }`}
 >
 {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
 {isCompleted ? 'Mastered' : 'Mark as Complete'}
 </button>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </>
 ) : activeTab === 'live' ? (
 <div>
 <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 mb-8">
 <Calendar className="w-6 h-6 text-rose-500" />
 Upcoming Live Classes
 </h2>
 {loadingLiveClasses ? (
 <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
 ) : liveClasses.length === 0 ? (
 <div className="py-24 text-center bg-white/50 /50 backdrop-blur rounded-[3rem] border-2 border-dashed border-slate-200 ">
 <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
 <p className="text-slate-500 font-bold">No live classes scheduled yet</p>
 <p className="text-sm text-slate-400 mt-1">Your teacher will schedule live classes here.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {liveClasses.map((lc) => (
 <div key={lc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center font-black text-white shrink-0">
 <Calendar className="w-6 h-6" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-black text-lg text-slate-900 ">{lc.title}</h3>
 {lc.description && <p className="text-sm text-slate-500 mt-1">{lc.description}</p>}
 <div className="flex items-center gap-4 mt-3">
 <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
 <Clock className="w-3.5 h-3.5" />
 {lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date set'}
 </span>
 </div>
 </div>
 <a href={lc.meeting_link} target="_blank" rel="noreferrer" className="px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-colors text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-rose-500/20">
 <Video className="w-4 h-4" /> Join Now
 </a>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : activeTab === 'path' ? (
 <LearningPathView courseId={courseId!} courseTitle={course.title} courseDescription={course.description} />
 ) : (
 <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
  <CourseChat 
  courseId={courseId!} 
  currentUser={user} 
  mentorId={role === 'teacher' ? user!.uid : enrollment?.mentorId || ''} 
  role={role as 'student' | 'teacher'} 
  />
 </div>
 )}
 </div>

 {/* Sidebar: Bento Glassmorphism */}
 <aside className="lg:col-span-4 space-y-8 order-first lg:order-last">
 {/* Progress Card */}
 <div className="lg:sticky lg:top-32 space-y-8">
 <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-purple-600/20 overflow-hidden relative">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <Award className="w-32 h-32 rotate-12" />
 </div>
 <div className="relative z-10">
 <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Your Progress</h3>
 <div className="flex items-end gap-2 mb-6">
 <span className="text-6xl font-black leading-none">{progressPercent}%</span>
 <span className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">Complete</span>
 </div>
 <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-4 backdrop-blur-md">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${progressPercent}%` }}
 transition={{ duration: 1, ease: "circOut" }}
 className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
 />
 </div>
 <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
 {completedCount} of {totalCount} milestones mastered
 </p>
   </div>
   </div>

   {/* Upgrade Banner (student only) */}
   {role === 'student' && isRestricted && (
     <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-amber-600/20 overflow-hidden relative">
       <div className="relative z-10">
         <h3 className="text-xl font-black mb-2 uppercase tracking-tight">First Class</h3>
         <p className="text-sm font-medium text-white/80 mb-6">
           You have access to module 1. Upgrade to full access and unlock the complete course.
         </p>
         <button
           onClick={handleUpgradeFullAccess}
           disabled={upgradeLoading}
           className="w-full py-4 bg-white text-amber-700 font-black rounded-2xl hover:bg-amber-50 transition-colors shadow-lg flex items-center justify-center gap-2"
         >
           {upgradeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
           {upgradeLoading ? 'Processing...' : `Upgrade to Full — ₹${course?.price || 0}/mo`}
         </button>
       </div>
     </div>
   )}

   {/* Enrolled Students Card (teacher only) */}
  {role === 'teacher' && (
    <div className="bg-white /80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-500" />
          Students
        </h3>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest">
          {enrolledCount} enrolled
        </span>
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
