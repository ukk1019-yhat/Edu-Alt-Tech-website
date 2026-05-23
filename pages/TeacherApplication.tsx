import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Course, TeacherApplication as TeacherAppType } from '../types';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const TeacherApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [experience, setExperience] = useState<string>(''); // Years of experience
  const [skills, setSkills] = useState('');
  const [proposedPath, setProposedPath] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCourse = async (currentUser: FirebaseUser | null) => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }
      } catch (err) {
        console.error("Failed to load course", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login');
      } else {
        fetchCourse(currentUser);
      }
    });

    return () => unsubscribe();
  }, [courseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;
    
    setSubmitLoading(true);
    try {
      const appRef = doc(collection(db, 'teacher_applications'));
      const application: TeacherAppType = {
        id: appRef.id,
        userId: user.uid,
        userName: user.displayName || 'Teacher',
        userEmail: user.email || '',
        courseId: courseId,
        status: 'pending',
        experience,
        skills,
        message,
        proposedPath: proposedPath.split('\n').map(s => s.trim()).filter(s => s.length > 0),
        appliedAt: serverTimestamp()
      };
      // Validate experience is numeric
      const yearsExp = parseInt(experience);
      if (isNaN(yearsExp) || yearsExp < 0) {
        toast.error("Please enter a valid number of years for experience");
        setSubmitLoading(false);
        return;
      }

      await setDoc(appRef, {
        ...application,
        experience: yearsExp, // Store as number
      } as any);

      toast.success("Application submitted successfully! The admin will review and schedule an appointment with you.");
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
  }

  if (!courseId || !course) {
    return (
      <div className="min-h-screen pt-32 text-center text-slate-500">
        <p>Invalid course context.</p>
        <Link to="/courses" className="text-emerald-600 hover:underline mt-4 inline-block">Browse Courses</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto relative z-10"
      >
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-950 border border-slate-200/50 dark:border-slate-800/50">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Apply to Teach</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800 font-medium">
            You are applying to teach: <strong className="text-slate-900 dark:text-white">{course.title}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your Information</label>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white">{user?.displayName || 'Teacher'}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preferred Appointment Scenario</label>
              <p className="text-sm text-slate-500 mb-4">We will try to schedule an introductory call based on your preference, but the final time and meeting link will be sent by the admin.</p>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="date" 
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Years of Experience</label>
              <input 
                type="number"
                min="0"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5"
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Talents & Skills</label>
              <textarea 
                rows={2}
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="What makes you uniquely qualified to teach this course?"
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Proposed Curriculum Path</label>
              <p className="text-sm text-slate-500 mb-4">List the lectures/modules you intend to cover. Put each module on a new line.</p>
              <textarea 
                rows={4}
                required
                value={proposedPath}
                onChange={(e) => setProposedPath(e.target.value)}
                placeholder="Lecture 1: Intro to Basics&#10;Lecture 2: Core Concepts&#10;Lecture 3: Advanced Methods"
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Additional Message (Optional)</label>
              <textarea 
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any preferred scheduling times or additional info..."
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={submitLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherApplication;
