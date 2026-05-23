import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { Loader2, BookOpen, Users, Calendar, AlertCircle, X, Camera, MapPin, Building2, Tag, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserObject, CourseEnrollment, Course, TeacherApplication, Notification } from '../types';
import { motion } from 'framer-motion';

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [teacherApplications, setTeacherApplications] = useState<(TeacherApplication & { courseData?: Course })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  


  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);


  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this enrollment? This action is immediate.")) return;
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
      setStudentEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (err) {
      console.error("Cancellation failed", err);
      alert("Failed to cancel enrollment. Please try again.");
    }
  };

  useEffect(() => {

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        navigate('/login');
        return;
      }

      // Track profile
      const unsubProfile = onSnapshot(doc(db, 'users', u.uid), (docObj) => {
        if (docObj.exists()) {
          setUserProfile({ uid: docObj.id, ...docObj.data() } as UserObject);
        } else {
          const defaultUser = { email: u.email || '', name: u.displayName || 'User', role: 'student' };
          setUserProfile({ uid: u.uid, ...defaultUser } as unknown as UserObject);
          setDoc(doc(db, 'users', u.uid), defaultUser, { merge: true }).catch(err => console.error("Self-healing failed:", err));
        }
      }, (err) => {
        console.warn("Profile snapshot closed or denied", err);
      });

      // Fetch user enrollments (student)
      try {
        const qStudent = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'student'));
        const snapStudent = await getDocs(qStudent);
        const sEnrollments: any[] = [];
        for (const docSnap of snapStudent.docs) {
          const data = docSnap.data();
          try {
            const cDoc = await getDoc(doc(db, 'courses', data.courseId));
            if (cDoc.exists()) {
              const cData = { id: cDoc.id, ...cDoc.data() };
              sEnrollments.push({ id: docSnap.id, ...data, courseData: cData });
            }
          } catch (e) {}
        }
        setStudentEnrollments(sEnrollments);
      } catch (err) {
        console.error("Error fetching enrollments: ", err);
      }

      // Fetch user teacher applications
      try {
        const qTeacher = query(collection(db, 'teacher_applications'), where('userId', '==', u.uid));
        const snapTeacher = await getDocs(qTeacher);
        const tApps: any[] = [];
        for (const docSnap of snapTeacher.docs) {
          const data = docSnap.data();
           try {
             const cDoc = await getDoc(doc(db, 'courses', data.courseId));
             if (cDoc.exists()) {
               const cData = { id: cDoc.id, ...cDoc.data() };
               tApps.push({ id: docSnap.id, ...data, courseData: cData });
             }
           } catch (e) {}
        }
        setTeacherApplications(tApps);
      } catch (err) {
        console.error("Error fetching teacher applications: ", err);
      }

      // Fetch notifications
      try {
        const qNotif = query(collection(db, 'notifications'), where('userId', '==', u.uid));
        const snapNotif = await getDocs(qNotif);
        const notifs = snapNotif.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(notifs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch (err) {
        // console.error("Error fetching notifications", err);
      }

      setLoading(false);

      return () => unsubProfile();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[1400px] mx-auto relative z-10"
        ref={containerRef}
      >
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl sticky top-32">
            <div className="flex flex-col items-center text-center">
               
               {userProfile.profilePic ? (
                 <img src={userProfile.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-100 dark:border-slate-800" />
               ) : (
                 <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                   {(userProfile.name || user?.email || 'U').charAt(0).toUpperCase()}
                 </div>
               )}
               
               <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate w-full tracking-tight">{userProfile.name || 'User'}</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 truncate w-full">{userProfile.email || user?.email}</p>
               
               <div className="w-full border-t border-slate-100 dark:border-slate-800 py-4 grid grid-cols-2 gap-4 text-center">
                 <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentEnrollments.length}</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learning</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{teacherApplications.length}</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teaching</p>
                 </div>
               </div>

               <div className="w-full space-y-2 mb-6">
                 {userProfile.classYear && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 justify-center">
                     <Building2 className="w-4 h-4" /> Education: {userProfile.classYear}
                   </div>
                 )}
                 {userProfile.location && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 justify-center">
                     <MapPin className="w-4 h-4" /> {userProfile.location}
                   </div>
                 )}
               </div>

               <Link to="/profile" className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-colors text-sm block text-center">
                 Edit Profile
               </Link>
            </div>
          </div>

          {/* Main Content Areas */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-8">
             
             {/* Notifications */}
             {notifications.length > 0 && (
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                   <Bell className="w-6 h-6 text-amber-500" />
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                 </div>
                 <div className="space-y-4">
                   {notifications.map(notif => (
                     <div key={notif.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
                       <div>
                         <h3 className="font-bold text-slate-900 dark:text-white mb-1">{notif.title}</h3>
                         <p className="text-slate-600 dark:text-slate-400 text-sm">{notif.message}</p>
                       </div>
                       {!notif.isRead && <span className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></span>}
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Learning Dashboard */}
             <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Learning</h2>
               </div>
               
               {studentEnrollments.length === 0 ? (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                   <p className="text-slate-500 dark:text-slate-400">You haven't joined any courses yet.</p>
                   <button onClick={() => navigate('/courses')} className="mt-4 text-emerald-600 font-semibold hover:underline">Explore Courses</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {studentEnrollments.map(enr => (
                     <div key={enr.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{enr.courseData?.title || 'Unknown Course'}</h3>
                       
                       {enr.studentStatus === 'waitlisted' && (
                         <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg w-fit">
                           <AlertCircle className="w-4 h-4" /> Waitlisted - Pending Mentor
                         </div>
                       )}
                       {enr.paymentStatus === 'pending' ? (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mentor assigned. Payment required.</p>
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition-colors text-sm">
                              Pay Fee
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                             <button onClick={() => navigate(`/classroom/${enr.courseId}`)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold py-3 px-4 rounded-xl w-full transition-colors shadow-sm flex justify-center items-center gap-2">
                               Enter Classroom
                             </button>
                             <button onClick={() => handleCancelEnrollment(enr.id)} className="mt-2 text-rose-500 hover:text-rose-600 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto py-2 transition-colors">
                               <X className="w-3 h-3" /> Cancel Enrollment
                             </button>
                          </div>

                        )}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Teaching Dashboard */}
             <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-xl flex items-center justify-center">
                   <Users className="w-5 h-5" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Teaching</h2>
               </div>
               
               {teacherApplications.length === 0 ? (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                   <p className="text-slate-500 dark:text-slate-400">You haven't applied to teach any courses.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {teacherApplications.map(app => (
                     <div key={app.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{app.courseData?.title || 'Unknown Course'}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">Status: <strong className="text-slate-700 dark:text-slate-300">{app.status}</strong></p>
                       
                       {app.status === 'scheduled' && app.meetingLink ? (
                         <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mt-4">
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Appointment Scheduled</p>
                            <a href={app.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-sm font-medium">Join Meeting</a>
                         </div>
                        ) : app.status === 'pending' ? (
                          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg w-fit mt-4 flex items-center gap-2 font-bold uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4" /> Under Review
                          </div>
                        ) : app.status === 'rejected' ? (
                          <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg w-fit mt-4 flex items-center gap-2 font-bold uppercase tracking-wider">
                            <X className="w-4 h-4" /> Application Declined
                          </div>
                        ) : app.status === 'approved' ? (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                              <button onClick={() => navigate(`/classroom/${app.courseId}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl w-full transition-colors shadow-sm flex justify-center items-center gap-2">
                                Enter Mentor Portal
                              </button>
                          </div>
                        ) : null}
                     </div>
                   ))}
                 </div>
               )}
              </div>

          </div>

        </div>
      </motion.div>



    </div>
  );
};

export default Dashboard;
