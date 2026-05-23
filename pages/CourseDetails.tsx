import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Course, CourseEnrollment } from '../types';
import { ArrowLeft, CheckCircle2, Clock, Users, BookOpen, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [myAppStatus, setMyAppStatus] = useState<string | null>(null);
  
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourseAndEnrollment = async (currentUser: FirebaseUser | null) => {
      if (!courseId) return;
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }

        if (currentUser) {
          // Check if already enrolled or applied
          const enrollmentsRef = collection(db, 'enrollments');
          const q = query(enrollmentsRef, where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
          const querySnapshot = await getDocs(q);
          
          let enrData: CourseEnrollment | null = null;
          if (!querySnapshot.empty) {
             enrData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as CourseEnrollment;
             setEnrollment(enrData);
          }

          // Fetch Approved Mentors for this course
          const appsQ = query(collection(db, 'teacher_applications'), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const appsSnap = await getDocs(appsQ);

          // Fetch current user's application status
          const myAppQ = query(collection(db, 'teacher_applications'), where('courseId', '==', courseId), where('userId', '==', currentUser.uid));
          const myAppSnap = await getDocs(myAppQ);
          if (!myAppSnap.empty) {
            setMyAppStatus(myAppSnap.docs[0].data().status);
          }

          const loadedMentors = appsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              appId: doc.id,
              userId: data.userId,
              name: data.userName || 'Mentor',
              email: data.userEmail || '',
              experience: data.experience || 'Experienced Professional',
              skills: data.skills || 'Course Expert',
              message: data.message || '',
              proposedPath: data.proposedPath || []
            };
          });
          setMentors(loadedMentors);

          if (loadedMentors.length === 1) {
            setSelectedMentor(loadedMentors[0].userId);
          }

          // --- AUTO REDIRECT TO CLASSROOM ---
          const isApprovedMentor = loadedMentors.some(m => m.userId === currentUser.uid);
          const isActiveStudent = enrData?.studentStatus === 'active';
          
          if (isApprovedMentor || isActiveStudent) {
             navigate(`/classroom/${courseId}`);
             return; // Stop rendering course details page
          }
        } else {
          // For guests, just fetch mentors to show who is teaching
          const appsQ = query(collection(db, 'teacher_applications'), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const appsSnap = await getDocs(appsQ);
          const loadedMentors = appsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              appId: doc.id,
              userId: data.userId,
              name: data.userName || 'Mentor',
              email: data.userEmail || '',
              experience: data.experience || 'Experienced Professional',
              skills: data.skills || 'Course Expert',
              message: data.message || '',
              proposedPath: data.proposedPath || []
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
      setUser(currentUser);
      fetchCourseAndEnrollment(currentUser);
    });

    return () => unsubscribe();
  }, [courseId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const finalizeEnrollment = async (isPaid: boolean = false) => {
    setEnrollLoading(true);
    try {
      const enrollmentRef = doc(collection(db, 'enrollments'));
      const newEnrollment: CourseEnrollment = {
        id: enrollmentRef.id,
        userId: user!.uid,
        courseId: courseId!,
        role: 'student',
        studentStatus: 'active',
        paymentStatus: isPaid ? 'paid' : 'not-required',
        mentorId: selectedMentor || undefined,
        createdAt: serverTimestamp()
      };
      await setDoc(enrollmentRef, newEnrollment as any);
      setEnrollment(newEnrollment);

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
    if (!course?.price || course.price === 0) {
      await finalizeEnrollment(false);
      return;
    }

    // Paid Course
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SUbr4cftio73uJ",
        amount: amountInPaise,
        currency: "INR",
        name: "Edu Alt Tech",
        description: `Enrollment for ${course.title}`,
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
            
            if (!resVerify.ok) {
              const verifyErrorData = await resVerify.json().catch(() => ({}));
              throw new Error(verifyErrorData.error || "Payment verification failed on server");
            }

            const verifyData = await resVerify.json();

            if (verifyData.success) {
              await finalizeEnrollment(true);
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


  const handleApplyToTeach = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/teacher-application?courseId=${courseId}`);
  };

  if (loading) {
    return <div className="min-h-screen pt-32 pb-24 flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
  }

  if (!course) {
    return <div className="min-h-screen pt-32 pb-24 text-center text-slate-500">Course not found.</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto relative z-10"
        ref={contentRef}
      >
        <Link to="/courses" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        {/* Hero Card */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] p-10 md:p-14 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            <div>
              <div className={`mb-4 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${course.category === 'education' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                {course.category}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-[1.05]">{course.title}</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">{course.description}</p>
            </div>
            <div className="flex flex-col items-start md:items-end flex-shrink-0">
               <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                 {course.price === 0 || !course.price ? 'Free' : `₹${course.price}`}
               </span>
               <span className="text-sm font-medium text-slate-500 flex items-center gap-1"><Users className="w-4 h-4" /> Open for enrollment</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 my-8" />

          {/* AI Course Assistant Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openaichat', { detail: { mode: 'course' } }))}
            className="w-full mb-6 p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl flex items-center justify-between group hover:from-emerald-500/20 hover:to-teal-500/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-slate-900 dark:text-white text-sm">Ask AI about this course</span>
                <span className="block text-xs text-slate-500 font-medium">Get instant answers, summaries, and learning tips</span>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          </button>

          {/* Action Area depending on Enrollment */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
            {enrollment ? (
              <div className="flex flex-col items-center text-center">
                {enrollment.role === 'student' ? (
                   enrollment.paymentStatus === 'pending' ? (
                     <>
                        <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mentor Assigned!</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                          A mentor is ready to teach you. Please complete the payment to start learning.
                        </p>
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full md:w-auto">
                          Pay ₹{course.price || 0} Now
                        </button>
                     </>
                   ) : (
                     <>
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You are enrolled!</h2>
                        <Link to="/dashboard" className="text-emerald-600 hover:underline mt-2 font-medium flex items-center gap-1">
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                     </>
                   )
                ) : (
                  <>
                     <CheckCircle2 className="w-16 h-16 text-purple-500 mb-4" />
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Teacher Application Submitted</h2>
                     <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        You have applied to teach this course. Check your dashboard for appointment updates.
                     </p>
                     <Link to="/dashboard" className="text-purple-600 hover:underline mt-2 font-medium flex items-center gap-1">
                        View Schedule <ArrowRight className="w-4 h-4" />
                     </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500"/> Join as a Student</h3>
                  {mentors.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                      <p className="text-slate-500 font-medium">No active mentors available right now.</p>
                      <p className="text-sm mt-1 text-slate-400">Please wait for a mentor to be approved to teach.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mentors.map(m => (
                        <div 
                           key={m.userId}
                           onClick={() => setSelectedMentor(m.userId)}
                           className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedMentor === m.userId ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                        >
                           <div className="flex justify-between items-start mb-2">
                             <p className="font-bold text-slate-900 dark:text-white text-lg">{m.name}</p>
                             {selectedMentor === m.userId && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                           </div>
                           <p className="text-sm text-slate-500 mb-1 leading-snug"><strong>Experience:</strong> {m.experience}</p>
                           <p className="text-sm text-slate-500 leading-snug"><strong>Skills:</strong> {m.skills}</p>
                           {m.message && <p className="text-xs text-slate-400 mt-2 italic">"{m.message}"</p>}
                           
                           {m.proposedPath && m.proposedPath.length > 0 && (
                             <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Proposed Curriculum:</p>
                               <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                                 {m.proposedPath.map((pathItem: string, idx: number) => (
                                   <li key={idx} className="truncate">{pathItem}</li>
                                 ))}
                               </ul>
                             </div>
                           )}
                        </div>
                      ))}
                      <button 
                        onClick={handleJoinAsStudent}
                        disabled={enrollLoading || !selectedMentor}
                        className="w-full bg-slate-900 dark:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-md disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                      >
                        {enrollLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                          (!course?.price || course.price === 0 ? 
                            (selectedMentor ? 'Enroll Now (Free)' : 'Select a Mentor') : 
                            (selectedMentor ? `Pay ₹${course.price} & Enroll` : 'Select a Mentor to Pay')
                          )
                        }
                      </button>

                    </div>
                  )}
                </div>

                <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur border border-purple-200/50 dark:border-purple-900/30 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                  <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2"><Users className="w-5 h-5 text-purple-500"/> Teach this Course</h3>
                  <p className="text-slate-500 text-sm mb-4 max-w-sm">
                    Are you qualified to teach this subject? Apply to become a mentor and start teaching students securely.
                  </p>
                  {myAppStatus === 'pending' || myAppStatus === 'scheduled' ? (
                     <button disabled className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed">
                       Application Under Review
                     </button>
                  ) : myAppStatus === 'rejected' ? (
                     <button disabled className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 text-rose-500 dark:text-rose-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed border border-rose-200 dark:border-rose-900/50">
                       Application Rejected
                     </button>
                  ) : myAppStatus === 'approved' ? (
                     <button disabled className="w-full max-w-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed border border-emerald-200 dark:border-emerald-800">
                       You are a Mentor
                     </button>
                  ) : (
                     <button 
                       onClick={handleApplyToTeach}
                       className="w-full max-w-xs bg-white dark:bg-transparent text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-500 font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
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
