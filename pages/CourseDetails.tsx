import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, onAuthStateChanged } from '../lib/firebase';
import { Course, CourseEnrollment } from '../types';
import { PLATFORM_COURSES } from '../data/platformCourses';
import type { User } from '../lib/firebase';
import { toast } from 'react-hot-toast';

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
            } catch {}
            try {
              const localOverrides = JSON.parse(localStorage.getItem('platformCourseOverrides') || '{}');
              if (localOverrides[courseId]) base = { ...base, ...localOverrides[courseId] };
            } catch {}
            setCourse(base);
            found = true;
          }
        }

        if (currentUser) {
          const enrollmentsRef = collection(db, 'enrollments');
          const q = query(enrollmentsRef, where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
          const querySnapshot = await getDocs(q);

          let enrData: CourseEnrollment | null = null;
          if (!querySnapshot.empty) {
            const sorted = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment))
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            enrData = sorted[0];
            setEnrollment(enrData);
          }

          const appsQ = query(collection(db, 'teacher_applications'), where('status', '==', 'approved'));
          const appsSnap = await getDocs(appsQ);
          const approvedForCourse = appsSnap.docs.filter(d => d.data().qualification === courseId);

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
            setSelectedMentor(loadedMentors[0].userId);
          }

          const isApprovedMentor = loadedMentors.some(m => m.userId === currentUser.uid);
          if (isApprovedMentor && enrData) {
            navigate(`/classroom/${courseId}`);
            return;
          }
        } else {
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

  const finalizeEnrollment = async (plan: 'trial' | 'first_class' | 'full' = 'full') => {
    setEnrollLoading(true);
    try {
      const enrollmentRef = doc(collection(db, 'enrollments'));
      const newEnrollment: CourseEnrollment = {
        id: enrollmentRef.id,
        userId: user!.uid,
        courseId: courseId!,
        role: 'student',
        studentStatus: 'active',
        paymentStatus: plan === 'trial' ? 'not-required' : 'paid',
        plan,
        mentorId: selectedMentor || undefined,
        createdAt: serverTimestamp()
      };
      await setDoc(enrollmentRef, newEnrollment as any);
      setEnrollment(newEnrollment);

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

      try {
        await setDoc(doc(collection(db, 'mail')), {
          to: user!.email,
          message: {
            subject: `Successfully Enrolled: ${course?.title || 'Unknown Course'}`,
            text: `Hi ${user!.displayName || 'Student'},\n\nGreat news! You are now enrolled in ${course?.title || 'Unknown Course'}. You can access your course materials from your dashboard.\n\nHappy Learning,\nEdu-Alt-Tech`
          }
        });

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

    if (!course?.price || course.price === 0) {
      await finalizeEnrollment('full');
      return;
    }

    setEnrollLoading(true);
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
        setEnrollLoading(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T2D67OLLpfRjtJ",
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
    setEnrollLoading(true);
    try {
      const amountInPaise = 1000;
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T2D67OLLpfRjtJ",
        amount: amountInPaise,
        currency: "INR",
        name: "Edu Alt Tech",
        description: `First Class - ${course?.title || 'Course'}`,
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

  const handleFreeTrial = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedMentor) { alert("Please select a mentor first."); return; }
    await finalizeEnrollment('trial');
  };

  const handleApplyToTeach = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/teacher-application?courseId=${courseId}`);
  };

  if (loading) {
    return (
      <div className="bento-card" style={{ gap: 16 }}>
        <div className="skeleton skeleton-title" style={{ width: '30%' }} />
        <div className="skeleton skeleton-title" style={{ width: '60%' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="empty-state" style={{ gap: 8 }}>
        <div className="empty-icon"></div>
        <h3>Course not found</h3>
        <p>The course you're looking for doesn't exist or has been removed.</p>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="viewport-content">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span className="sep">→</span>
        <Link to="/courses">Courses</Link>
        <span className="sep">→</span>
        <span style={{ color: 'var(--ink)' }}>{course.title}</span>
      </div>

      {/* Course Header */}
      <div className="bento-card" style={{ marginBottom: 24, gap: 16 }}>
        <div className="grid-12" style={{ alignItems: 'center' }}>
          <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="flabel">{course.category}</span>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
          </div>
          <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <span className="stat-value accented" style={{ fontSize: '1.8rem', textAlign: 'right' }}>
              {course.price === 0 || !course.price ? 'Free' : `₹${course.price}/month`}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              Open for enrollment
            </span>
          </div>
        </div>
      </div>

      <div className="asc" />

      {/* Ask AI Button */}
      <button
        className="bento-card bento-card-accent"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 24, width: '100%' }}
        onClick={() => window.dispatchEvent(new CustomEvent('openaichat', { detail: { mode: 'course' } }))}
      >
        <div style={{ width: 40, height: 40, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', flexShrink: 0 }}>
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>Ask AI about this course</span>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Get instant answers, summaries, and learning tips</p>
        </div>
      </button>

      {/* Enrollment / Mentor Area */}
      <div className="grid-2">
        {enrollment ? (
          <>
            {/* Enrollment Status */}
            <div className="bento-card bento-card-accent" style={{ gap: 12 }}>
              {enrollment.role === 'student' ? (
                enrollment.paymentStatus === 'pending' ? (
                  <>
                    <h3>Mentor Assigned!</h3>
                    <p>A mentor is ready to teach you. Please complete the payment to start learning.</p>
                    <button className="btn btn-primary" onClick={handleJoinAsStudent}>
                      Pay ₹{course.price || 0}/month
                    </button>
                  </>
                ) : (
                  <>
                    <h3>You are enrolled!</h3>
                    <Link to="/dashboard" className="btn btn-primary" style={{ gap: 4 }}>
                      Go to Dashboard
                    </Link>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Want to learn from a different mentor? Select one below and enroll again.</span>

                    {/* Mentor selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mentors.map(m => (
                        <div
                          key={m.userId}
                          className={`bento-card bento-card-compact ${selectedMentor === m.userId ? 'bento-card-accent' : ''}`}
                          style={{ cursor: 'pointer', gap: 4, padding: 16 }}
                          onClick={() => setSelectedMentor(m.userId)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontWeight: 600, margin: 0, color: 'var(--ink)' }}>{m.name}</p>
                            {selectedMentor === m.userId && <span style={{ color: 'var(--accent)' }}> ✓</span>}
                          </div>
                          <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Experience:</strong> {m.experience}</p>
                          {m.highestQualification && <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Qualification:</strong> {m.highestQualification}</p>}
                          <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Skills:</strong> {m.skills}</p>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        <button className="btn btn-sm" onClick={handleFreeTrial} disabled={enrollLoading || !selectedMentor}>
                          {enrollLoading ? 'Loading...' : (selectedMentor ? 'Free Trial (1 Day)' : 'Select Mentor')}
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={handleFirstClassPayment} disabled={enrollLoading || !selectedMentor}>
                          {enrollLoading ? 'Loading...' : (selectedMentor ? 'First Class — ₹10' : 'Select Mentor')}
                        </button>
                        {course?.price && course.price > 0 && (
                          <button className="btn btn-sm" onClick={handleJoinAsStudent} disabled={enrollLoading || !selectedMentor}>
                            {enrollLoading ? 'Loading...' : (selectedMentor ? `Pay ₹${course.price}/mo — Full` : 'Select Mentor')}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )
              ) : (
                <>
                  <h3>Teacher Application Submitted</h3>
                  <p>You have applied to teach this course. Check your dashboard for appointment updates.</p>
                  <Link to="/dashboard" className="btn btn-primary" style={{ gap: 4 }}>
                    View Schedule
                  </Link>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Join as Student */}
            <div className="bento-card" style={{ gap: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Join as a Student</h3>

              {mentors.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                  <p>No active mentors available right now.</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>Please wait for a mentor to be approved to teach.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mentors.map(m => (
                    <div
                      key={m.userId}
                      className={`bento-card bento-card-compact ${selectedMentor === m.userId ? 'bento-card-accent' : ''}`}
                      style={{ cursor: 'pointer', gap: 4, padding: 16 }}
                      onClick={() => setSelectedMentor(m.userId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontWeight: 600, margin: 0, color: 'var(--ink)' }}>{m.name}</p>
                        {selectedMentor === m.userId && <span style={{ color: 'var(--accent)' }}> ✓</span>}
                      </div>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Experience:</strong> {m.experience}</p>
                      {m.highestQualification && <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Qualification:</strong> {m.highestQualification}</p>}
                      <p style={{ fontSize: '0.8rem', margin: 0 }}><strong>Skills:</strong> {m.skills}</p>
                      {m.message && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: 4 }}>"{m.message}"</p>}

                      {m.proposedPath && m.proposedPath.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-mute)' }}>Proposed Curriculum:</span>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                            {m.proposedPath.map((pathItem: string, idx: number) => (
                              <li key={idx}>{pathItem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={handleFreeTrial} disabled={enrollLoading || !selectedMentor}>
                      {enrollLoading ? 'Loading...' : (selectedMentor ? 'Free Trial (1 Day)' : 'Select Mentor')}
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={handleFirstClassPayment} disabled={enrollLoading || !selectedMentor}>
                      {enrollLoading ? 'Loading...' : (selectedMentor ? 'First Class — ₹10' : 'Select Mentor for First Class')}
                    </button>
                    {course?.price && course.price > 0 && (
                      <button className="btn btn-sm" onClick={handleJoinAsStudent} disabled={enrollLoading || !selectedMentor}>
                        {enrollLoading ? 'Loading...' : (selectedMentor ? `Pay ₹${course.price}/mo — Full` : 'Select Mentor')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Teach this Course */}
            <div className="bento-card bento-card-accent" style={{ gap: 12 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Teach this Course</h3>
              <p>
                Are you qualified to teach this subject? Apply to become a mentor and start teaching students securely.
              </p>
              {myAppStatus === 'pending' || myAppStatus === 'scheduled' ? (
                <button className="btn btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                  Application Under Review
                </button>
              ) : myAppStatus === 'rejected' ? (
                <button className="btn btn-primary" onClick={handleApplyToTeach}>
                  Re-apply to Teach
                </button>
              ) : myAppStatus === 'approved' ? (
                <button className="btn btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                  You are a Mentor
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleApplyToTeach}>
                  Apply to Teach
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
