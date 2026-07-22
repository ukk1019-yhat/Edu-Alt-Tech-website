import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, storage, doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, ref, uploadBytes, getDownloadURL, onAuthStateChanged } from '../lib/firebase';
import { Course, CourseEnrollment, CourseModule, ModuleLecture, CourseResource } from '../types';
import { ArrowLeft, BookOpen, Video, FileText, Plus, Link as LinkIcon, Loader2, PlayCircle, CheckCircle2, Circle, ChevronRight, Clock, Award, Layout, Zap, X, Upload, ExternalLink, MessageCircle, Target, Calendar, Sparkles, Users } from 'lucide-react';
import type { User } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CourseChat from '../components/CourseChat';
import { recordModuleComplete, getOrCreateMetrics } from '../lib/userProgress';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { adaptDifficulty } from '../lib/learningPath';
import type { EnrollmentPlan } from '../types';
import { getLastReadTimestamps, markCourseRead } from '../lib/chatNotifications';
import DoubtSolver from '../components/DoubtSolver';
import LearningPathView from '../components/LearningPathView';
import HamsterLoader from '../components/HamsterLoader';

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

 // Classroom Data
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'chat' | 'path' | 'live'>('roadmap');
  const [enrolledCount, setEnrolledCount] = useState(0);

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
  primaryEnr = studentEnrs[0]!;
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
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: "INR",
    name: "Edu Alt Tech",
    description: `Upgrade subscription for ${course.title}`,
    image: "/logo.png",
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
      
      if (!resVerify.ok) {
       const verifyErrorData = await resVerify.json().catch(() => ({}));
       throw new Error(verifyErrorData.error || "Payment verification failed on server");
      }

      const verifyData = await resVerify.json();

       if (verifyData.success) {
        if (enrollment) {
         const enrRef = doc(db, 'enrollments', enrollment.id);
          await updateDoc(enrRef, {
           paymentStatus: 'paid',
           plan: 'full',
           amount: course.price || 0
          });
          setEnrollment({
           ...enrollment,
           paymentStatus: 'paid',
           plan: 'full',
           amount: course.price || 0
         });
        toast.success("Successfully upgraded to full access!");
        try {
         await addDoc(collection(db, 'mail'), {
          to: user.email,
          message: {
           subject: `Subscription Upgraded: ${course.title}`,
           text: `Hi ${user.displayName || 'Student'},\n\nThank you for upgrading! Your subscription to ${course.title} is now fully active. You have full access to all classes, community forums, and assets.\n\nHappy Learning,\nEdu-Alt-Tech`
          }
         });
        } catch (e) {
         console.error("Email notification failed", e);
        }
       }
      } else {
       throw new Error(verifyData.error || "Invalid Security Signature");
      }
     } catch (e: any) {
      console.error("Verification error:", e);
      alert(`Payment processed, but upgrade failed: ${e.message}`);
     }
    },
    prefill: {
     name: user.displayName || "",
     email: user.email || "",
    },
    theme: { color: "#10b981" }
   };

   const rzp = new (window as any).Razorpay(options);
   rzp.on('payment.failed', (resp: any) => alert(`Payment Failed: ${resp.error.description}`));
   rzp.open();

  } catch (err: any) {
   console.error("Payment flow error:", err);
   alert(err.message || "An unexpected error occurred during payment.");
  } finally {
   setUpgradeLoading(false);
  }
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

 if (loading) return <HamsterLoader />;
 
 if (!course) return null;

  const completedCount = enrollment?.completedModules?.length || 0;
  const totalCount = modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const plan = enrollment?.plan || 'full';
  const planLimits: Record<EnrollmentPlan, number> = { first_class: 1, full: Infinity };
  const maxModuleIndex = planLimits[plan] ?? Infinity;
  const isRestricted = plan !== 'full';

  return (
 <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 selection:bg-purple-500/30">
 {/* Background Ambience */}
 <div className="fixed inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[60px] rounded-full" />
 <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[60px] rounded-full" />
 </div>

 <div className="max-w-[1400px] mx-auto relative z-10">

 {/* Navigation & Title */}
 <header className="mb-12">
 <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold mb-6 group">
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
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'roadmap' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
 >
 <Layout className="w-4 h-4" /> Curriculum Roadmap
 </button>
  <button 
  onClick={() => handleTabClick('chat')}
  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
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
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'path' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
 >
 <Target className="w-4 h-4" /> AI Roadmap
 </button>
 )}
 <button 
 onClick={() => handleTabClick('live')}
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${activeTab === 'live' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
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
 <div className={`absolute left-[30px] top-10 w-5 h-5 rounded-full border-4 border-slate-50 z-20 transition-all duration-500 hidden md:flex items-center justify-center ${
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
       : 'bg-slate-50/50 hover:border-purple-500/20 hover:bg-white transition-colors'
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
      <p className="text-xs text-slate-400 font-medium">
        Monitor student progress and engagement from the Teacher Panel.
      </p>
    </div>
  )}

  {/* Resources Card */}
 <div className="bg-white /80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
 <FileText className="w-5 h-5 text-purple-500" />
 Vault
 </h3>
 <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
 {resources.length} ITEMS
 </span>
 </div>

 {resources.length === 0 ? (
 <p className="text-sm text-slate-400 font-medium italic">Vault is currently empty.</p>
 ) : (
 <div className="space-y-3">
  {resources.map((res, i) => {
     const isResourceLocked = isRestricted;
   return (
    <motion.a 
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay: i * 0.1 }}
     key={res.id} 
     href={isResourceLocked ? undefined : res.url} 
     target={isResourceLocked ? undefined : "_blank"} 
     rel="noreferrer"
     onClick={(e) => {
      if (isResourceLocked) {
       e.preventDefault();
       if (confirm("Vault resources require full course access. Upgrade now to unlock?")) {
        handleUpgradeFullAccess();
       }
       return;
      }
      if (user) {
       (async () => { try { await db.from('user_downloads').insert({ user_id: user.uid, resource_title: res.title, resource_url: res.url, resource_type: 'link', course_id: courseId, downloaded_at: new Date().toISOString() }); } catch (e) { console.error('CourseClassroom: Failed to log resource download', e); } })();
      }
     }}
     className={`flex items-center gap-4 p-4 rounded-2xl border border-transparent transition-colors group ${
      isResourceLocked 
       ? 'opacity-65 cursor-pointer bg-slate-50/50 hover:border-amber-500/30 hover:bg-amber-500/5' 
       : 'bg-slate-50/50 hover:border-purple-500/30 hover:bg-white'
     }`}
    >
     <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
      {isResourceLocked ? (
       <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
       </svg>
      ) : (
       <LinkIcon className="w-4 h-4" />
      )}
     </div>
     <div className="flex-1 min-w-0">
      <p className="font-bold text-sm text-slate-800 truncate group-hover:text-purple-500 transition-colors">{res.title}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isResourceLocked ? 'Locked (Trial)' : 'External Asset'}</p>
     </div>
     {!isResourceLocked && <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </motion.a>
   );
  })}
 </div>
 )}
 </div>
 </div>
 </aside>
 </div>
 </div>

 {/* Doubt Solver */}
 {role === 'student' && (
 <DoubtSolver courseId={courseId!} courseTitle={course.title} />
 )}

 {/* Premium Modals */}
 <AnimatePresence>
 {(showModuleModal || showLectureModal || showResourceModal) && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => {
 setShowModuleModal(false);
 setShowLectureModal(null);
 setShowResourceModal(false);
 }}
 className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
 />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-lg bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden"
 >
 <div className="p-10">
 <div className="flex justify-between items-start mb-8">
 <div>
 <h2 className="text-3xl font-black tracking-tight mb-2">
 {showModuleModal ? 'New Milestone' : showLectureModal ? 'New Session' : 'New Asset'}
 </h2>
 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Curriculum Deployment</p>
 </div>
 <button 
 onClick={() => {
 setShowModuleModal(false);
 setShowLectureModal(null);
 setShowResourceModal(false);
 }} 
 className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 {showModuleModal && (
 <form onSubmit={handleCreateModule} className="space-y-6">
 <div className="space-y-4">
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Module Title</label>
 <input required placeholder="E.g. Foundational Theory" value={mTitle} onChange={e=>setMTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors" />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mission Description</label>
 <textarea required placeholder="What's the core objective?" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium border border-transparent focus:border-purple-500 transition-colors resize-none" rows={3} />
 </div>
 <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 ">
 <label className="flex flex-col items-center gap-2 cursor-pointer">
 <Upload className="w-6 h-6 text-slate-400" />
 <span className="text-xs font-bold text-slate-500">{mThumbFile ? mThumbFile.name : 'Upload Thumbnail'}</span>
  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setMThumbFile(e.target.files[0] ?? null)} />
 </label>
 </div>
 </div>
 <button type="submit" className="w-full py-5 bg-purple-600 text-white font-black rounded-[2rem] shadow-xl shadow-purple-600/20 hover:scale-[1.02] transition-transform">
 DEPLOY MODULE
 </button>
 </form>
 )}

 {showLectureModal && (
 <form onSubmit={handleAddLecture} className="space-y-6">
 <div className="space-y-4">
 <input required placeholder="Session Title" value={lTitle} onChange={e=>setLTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-colors" />
 <input placeholder="Live Meeting Link (Optional)" type="url" value={lMeet} onChange={e=>setLMeet(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-blue-500 transition-colors" />
 <input placeholder="Recording Link (Optional)" type="url" value={lRec} onChange={e=>setLRec(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-rose-500 transition-colors" />
 </div>
 <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-transform">
 SYNC SESSION
 </button>
 </form>
 )}

 {showResourceModal && (
 <form onSubmit={handleCreateResource} className="space-y-6">
 <div className="space-y-4">
 <input required placeholder="Asset Title" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 <input required placeholder="Direct URL (Drive/Dropbox)" type="url" value={rUrl} onChange={e=>setRUrl(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-colors" />
 </div>
 <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-transform">
 UPLOAD ASSET
 </button>
 </form>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
};

export default CourseClassroom;
