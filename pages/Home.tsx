import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import CurriculumSection from '../components/sections/CurriculumSection';
import CtaSection from '../components/sections/CtaSection';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowRight, BookOpen, Star } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { UserObject, Course } from '../types';

const Home: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) {
            const profile = { uid: docSnap.id, ...docSnap.data() } as UserObject;
            setUserProfile(profile);
            
            // Fetch courses based on preferences
            const coursesRef = collection(db, 'courses');
            const cSnap = await getDocs(coursesRef);
            let courses = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
            
            if (profile.preferences && profile.preferences.length > 0) {
              courses = courses.sort((a, b) => {
                const aMatch = profile.preferences!.some(p => a.title.toLowerCase().includes(p.toLowerCase()) || a.category === p);
                const bMatch = profile.preferences!.some(p => b.title.toLowerCase().includes(p.toLowerCase()) || b.category === p);
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
              });
            }
            setRecommendedCourses(courses.slice(0, 3));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useGSAP(() => {
    if (!loading && user && dashboardRef.current) {
      gsap.fromTo(dashboardRef.current.children, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading, user]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (user) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto" ref={dashboardRef}>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Welcome back, {userProfile?.name || user.displayName || 'Learner'}!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Ready to continue your educational journey? Explore your personalized dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-800/50">
              <BookOpen className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Discover Your Path</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Browse our entire catalog of traditional education and alternative skills.
              </p>
              <Link to="/courses" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                Browse All Courses <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Dashboard</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Track your enrollments, edit your profile, and manage your learning tools.
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors hover:bg-slate-800 dark:hover:bg-slate-100">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" /> Recommended For You
            </h2>
            <Link to="/courses" className="text-emerald-600 font-bold hover:underline">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.length === 0 ? (
               <p className="text-slate-500 col-span-3">No courses available. Set up your interests in the dashboard to see recommendations!</p>
            ) : (
               recommendedCourses.map(course => (
                 <Link key={course.id} to={`/courses/${course.id}`} className="block group">
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-2 group-hover:border-emerald-500">
                      <div className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        {course.category}
                      </div>
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                      )}

                      <h3 className="text-xl font-bold mb-4 group-hover:text-emerald-600 transition-colors">{course.title}</h3>
                   </div>
                 </Link>
               ))
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <CurriculumSection />
      <CtaSection />
    </div>
  );
};

export default Home;

