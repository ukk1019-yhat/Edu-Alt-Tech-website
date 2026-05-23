import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, CourseEnrollment, CourseModule, ModuleLecture, CourseResource } from '../types';
import { ArrowLeft, BookOpen, Video, FileText, Plus, Link as LinkIcon, Loader2, PlayCircle, CheckCircle2, Circle, ChevronRight, Clock, Award, Layout, Zap, X, Upload, ExternalLink, MessageCircle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CourseChat from '../components/CourseChat';

const CourseClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  // Classroom Data
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'chat'>('roadmap');

  // Active Expand States
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

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
    } catch (e) {
      console.error("Failed to load classroom items", e);
    }
  };

  useEffect(() => {
    const init = async (currentUser: FirebaseUser | null) => {
      if (!courseId) return;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);

        const eQ = query(collection(db, 'enrollments'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
        const eSnap = await getDocs(eQ);
        
        if (eSnap.empty) {
          navigate(`/courses/${courseId}`);
          return;
        }

        const enrollData = { id: eSnap.docs[0].id, ...eSnap.docs[0].data() } as CourseEnrollment;
        setEnrollment(enrollData);
        
        if (enrollData.role === 'teacher') {
          const tQ = query(collection(db, 'teacher_applications'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const tSnap = await getDocs(tQ);
          if (tSnap.empty) {
            navigate(`/courses/${courseId}`);
            return;
          }
          setRole('teacher');
        } else {
           if (enrollData.studentStatus !== 'active') {
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

    return () => unsubscribe();
  }, [courseId, navigate]);

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
      toast.success(isCompleted ? "Checkpoint reset" : "Module mastered! Progress updated.");
    } catch(err) {
      toast.error("Status update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-12 h-12 text-purple-500" />
      </motion.div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Entering Virtual Environment...</p>
    </div>
  );
  
  if (!course) return null;

  const completedCount = enrollment?.completedModules?.length || 0;
  const totalCount = modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen pt-28 pb-32 px-6 bg-slate-50 dark:bg-[#020617] selection:bg-purple-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Navigation & Title */}
        <header className="mb-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-bold mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                  {role === 'teacher' ? 'Instructional Mode' : 'Learning Pathway'}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> Updated 2d ago
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
                {course.title}
              </h1>
            </div>

            {role === 'teacher' && (
              <div className="flex gap-3">
                <button onClick={()=>setShowResourceModal(true)} className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  Add Resource
                </button>
                <button onClick={()=>setShowModuleModal(true)} className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2">
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
            <div className="flex items-center gap-4 p-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-fit">
              <button 
                onClick={() => setActiveTab('roadmap')}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'roadmap' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Layout className="w-4 h-4" /> Curriculum Roadmap
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <MessageCircle className="w-4 h-4" /> Intelligence Exchange
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
              <div className="py-24 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
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
                      <div className={`absolute left-[30px] top-10 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-[#020617] z-20 transition-all duration-500 hidden md:flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500 scale-125 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-800'
                      }`} />

                      <div className={`group bg-white dark:bg-slate-900/80 backdrop-blur-xl border-2 rounded-[2.5rem] transition-all duration-500 overflow-hidden ${
                        isCompleted ? 'border-emerald-500/20 shadow-emerald-500/5' : 'border-slate-200/50 dark:border-slate-800 shadow-xl'
                      } ${isExpanded ? 'shadow-2xl border-purple-500/30' : 'hover:-translate-y-1 hover:border-purple-500/30'}`}>
                        
                        <div className="p-8 md:p-10 cursor-pointer" onClick={() => toggleModule(mod.id)}>
                          <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${isCompleted ? 'ring-4 ring-emerald-500/20' : ''}`}>
                              {mod.thumbnailUrl ? (
                                <img src={mod.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                              ) : (
                                <span className="text-3xl font-black text-slate-300 dark:text-slate-700">{idx + 1}</span>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-purple-500 transition-colors">
                                  {mod.title}
                                </h3>
                                {isCompleted && (
                                  <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                                    <Award className="w-3 h-3" /> Mastered
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2">
                                {mod.description}
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                  {[1,2,3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  {mod.lectures?.length || 0} Sessions • Interactive
                                </span>
                              </div>
                            </div>
                            
                            <div className={`mt-4 md:mt-0 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                              <ChevronRight className="w-6 h-6 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-8 pb-10 md:px-10 space-y-6">
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                  {(!mod.lectures || mod.lectures.length === 0) ? (
                                    <p className="text-sm text-slate-400 italic font-medium">No sessions scheduled for this module yet.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {mod.lectures.map((lec, lIdx) => (
                                        <div key={lec.id} className="p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-transparent hover:border-purple-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all group/lec">
                                          <div className="flex justify-between items-start mb-4">
                                            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-black">
                                              {lIdx + 1}
                                            </span>
                                            <div className="flex gap-2">
                                              {lec.meetingLink && (
                                                <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                                                  <Video className="w-4 h-4" />
                                                </a>
                                              )}
                                              {lec.recordedLink && (
                                                <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                                                  <PlayCircle className="w-4 h-4" />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                          <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover/lec:text-purple-500 transition-colors">
                                            {lec.title}
                                          </h4>
                                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            {lec.meetingLink ? 'Live Interactive' : 'Recorded Session'}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
                                  {role === 'teacher' && (
                                    <button onClick={() => setShowLectureModal(mod.id)} className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all">
                                      <Plus className="w-4 h-4" /> Add Lecture
                                    </button>
                                  )}
                                  {role === 'student' && (
                                    <button 
                                      onClick={() => handleToggleComplete(mod.id)}
                                      className={`ml-auto flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                        isCompleted 
                                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 active:scale-95'
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

              {/* Resources Card */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Vault
                  </h3>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {resources.length} ITEMS
                  </span>
                </div>

                {resources.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium italic">Vault is currently empty.</p>
                ) : (
                  <div className="space-y-3">
                    {resources.map((res, i) => (
                      <motion.a 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={res.id} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-purple-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-purple-500 transition-colors">{res.title}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Asset</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </motion.a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
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
                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {showModuleModal && (
                  <form onSubmit={handleCreateModule} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Module Title</label>
                        <input required placeholder="E.g. Foundational Theory" value={mTitle} onChange={e=>setMTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mission Description</label>
                        <textarea required placeholder="What's the core objective?" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium border border-transparent focus:border-purple-500 transition-all resize-none" rows={3} />
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <label className="flex flex-col items-center gap-2 cursor-pointer">
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">{mThumbFile ? mThumbFile.name : 'Upload Thumbnail'}</span>
                          <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setMThumbFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-purple-600 text-white font-black rounded-[2rem] shadow-xl shadow-purple-600/20 hover:scale-[1.02] transition-all">
                      DEPLOY MODULE
                    </button>
                  </form>
                )}

                {showLectureModal && (
                  <form onSubmit={handleAddLecture} className="space-y-6">
                    <div className="space-y-4">
                      <input required placeholder="Session Title" value={lTitle} onChange={e=>setLTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-purple-500 transition-all" />
                      <input placeholder="Live Meeting Link (Optional)" type="url" value={lMeet} onChange={e=>setLMeet(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-blue-500 transition-all" />
                      <input placeholder="Recording Link (Optional)" type="url" value={lRec} onChange={e=>setLRec(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-rose-500 transition-all" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all">
                      SYNC SESSION
                    </button>
                  </form>
                )}

                {showResourceModal && (
                  <form onSubmit={handleCreateResource} className="space-y-6">
                    <div className="space-y-4">
                      <input required placeholder="Asset Title" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" />
                      <input required placeholder="Direct URL (Drive/Dropbox)" type="url" value={rUrl} onChange={e=>setRUrl(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-all">
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
