import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { Loader2, Plus, Users, CalendarClock, Trash2, Check, Video, FileText, Edit, Save, X, Upload, LayoutDashboard, Database, ClipboardList, Settings, Search, MoreVertical, ExternalLink, ArrowLeft, AlertCircle, Sparkles, Bot, BarChart3, Brain, Activity } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, TeacherApplication, PatchNote, UserObject, CourseCategory } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'viranadeep@gmail.com';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'appointments' | 'patchnotes' | 'system' | 'ai' | 'analytics' | 'behavior'>('courses');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [usersList, setUsersList] = useState<UserObject[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string }) | null>(null);

  // Create course states
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'education', price: 0, thumbnailUrl: '' });
  const [thumbnailUrlFile, setThumbnailFile] = useState<File | null>(null);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  // Edit course states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState<Course>({
    id: '', title: '', description: '', category: 'education', price: 0, 
    thumbnailUrl: '', createdAt: null, createdBy: ''
  });



  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetching for better performance
      const [uSnap, cSnap, aSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'teacher_applications')),
        getDocs(query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc')))
      ]);

      const users = uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserObject));
      setUsersList(users);

      const courses = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setCoursesList(courses);

      const rawApps = aSnap.docs.map((d) => {
        const data = d.data() as TeacherApplication;
        const cFind = courses.find(c => c.id === data.courseId);
        const uFind = users.find(u => u.uid === data.userId);

        return {
          ...data,
          id: d.id,
          courseTitle: cFind?.title || 'Unknown Course',
          userName: uFind?.name || data.userName || 'Dangling Applicant',
          userEmail: uFind?.email || data.userEmail || 'No Email'
        };
      });

      setTeacherApps(rawApps as any);
      setPatchNotes(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote)));

    } catch (e) {
      console.error("Dashboard data fetch failed", e);
      toast.error("Failed to sync dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        navigate('/');
      } else {
        fetchData();
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleDeleteCourse = (id: string, title: string) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl">
        <div className="flex items-center gap-3 text-red-500">
          <Trash2 className="w-6 h-6" />
          <p className="font-bold text-lg">Confirm Deletion</p>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{title}"</span>? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-2">
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => toast.dismiss(t.id)}>Cancel</button>
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20" onClick={async () => {
            toast.dismiss(t.id);
            try {
              const eSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', id)));
              const allAppsSnap = await getDocs(query(collection(db, 'teacher_applications'), where('courseId', '==', id)));

              await deleteDoc(doc(db, 'courses', id));

              const userIdsToNotify = new Set<string>();
              eSnap.forEach(d => userIdsToNotify.add((d.data() as any).userId));
              allAppsSnap.forEach(d => {
                userIdsToNotify.add((d.data() as any).userId);
                deleteDoc(doc(db, 'teacher_applications', d.id));
              });

              for (const uid of Array.from(userIdsToNotify)) {
                // Fetch user email for the mail trigger
                const uDoc = await getDoc(doc(db, 'users', uid));
                const uData = uDoc.data();
                
                // 1. In-app Notification
                await setDoc(doc(collection(db, 'notifications')), {
                  userId: uid,
                  title: 'Course Deleted',
                  message: `The course "${title}" has been removed.`,
                  isRead: false,
                  createdAt: serverTimestamp(),
                  type: 'course_deleted'
                });

                // 2. Email Notification
                if (uData?.email) {
                  await setDoc(doc(collection(db, 'mail')), {
                    to: uData.email,
                    message: {
                      subject: `Important Update: Course "${title}" Removed`,
                      text: `Hi ${uData.name || 'Student'},\n\nWe wanted to inform you that the course "${title}" has been removed from the platform. If you were enrolled or had an active application, it has been cancelled.\n\nBest,\nThe Edu-Alt-Tech Team`
                    }
                  });
                }
              }
              fetchData();
              toast.success("Course deleted successfully");
            } catch (e) {
              toast.error("Deletion failed");
            }
          }}>Delete Course</button>
        </div>
      </div>
    ), { duration: Infinity, position: 'bottom-center' });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return;
    try {
      await updateDoc(doc(db, 'courses', editingCourseId), {
        title: editCourseData.title,
        description: editCourseData.description,
        category: editCourseData.category,
        price: editCourseData.price,
        thumbnailUrl: editCourseData.thumbnailUrl || ''
      });
      setEditingCourseId(null);
      fetchData();
      toast.success("Course updated");
    } catch (e) {
      toast.error("Update failed");
    }
  };


  const uploadImage = async (file: File, courseId: string) => {
    const storageRef = ref(storage, `course_thumbnailUrls/${courseId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      let finalThumbnailUrl = newCourse.thumbnailUrl;
      if (thumbnailUrlFile) {
        const fileRef = ref(storage, `course_thumbnailUrls/${Date.now()}_${thumbnailUrlFile.name}`);
        const snap = await uploadBytes(fileRef, thumbnailUrlFile);
        finalThumbnailUrl = await getDownloadURL(snap.ref);
      }

      const cRef = doc(collection(db, 'courses'));
      let thumbnailUrl = newCourse.thumbnailUrl;

      if (selectedFile) {
        thumbnailUrl = await uploadImage(selectedFile, cRef.id);
      }

      const courseObj: Course = {
        id: cRef.id,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category as CourseCategory,
        price: Number(newCourse.price),
        thumbnailUrl: finalThumbnailUrl,
        createdBy: 'admin',
        createdAt: serverTimestamp()
      };
      await setDoc(cRef, courseObj as any);
      setNewCourse({ title: '', description: '', category: 'education', price: 0, thumbnailUrl: '' });
      setThumbnailFile(null);
      fetchData();
      toast.success("New course published!");
    } catch (e) {
      toast.error("Publication failed");
    } finally {
      setCreatingCourse(false);
    }
  };

  const wipeAllData = async () => {
    if (!window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE all data nodes in the database (Courses, Chats, Registries, etc.). NOTE: Actual Firebase Authentication user emails/passwords must be manually deleted from the Firebase Console to fully wipe user accounts. Proceed?")) return;
    
    setLoading(true);
    try {
      const collections = [
        'users', 'courses', 'enrollments', 'chats', 'teacher_applications', 
        'resources', 'course_modules', 'patch_notes', 'notifications', 'mail',
        'user_activities', 'user_metrics', 'quiz_attempts', 'learning_paths'
      ];

      for (const colName of collections) {
         const snap = await getDocs(collection(db, colName));
         for (const d of snap.docs) {
            await deleteDoc(doc(db, colName, d.id));
         }
      }
      toast.success("Database Wiped Successfully");
      fetchData();
    } catch (err) {
      console.error("Wipe failed", err);
      toast.error("Wipe failed: Check permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalVerdictTeacher = async (appId: string, emailStr: string | undefined, verdict: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: verdict,
        updatedAt: serverTimestamp()
      });

      if (verdict === 'approved') {
        // Create the specific course enrollment for this mentor
        const appDoc = await getDoc(doc(db, 'teacher_applications', appId));
        if (appDoc.exists()) {
          const data = appDoc.data();
          const enrollmentId = `${data.userId}_${data.courseId}`;
          await setDoc(doc(db, 'enrollments', enrollmentId), {
            userId: data.userId,
            courseId: data.courseId,
            role: 'teacher',
            studentStatus: 'active', // So they aren't blocked by status checks
            createdAt: serverTimestamp()
          });
        }
      }

      if (emailStr && (verdict === 'approved' || verdict === 'rejected')) {
        await setDoc(doc(collection(db, 'mail')), {
          to: emailStr,
          message: {
            subject: `Teacher Application ${verdict === 'approved' ? 'Approved' : 'Rejected'}`,
            text: verdict === 'approved' 
              ? 'Congratulations! You have been approved to teach this course. Take a look at your course classroom to start building!'
              : 'Thank you for your interest, but we are unable to proceed with your application at this time.'
          }
        });
      }
      setSelectedApp(null);
      fetchData();
      toast.success(`Application ${verdict}`);
    } catch(e) { toast.error("Verdict update failed"); }
  };

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState('');

  const handleApproveApp = async (appId: string, emailStr?: string) => {
    if(!meetLink) { toast.error("Provide a meet link"); return; }
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: 'scheduled',
        meetingLink: meetLink,
        updatedAt: serverTimestamp()
      });

      if (emailStr) {
        await setDoc(doc(collection(db, 'mail')), {
          to: emailStr,
          message: {
            subject: 'Interview Scheduled: Teacher Application',
            text: `Your application has been reviewed. Join the interview here: ${meetLink}`
          }
        });
      }

      setSchedulingId(null);
      setMeetLink('');
      setSelectedApp(null);
      fetchData();
      toast.success("Interview scheduled");
    } catch (e) {
      toast.error("Scheduling failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Core Systems...</p>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = coursesList.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

      {/* Sidebar / Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* Mobile Backdrop */}
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
              className="fixed left-0 top-0 h-full w-72 md:w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200/50 dark:border-slate-800/50 z-[60] flex flex-col p-8 shadow-2xl md:shadow-none"
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
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3">
                {[
                  { id: 'courses', label: 'Curricula', icon: ClipboardList, desc: 'Manage courses' },
                  { id: 'users', label: 'User Base', icon: Users, desc: 'Control access' },
                  { id: 'appointments', label: 'Applications', icon: CalendarClock, desc: 'Mentor review' },
                  { id: 'patchnotes', label: 'Deployments', icon: Database, desc: 'System updates' },
                  { id: 'system', label: 'Settings', icon: Settings, desc: 'Global config' },
                  { id: 'ai', label: 'AI Tools', icon: Sparkles, desc: 'Content generation' },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Live platform metrics' },
                  { id: 'behavior', label: 'Behavior', icon: Brain, desc: 'Student behavior analysis' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all relative group overflow-hidden ${
                      activeTab === item.id 
                      ? 'bg-slate-900 dark:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {activeTab === item.id && (
                      <motion.div layoutId="nav-bg" className="absolute inset-0 bg-emerald-500 dark:bg-emerald-600 -z-10" />
                    )}
                    <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{item.label}</span>
                      <span className={`text-[9px] font-medium uppercase tracking-widest ${activeTab === item.id ? 'text-white/60' : 'text-slate-400'}`}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800/50">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
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
      <main className="md:pl-72 pt-32 md:pt-12 pb-24 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          {/* Header & Search */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
            <div className="relative">
              <span className="absolute -top-6 left-0 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Operational Overview</span>
              <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
              </h1>
              <p className="text-slate-500 font-medium mt-2">Manage the underlying infrastructure of Edu-Alt.</p>
            </div>
            
            <div className="relative group w-full lg:w-96">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-focus-within:bg-emerald-500/30 transition-all duration-500 opacity-0 group-focus-within:opacity-100"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global database query..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-bold dark:placeholder:text-slate-600"
                />
                <div className="absolute right-4 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700 pointer-events-none">
                  ⌘ K
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {activeTab === 'courses' && (
                <div className="space-y-8">
                  {/* Create Course Bento Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-emerald-500" />
                        </div>
                        Draft New Curriculum
                      </h2>
                      <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Title</label>
                          <input required value={newCourse.title} onChange={e=>setNewCourse({...newCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold" placeholder="E.g. Advanced Quantum Computing" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Overview</label>
                          <textarea required value={newCourse.description} onChange={e=>setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium resize-none" rows={4} placeholder="Describe the learning outcome..." />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
                          <select value={newCourse.category} onChange={e=>setNewCourse({...newCourse, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none font-bold appearance-none">
                            <option value="education">Core Education</option>
                            <option value="alternative">Alternative Skills</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Price (INR)</label>
                          <input type="number" required value={newCourse.price} onChange={e=>setNewCourse({...newCourse, price: e.target.value as any})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none font-bold" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Media Assets</label>
                          <div className="flex flex-col md:flex-row gap-4">
                            <label className="flex-1 flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-500 transition-colors">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-500">{thumbnailUrlFile ? thumbnailUrlFile.name : 'Upload Thumbnail'}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setThumbnailFile(e.target.files[0])} />
                            </label>
                            <input type="url" value={newCourse.thumbnailUrl} onChange={e=>setNewCourse({...newCourse, thumbnailUrl: e.target.value})} placeholder="Or paste image URL..." className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none text-sm font-medium" />
                          </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <button type="submit" disabled={creatingCourse} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {creatingCourse ? <Loader2 className="w-6 h-6 animate-spin"/> : 'PUBLISH TO DIRECTORY'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-emerald-500/20">
                      <div>
                        <Settings className="w-10 h-10 mb-6 opacity-50" />
                        <h3 className="text-2xl font-black leading-tight mb-4">Curriculum Control Center</h3>
                        <p className="font-medium text-emerald-50 opacity-80 leading-relaxed">
                          Publishing a course instantly makes it available in the student directory. Ensure all descriptions are clear and pricing is accurate.
                        </p>
                      </div>
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl">
                          <span className="text-sm font-bold">Total Courses</span>
                          <span className="text-2xl font-black">{coursesList.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Courses Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Published Curricula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCourses.map(c => (
                        <motion.div 
                          layout
                          key={c.id} 
                          className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300"
                        >
                          {editingCourseId === c.id ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCourse(); }} className="space-y-4">
                              <input value={editCourseData.title} onChange={e=>setEditCourseData({...editCourseData, title: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required />
                              <textarea value={editCourseData.description} onChange={e=>setEditCourseData({...editCourseData, description: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium" required rows={3} />
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Save Changes</button>
                                <button type="button" onClick={()=>setEditingCourseId(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-start gap-6">
                              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                {c.thumbnailUrl ? (
                                  <img src={c.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ClipboardList className="w-8 h-8 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-lg truncate pr-4">{c.title}</h4>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setEditingCourseId(c.id); setEditCourseData(c); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                                      <Edit className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDeleteCourse(c.id, c.title)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                      <Trash2 className="w-5 h-5"/>
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-3 line-clamp-1">{c.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                    {c.category}
                                  </span>
                                  <span className="text-sm font-black text-emerald-500">
                                    ₹{c.price || 'Free'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">System Registry</h2>
                      <p className="text-slate-500 font-medium text-sm">Active personnel and authenticated entities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {usersList.slice(0, 5).map((u, i) => (
                          <div key={i} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {(u.name || 'U').charAt(0)}
                          </div>
                        ))}
                      </div>
                      <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        {filteredUsers.length} ENTITIES
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 sticky top-0 z-10 backdrop-blur-md">
                          <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological ID</th>
                          <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Access Level</th>
                          <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Status</th>
                          <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ops</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {filteredUsers.map((usr) => (
                          <tr key={usr.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-5">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-500 text-lg group-hover:scale-110 transition-transform">
                                    {(usr.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {usr.name || 'Unknown Entity'}
                                    {usr.email === ADMIN_EMAIL && (
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-md shadow-lg shadow-emerald-500/20">
                                        <Database className="w-2.5 h-2.5" /> ROOT
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{usr.email || '0X_NOT_FOUND'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                usr.role === 'admin' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : usr.role === 'teacher'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {usr.role || 'Personnel'}
                              </span>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked</span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              {usr.email !== ADMIN_EMAIL && (
                                <button className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all group/btn">
                                  <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CalendarClock className="w-6 h-6 text-blue-500" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">Active Recruitment</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teacherApps.length === 0 ? (
                      <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <CalendarClock className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-slate-400">NO PENDING DOSSIERS</h3>
                        <p className="text-slate-500 text-sm font-medium mt-2">The system is currently clear of applicants.</p>
                      </div>
                    ) : (
                      teacherApps.map(app => (
                        <motion.div 
                          layout
                          key={app.id} 
                          className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-all duration-500 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
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
                            <h4 className="font-black text-2xl text-slate-900 dark:text-white mb-1 line-clamp-1">{app.userName}</h4>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{app.userEmail}</p>
                          </div>

                          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Curriculum</span>
                            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-emerald-500" /> {app.courseTitle}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Experience</span>
                              <span className="text-xl font-black text-slate-900 dark:text-white">{app.experience}y</span>
                            </div>
                            <div className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Skills</span>
                              <span className="text-xl font-black text-emerald-500">{app.skills?.split(',').length || 0}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl group-hover:bg-emerald-500 group-hover:text-white"
                          >
                            REVIEW DOSSIER
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'patchnotes' && (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold mb-6">Deploy System Update</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Version (e.g. 1.2.0)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold" />
                        <input placeholder="Update Title" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold" />
                      </div>
                      <textarea placeholder="Describe the changes..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium resize-none" rows={4} />
                      <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl">
                        PUBLISH PATCH NOTES
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {patchNotes.map(note => (
                      <div key={note.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{note.version}</span>
                          <span className="text-xs font-medium text-slate-400">{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-lg mb-2">{note.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
             {/* System Management Tab */}
             {activeTab === 'system' && (
               <div className="max-w-3xl mx-auto">
                 <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                      <Settings className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-5 mb-12">
                         <span className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-500/20 shadow-xl shadow-rose-500/10">
                            <Database className="w-8 h-8" />
                         </span>
                         <div>
                            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Admin Subsystems</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Critical Infrastructure Control</p>
                         </div>
                      </div>

                      <div className="space-y-8">
                        <section className="p-8 border-2 border-dashed border-rose-500/20 rounded-[2.5rem] bg-rose-500/5 group hover:bg-rose-500/10 transition-colors">
                           <div className="flex items-start gap-4 mb-6">
                             <AlertCircle className="w-8 h-8 text-rose-500 shrink-0 mt-1" />
                             <div>
                                <h4 className="text-xl font-black text-rose-600 mb-2 uppercase tracking-tighter">Hard System Purge</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">This operation protocols a complete erasure of all Firestore nodes (Curricula, Users, Logs). Access keys and Auth profiles will persist, but all relational data will be nullified.</p>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-4">
                             <button 
                               onClick={wipeAllData}
                               className="px-8 py-5 bg-rose-600 text-white font-black rounded-2xl shadow-2xl shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
                             >
                               <Trash2 className="w-5 h-5" /> Execute Data Wipe
                             </button>
                             <div className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em] animate-pulse">
                               Authorization Required
                             </div>
                           </div>
                        </section>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <button className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 text-left group">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Backups</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Snapshot State</span>
                          </button>
                          <button className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 text-left group">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logs</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Audit Console</span>
                          </button>
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
             )}
              {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Live Platform Analytics</h2>
                      <p className="text-slate-500 font-medium text-sm">Real-time learning metrics across all courses</p>
                    </div>
                  </div>
                  <iframe src={`#/analytics`} className="w-full h-[600px] rounded-2xl border border-slate-200 dark:border-slate-800" title="Analytics Dashboard" />
                </div>
              )}
              {activeTab === 'behavior' && (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Behavior Analysis Console</h2>
                      <p className="text-slate-500 font-medium text-sm">Student engagement patterns and dropout risk detection</p>
                    </div>
                  </div>
                  <iframe src={`#/admin/behavior`} className="w-full h-[600px] rounded-2xl border border-slate-200 dark:border-slate-800" title="Behavior Dashboard" />
                </div>
              )}
              {activeTab === 'ai' && (
               <div className="max-w-3xl mx-auto space-y-8">
                 {/* AI Chat Section */}
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                   <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                       <Bot className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-black tracking-tight">AI Content Studio</h2>
                       <p className="text-slate-500 font-medium text-sm">Generate course descriptions, patch notes, and more</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <button
                       onClick={() => window.dispatchEvent(new CustomEvent('openaichat', { detail: { mode: 'admin' } }))}
                       className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left group hover:border-emerald-500/50 transition-all"
                     >
                       <Sparkles className="w-8 h-8 text-emerald-500 mb-4" />
                       <span className="block font-bold text-slate-900 dark:text-white mb-1">Open AI Assistant</span>
                       <span className="block text-sm text-slate-500 font-medium">Chat with EduAI in admin mode for instant help</span>
                     </button>

                     <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <Sparkles className="w-8 h-8 text-emerald-500 mb-4" />
                       <span className="block font-bold text-slate-900 dark:text-white mb-3">Quick Generate</span>
                       <div className="space-y-3">
                         <button
                           onClick={() => {
                             const title = prompt('Enter course title:');
                             if (title) {
                               const cat = prompt('Category (education/alternative):') || 'education';
                               window.dispatchEvent(new CustomEvent('openaichat', {
                                 detail: { mode: 'admin' }
                               }));
                             }
                           }}
                           className="w-full p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-sm hover:bg-emerald-500/20 transition-all text-left"
                         >
                           Generate Course Description
                         </button>
                         <button
                           onClick={() => {
                             window.dispatchEvent(new CustomEvent('openaichat', {
                               detail: { mode: 'admin' }
                             }));
                           }}
                           className="w-full p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-sm hover:bg-emerald-500/20 transition-all text-left"
                         >
                           Draft Patch Notes
                         </button>
                         <a
                           href="/admin"
                           onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('openaichat', { detail: { mode: 'admin' } })); }}
                           className="block w-full p-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-center"
                         >
                           Open AI Assistant
                         </a>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             </AnimatePresence>
        </div>
      </main>

      {/* Premium Application Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Mentor Review</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Application Dossier #{selectedApp.id.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <section>
                    <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Applicant Profile</label>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm font-black text-slate-400 uppercase mb-1">Name</p>
                        <p className="font-bold text-lg">{selectedApp.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-400 uppercase mb-1">Target Curriculum</p>
                        <p className="font-bold text-lg">{selectedApp.courseTitle}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Professional Experience</label>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
                      {selectedApp.experience || 'No experience provided.'}
                    </p>
                  </section>

                  {selectedApp.proposedPath && selectedApp.proposedPath.length > 0 && (
                    <section>
                      <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Proposed Learning Path</label>
                      <div className="space-y-3">
                        {selectedApp.proposedPath.map((step, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">{i+1}</span>
                            <span className="font-bold text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                   {(selectedApp.status === 'pending' || selectedApp.status === 'scheduled') && (
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                      {selectedApp.status === 'pending' && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] mb-6">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Schedule Interview</label>
                          <div className="flex gap-4">
                            <input 
                              value={meetLink}
                              onChange={e => setMeetLink(e.target.value)}
                              placeholder="Paste Google Meet / Zoom Link..." 
                              className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" 
                            />
                            <button 
                              onClick={() => handleApproveApp(selectedApp.id, selectedApp.userEmail)}
                              className="px-8 bg-emerald-500 text-white font-black rounded-2xl hover:scale-[1.02] transition-all"
                            >
                              SEND
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
                          className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all"
                        >
                          APPROVE MENTOR NOW
                        </button>
                        <button 
                          onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
                          className="flex-1 py-5 bg-red-500 text-white font-black rounded-[2rem] shadow-xl shadow-red-500/20 hover:scale-[1.01] transition-all"
                        >
                          REJECT APPLICATION
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
    </div>
  );
};

export default AdminDashboard;
