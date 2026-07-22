import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, onAuthStateChanged } from '../lib/firebase';
import { Course, CourseEnrollment } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';
import { ArrowLeft, CheckCircle2, Users, BookOpen, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import type { User } from '../lib/firebase';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import HamsterLoader from '../components/HamsterLoader';

const CourseDetails: React.FC = () => {
 const { courseId } = useParams<{ courseId: string }>();
 const navigate = useNavigate();
 const [course, setCourse] = useState<Course | null>(null);
 const [loading, setLoading] = useState(true);
 const [user, setUser] = useState<User | null>(null);
 const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
 const [enrollLoading, setEnrollLoading] = useState(false);
 const [mentors, setMentors] = useState<any[]>([]);
 const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
 const [myAppStatus, setMyAppStatus] = useState<string | null>(null);
 
 const contentRef = React.useRef<HTMLDivElement>(null);

 useEffect(() => {
 const fetchCourseAndEnrollment = async (currentUser: User | null) => {
 if (!courseId) return;
  try {
  let found = false;
  const courseDoc = await getDoc(doc(db, 'courses', courseId));
  if (courseDoc.exists()) {
  setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
  found = true;
  }
   if (!found) {
   const idx = PLATFORM_COURSES.findIndex((_, i) => `pc-${i}` === courseId);
   if (idx !== -1) {
   let base = { id: `pc-${idx}`, ...PLATFORM_COURSES[idx] } as Course;
   try {
   const { data: rows } = await db.from('platform_overrides').select('*').eq('id', courseId).maybeSingle();
    if (rows?.data && !rows.data.__deleted) base = { ...base, ...rows.data };
    } catch (e) { console.error('CourseDetails: Failed to fetch platform overrides from Supabase', e); }
    try {
    const localOverrides = JSON.parse(localStorage.getItem('platformCourseOverrides') || '{}');
    if (localOverrides[courseId]) base = { ...base, ...localOverrides[courseId] };
    } catch (e) { console.error('CourseDetails: Failed to parse local platform overrides', e); }
   setCourse(base);
   found = true;
   }
   }

 if (currentUser) {
 // Check if already enrolled or applied
 const enrollmentsRef = collection(db, 'enrollments');
 const q = query(enrollmentsRef, where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
 const querySnapshot = await getDocs(q);
 
  let enrData: CourseEnrollment | null = null;
  if (!querySnapshot.empty) {
  const sorted = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  enrData = sorted[0] ?? null;
  setEnrollment(enrData);
  }

 // Fetch Approved Mentors for this course
 const appsQ = query(collection(db, 'teacher_applications'), where('status', '==', 'approved'));
 const appsSnap = await getDocs(appsQ);
 const approvedForCourse = appsSnap.docs.filter(d => d.data().qualification === courseId);

 // Fetch current user's application status
 const myAppQ = query(collection(db, 'teacher_applications'), where('user_id', '==', currentUser.uid));
 const myAppSnap = await getDocs(myAppQ);
 const courseApps = myAppSnap.docs
 .map(d => ({ id: d.id, ...d.data() }))
 .filter((app: any) => app.qualification === courseId);
 
 if (courseApps.length > 0) {
 courseApps.sort((a: any, b: any) => {
 const dateA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
 const dateB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
 return dateB - dateA;
 });
 setMyAppStatus(courseApps[0].status);
 }

 const loadedMentors = approvedForCourse.map(doc => {
 const data = doc.data();
 return {
 appId: doc.id,
 userId: data.userId || data.user_id,
 highestQualification: data.highestQualification || data.highest_qualification || '',
 name: data.name || 'Mentor',
 email: data.email || '',
 experience: data.experience || 'Experienced Professional',
 skills: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n')[0].replace('Skills: ', '') : 'Course Expert',
 message: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n').slice(1).join('\n').trim() : (data.message || ''),
 proposedPath: []
 };
 });
 setMentors(loadedMentors);

 if (loadedMentors.length === 1) {
  setSelectedMentor(loadedMentors[0]?.userId);
 }

  // --- AUTO REDIRECT TO CLASSROOM (mentors only) ---
  const isApprovedMentor = loadedMentors.some(m => m.userId === currentUser.uid);
  if (isApprovedMentor && enrData) {
  navigate(`/classroom/${courseId}`);
  return;
  }
 } else {
 // For guests, just fetch mentors to show who is teaching
 const appsQ = query(collection(db, 'teacher_applications'), where('status', '==', 'approved'));
 const appsSnap = await getDocs(appsQ);
 const approvedForCourse = appsSnap.docs.filter(d => d.data().qualification === courseId);
 const loadedMentors = approvedForCourse.map(doc => {
 const data = doc.data();
 return {
 appId: doc.id,
 userId: data.userId || data.user_id,
 highestQualification: data.highestQualification || data.highest_qualification || '',
 name: data.name || 'Mentor',
 email: data.email || '',
 experience: data.experience || 'Experienced Professional',
 skills: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n')[0].replace('Skills: ', '') : 'Course Expert',
 message: (data.message || '').startsWith('Skills:') ? (data.message || '').split('\n').slice(1).join('\n').trim() : (data.message || ''),
 proposedPath: []
 };
 });
 setMentors(loadedMentors);
 }

 } catch (err) {
 console.error("Failed to load details", err);
 } finally {
 setLoading(false);
 }
 };

 const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
 if (!currentUser) {
 navigate('/login');
 return;
 }
 setUser(currentUser);
 fetchCourseAndEnrollment(currentUser);
 });

 return () => unsubscribe();
 }, [courseId, navigate]);

  const loadRazorpayScript = () => {
 return new Promise((resolve) => {
 const script = document.createElement("script");
 script.src = "https://checkout.razorpay.com/v1/checkout.js";
 script.onload = () => resolve(true);
 script.onerror = () => resolve(false);
 document.body.appendChild(script);
 });
 };

  const finalizeEnrollment = async (plan: 'first_class' | 'full' = 'full') => {
   setEnrollLoading(true);
   try {
     const enrollmentRef = doc(collection(db, 'enrollments'));
      const newEnrollment: CourseEnrollment = {
        id: enrollmentRef.id,
        userId: user!.uid,
        courseId: courseId!,
        role: 'student',
        studentStatus: 'active',
        paymentStatus: 'paid',
        plan,
        amount: course?.price || 0,
        mentorId: selectedMentor || undefined,
        createdAt: serverTimestamp()
      };
  await setDoc(enrollmentRef, newEnrollment as any);
  setEnrollment(newEnrollment);

  // In-app notification for student
  try {
    await db.from('notifications').insert({
      user_id: user!.uid,
      title: 'Course Enrolled',
      message: `You have successfully enrolled in "${course?.title || 'Unknown Course'}". Start learning now!`,
      type: 'enrollment',
      is_read: false,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Notification insert failed", e);
  }

  // Trigger Emails
 try {
 // 1. Notify Student
 await setDoc(doc(collection(db, 'mail')), {
 to: user!.email,
 message: {
 subject: `Successfully Enrolled: ${course?.title || 'Unknown Course'}`,
 text: `Hi ${user!.displayName || 'Student'},\n\nGreat news! You are now enrolled in ${course?.title || 'Unknown Course'}. You can access your course materials from your dashboard.\n\nHappy Learning,\nEdu-Alt-Tech`
 }
 });

 // 2. Notify Mentor
 if (selectedMentor) {
 const mentorInfo = mentors.find(m => m.userId === selectedMentor);
 if (mentorInfo?.email) {
 await setDoc(doc(collection(db, 'mail')), {
 to: mentorInfo.email,
 message: {
 subject: `New Student Joined: ${course?.title || 'Course'}`,
 text: `Hi ${mentorInfo.name},\n\nA new student has joined your course "${course?.title}"!\n\nStudent Info:\n- Name: ${user!.displayName || 'N/A'}\n- Email: ${user!.email || 'N/A'}\n\nYou can now see them in your classroom community.\n\nBest,\nThe Edu-Alt-Tech Team`
 }
 });
 }
 }
 } catch (e) {
 console.error("Email notification failed", e);
 }

 toast.success("You have successfully enrolled in the course!");
 } catch (err) {
 console.error(err);
 alert("Failed to finalize enrollment. Please contact support.");
 } finally {
 setEnrollLoading(false);
 }
 };

 const handleJoinAsStudent = async () => {
 if (!user) {
 navigate('/login');
 return;
 }
 
 if (!selectedMentor) {
 alert("Please select a mentor first.");
 return;
 }

 // Free Course
  // Free Course → full plan
  if (!course?.price || course.price === 0) {
  await finalizeEnrollment('full');
  return;
  }

  // Paid Course — Full
  setEnrollLoading(true);
 try {
 // 1. Create Order
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

 // 2. Load Script
 const scriptLoaded = await loadRazorpayScript();
 if (!scriptLoaded) {
 alert("Payment gateway failed to load. Please check your internet connection.");
 setEnrollLoading(false);
 return;
 }

 // 3. Open Checkout
 const options = {
 key: import.meta.env.VITE_RAZORPAY_KEY_ID,
 amount: amountInPaise,
 currency: "INR",
 name: "Edu Alt Tech",
 description: `Enrollment for ${course.title}`,
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
await finalizeEnrollment('full');
  } else {
  throw new Error(verifyData.error || "Invalid Security Signature");
  }
  } catch (e: any) {
  console.error("Verification error:", e);
  alert(`Payment processed, but enrollment failed: ${e.message}`);
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
 setEnrollLoading(false);
 }

 };

  const handleFirstClassPayment = async () => {
   if (!user) {
   navigate('/login');
   return;
   }
   if (!selectedMentor) {
   alert("Please select a mentor first.");
   return;
   }
   // Check first class limit (max 3 across all courses)
   const fcQ = query(collection(db, 'enrollments'), where('userId', '==', user.uid), where('plan', '==', 'first_class'));
   const fcSnap = await getDocs(fcQ);
   if (fcSnap.size >= 3) {
   toast.error("You have used all 3 first class attempts. Please enroll with Full Access.");
   return;
   }
   setEnrollLoading(true);
   try {
   const amountInPaise = 1000; // ₹10
  const resOrder = await fetch('/api/createOrder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: amountInPaise })
  });
  if (!resOrder.ok) {
  if (resOrder.status === 404) { throw new Error("Payment API not found. If running locally, please use 'npx vercel dev' instead of 'npm run dev'."); }
  const errorData = await resOrder.json().catch(() => ({}));
  throw new Error(errorData.error || `Server error (${resOrder.status})`);
  }
  const orderData = await resOrder.json();
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) { alert("Payment gateway failed to load."); return; }
  const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  amount: amountInPaise,
  currency: "INR",
  name: "Edu Alt Tech",
  description: `First Class - ${course?.title || 'Course'}`,
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
  if (!resVerify.ok) { throw new Error("Payment verification failed on server"); }
  const verifyData = await resVerify.json();
  if (verifyData.success) { await finalizeEnrollment('first_class'); }
  else { throw new Error(verifyData.error || "Invalid Security Signature"); }
  } catch (e: any) { console.error("Verification error:", e); alert(`Payment processed, but enrollment failed: ${e.message}`); }
  },
  prefill: { name: user.displayName || "", email: user.email || "" },
  theme: { color: "#10b981" }
  };
  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', (resp: any) => alert(`Payment Failed: ${resp.error.description}`));
  rzp.open();
  } catch (err: any) {
  console.error("First class payment error:", err);
  alert(err.message || "An unexpected error occurred.");
  } finally {
  setEnrollLoading(false);
  }
 };

  const handleApplyToTeach = () => {
 if (!user) {
 navigate('/login');
 return;
 }
 navigate(`/teacher-application?courseId=${courseId}`);
 };

 if (loading) {
 return <HamsterLoader />;
 }

 if (!course) {
 return <div className="min-h-screen pt-32 pb-24 text-center text-slate-500">Course not found.</div>;
 }

 return (
 <div className="min-h-screen pt-24 sm:pt-32 pb-24 sm:pb-32 px-4 sm:px-6 bg-slate-50 [#020617] relative overflow-hidden">
  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 /10 /10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/3 hidden sm:block" />
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="max-w-4xl mx-auto relative z-10"
 ref={contentRef}
 >
  <Link to="/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 :text-white transition-colors mb-6 sm:mb-10 font-medium text-sm sm:text-base">
  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to Courses
  </Link>

 {/* Hero Card */}
  <div className="bg-white/90 /80 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-10 md:p-14 border border-slate-200/50 /50 shadow-2xl mb-6 sm:mb-8">
  <div className="flex flex-col md:flex-row justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
  <div>
  <div className={`mb-3 sm:mb-4 w-fit px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${course.category === 'education' ? 'bg-blue-100 text-blue-700 /30 ' : 'bg-purple-100 text-purple-700 /30 '}`}>
  {course.category}
  </div>
  <h1 className="text-[1.6rem] leading-[1.1] sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-4 tracking-tight">{course.title}</h1>
  <p className="text-sm sm:text-base md:text-xl text-slate-600 font-medium leading-relaxed sm:leading-normal">{course.description}</p>
  </div>
  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0 flex-shrink-0">
  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 md:mb-2">
   {course.price === 0 || !course.price ? 'Free' : `₹${course.price}/month`}
  </span>
  <span className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Open for enrollment</span>
  </div>
  </div>

 <hr className="border-slate-100 my-5 sm:my-8" />

 {/* AI Course Assistant Button */}
 <button
 onClick={() => window.dispatchEvent(new CustomEvent('openaichat', { detail: { mode: 'course' } }))}
 className="w-full mb-6 p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 /5 /5 border border-emerald-200/50 /30 rounded-2xl flex items-center justify-between group hover:from-emerald-500/20 hover:to-teal-500/20 transition-colors"
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
 <Sparkles className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="text-left">
 <span className="block font-bold text-slate-900 text-sm">Ask AI about this course</span>
 <span className="block text-xs text-slate-500 font-medium">Get instant answers, summaries, and learning tips</span>
 </div>
 </div>
 <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
 </button>

  {/* Action Area depending on Enrollment */}
  <div className="bg-slate-50 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 ">
 {enrollment ? (
 <div className="flex flex-col items-center text-center">
  {enrollment.role === 'student' ? (
  enrollment.paymentStatus === 'pending' ? (
  <>
  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mb-3 sm:mb-4" />
  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Mentor Assigned!</h2>
  <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-5 sm:mb-6">
  A mentor is ready to teach you. Please complete the payment to start learning.
  </p>
   <button onClick={handleJoinAsStudent} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg transition-colors w-full sm:w-auto text-sm sm:text-base">
    Pay ₹{course.price || 0}/month
   </button>
  </>
   ) : (
   <>
   <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mb-3 sm:mb-4" />
   <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">You are enrolled!</h2>
   <Link to="/dashboard" className="text-emerald-600 hover:underline mt-2 font-medium flex items-center gap-1 text-sm sm:text-base">
   Go to Dashboard <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
   </Link>
   <p className="text-xs text-slate-400 mt-4">Want to learn from a different mentor? Select one below and enroll again.</p>
  <div className="w-full mt-4 space-y-4">
    {mentors.map(m => (
      <div
      key={m.userId}
      onClick={() => setSelectedMentor(m.userId)}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedMentor === m.userId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
      <div className="flex justify-between items-start mb-2 gap-2">
        <p className="font-bold text-slate-900 text-base sm:text-lg">{m.name}</p>
        {selectedMentor === m.userId && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />}
      </div>
      <p className="text-xs sm:text-sm text-slate-500 mb-1 leading-snug"><strong>Experience:</strong> {m.experience}</p>
      {m.highestQualification && <p className="text-xs sm:text-sm text-slate-500 mb-1 leading-snug"><strong>Qualification:</strong> {m.highestQualification}</p>}
      <p className="text-xs sm:text-sm text-slate-500 leading-snug"><strong>Skills:</strong> {m.skills}</p>
    </div>
    ))}
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <button
      onClick={handleFirstClassPayment}
      disabled={enrollLoading || !selectedMentor}
      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 sm:py-4 px-5 sm:px-8 rounded-xl transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-xs sm:text-sm"
      >
      {enrollLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (selectedMentor ? 'First Class — ₹10' : 'Select Mentor')}
      </button>
      {course?.price && course.price > 0 && (
      <button
      onClick={handleJoinAsStudent}
      disabled={enrollLoading || !selectedMentor}
      className="flex-1 bg-slate-900 text-white font-bold py-3.5 sm:py-4 px-5 sm:px-8 rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-xs sm:text-sm"
      >
      {enrollLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (selectedMentor ? `Pay ₹${course.price}/mo — Full` : 'Select Mentor')}
      </button>
      )}
    </div>
  </div>
  </>
  )
 ) : (
  <>
  <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 mb-3 sm:mb-4" />
  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Teacher Application Submitted</h2>
  <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-5 sm:mb-6">
  You have applied to teach this course. Check your dashboard for appointment updates.
  </p>
  <Link to="/dashboard" className="text-purple-600 hover:underline mt-2 font-medium flex items-center gap-1 text-sm sm:text-base">
  View Schedule <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  </Link>
 </>
 )}
 </div>
 ) : (
 <div className="flex flex-col gap-6">
  <div className="flex-1 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm">
  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500"/> Join as a Student</h3>
 {mentors.length === 0 ? (
 <div className="p-4 bg-slate-50 rounded-xl text-center">
 <p className="text-slate-500 font-medium">No active mentors available right now.</p>
 <p className="text-sm mt-1 text-slate-400">Please wait for a mentor to be approved to teach.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {mentors.map(m => (
 <div 
 key={m.userId}
 onClick={() => setSelectedMentor(m.userId)}
 className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedMentor === m.userId ? 'border-emerald-500 bg-emerald-50 /20' : 'border-slate-200 hover:border-slate-300 :border-slate-700'}`}
 >
      <div className="flex justify-between items-start mb-2 gap-2">
  <p className="font-bold text-slate-900 text-base sm:text-lg">{m.name}</p>
  {selectedMentor === m.userId && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />}
  </div>
  <p className="text-xs sm:text-sm text-slate-500 mb-1 leading-snug"><strong>Experience:</strong> {m.experience}</p>
  {m.highestQualification && <p className="text-xs sm:text-sm text-slate-500 mb-1 leading-snug"><strong>Qualification:</strong> {m.highestQualification}</p>}
  <p className="text-xs sm:text-sm text-slate-500 leading-snug"><strong>Skills:</strong> {m.skills}</p>
 {m.message && <p className="text-xs text-slate-400 mt-2 italic">"{m.message}"</p>}
 
 {m.proposedPath && m.proposedPath.length > 0 && (
 <div className="mt-3 pt-3 border-t border-slate-100 ">
 <p className="text-xs font-bold text-slate-700 mb-1">Proposed Curriculum:</p>
 <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
 {m.proposedPath.map((pathItem: string, idx: number) => (
 <li key={idx} className="truncate">{pathItem}</li>
 ))}
 </ul>
 </div>
 )}
 </div>
 ))}
   <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 w-full">
    <button
    onClick={handleFirstClassPayment}
    disabled={enrollLoading || !selectedMentor}
    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 sm:py-4 px-5 sm:px-8 rounded-xl transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-xs sm:text-sm"
    >
    {enrollLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (selectedMentor ? 'First Class — ₹10' : 'Select Mentor for First Class')}
    </button>
    {course?.price && course.price > 0 && (
    <button
    onClick={handleJoinAsStudent}
    disabled={enrollLoading || !selectedMentor}
    className="flex-1 bg-slate-900 text-white font-bold py-3.5 sm:py-4 px-5 sm:px-8 rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-xs sm:text-sm"
    >
    {enrollLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (selectedMentor ? `Pay ₹${course.price}/mo — Full` : 'Select Mentor')}
    </button>
    )}
  </div>

 </div>
 )}
 </div>

  <div className="flex-1 bg-slate-50/80 /40 backdrop-blur border border-purple-200/50 /30 p-5 sm:p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
  <h3 className="text-base sm:text-lg font-bold mb-2 flex items-center justify-center gap-2"><Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500"/> Teach this Course</h3>
 <p className="text-slate-500 text-sm mb-4 max-w-sm">
 Are you qualified to teach this subject? Apply to become a mentor and start teaching students securely.
 </p>
 {myAppStatus === 'pending' || myAppStatus === 'scheduled' ? (
 <button disabled className="w-full max-w-xs bg-slate-200 text-slate-500 font-bold py-3 px-8 rounded-xl cursor-not-allowed">
 Application Under Review
 </button>
 ) : myAppStatus === 'rejected' ? (
 <button 
 onClick={handleApplyToTeach}
 className="w-full max-w-xs bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-500 :border-purple-500 font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
 >
 Re-apply to Teach
 </button>
 ) : myAppStatus === 'approved' ? (
 <button disabled className="w-full max-w-xs bg-emerald-50 /20 text-emerald-600 font-bold py-3 px-8 rounded-xl cursor-not-allowed border border-emerald-200 ">
 You are a Mentor
 </button>
 ) : (
 <button 
 onClick={handleApplyToTeach}
 className="w-full max-w-xs bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-500 :border-purple-500 font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
 >
 Apply to Teach
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 </div>
 );
};

export default CourseDetails;
