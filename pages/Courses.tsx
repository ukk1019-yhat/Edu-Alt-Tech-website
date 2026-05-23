import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';
import { Search, Book, Palette, ArrowRight, Compass, Filter, Sparkles, GraduationCap, Globe, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'education' | 'alternative'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || course.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 70, damping: 15 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  } as const;

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] selection:bg-emerald-500/30">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-12"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black tracking-[0.2em] uppercase mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Curriculum Discovery
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.85]">
              Redefining <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500">Learning</span> Pathways.
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-xl">
              Curated architectural frameworks for modern execution. Bridge the gap between theory and real-world mastery.
            </p>
          </div>

          <div className="w-full lg:w-[450px] space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filter by keyword..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-6 bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl shadow-slate-200/50 dark:shadow-none dark:text-white transition-all text-lg font-bold placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-6 text-slate-400">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global Taxonomy Filter</span>
            </div>
          </div>
        </motion.div>

        {/* Bento Filtering Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20"
        >
          {[
            { id: 'all', label: 'Global Directory', icon: Globe, desc: 'Complete access to all orchestrated programs.' },
            { id: 'education', label: 'Core Curricula', icon: GraduationCap, desc: 'Academic foundations and certified standards.' },
            { id: 'alternative', label: 'Strategic Skills', icon: ShieldCheck, desc: 'High-leverage alternative execution frameworks.' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`p-8 rounded-[2.5rem] text-left transition-all duration-500 border group relative overflow-hidden ${
                activeFilter === filter.id 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-2xl scale-[1.02]' 
                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${
                activeFilter === filter.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500'
              }`}>
                <filter.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2 uppercase">{filter.label}</h3>
              <p className={`text-xs font-medium leading-relaxed ${activeFilter === filter.id ? 'opacity-70' : 'opacity-50'}`}>
                {filter.desc}
              </p>
              {activeFilter === filter.id && (
                <motion.div layoutId="activeGlow" className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
              )}
            </button>
          ))}
        </motion.div>

        {/* Asymmetrical Course Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-12 h-12 text-emerald-500" />
            </motion.div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Directory...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10"
          >
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, idx) => (
                <motion.div 
                  layout
                  variants={cardVariants}
                  key={course.id} 
                  className={`group bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] transition-all duration-700 flex flex-col h-full transform ${
                    idx % 4 === 0 ? 'md:col-span-2 xl:col-span-2' : ''
                  }`}
                >
                  <div className={`flex flex-col ${idx % 4 === 0 ? 'md:flex-row' : 'flex-col'} h-full`}>
                    {/* Media Container */}
                    <div className={`relative overflow-hidden flex-shrink-0 ${
                      idx % 4 === 0 ? 'md:w-[45%] h-72 md:h-auto' : 'h-72 w-full'
                    } bg-slate-100 dark:bg-slate-800`}>
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt="" 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <Book className="w-20 h-20" />
                        </div>
                      )}
                      <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50">
                        {course.category}
                      </div>
                    </div>

                    {/* Content Container */}
                    <div className="p-10 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed line-clamp-3">
                          {course.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tuition Fee</span>
                          <span className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter">
                            {course.price === 0 || !course.price ? 'Free' : `₹${course.price}`}
                          </span>
                        </div>
                        <Link 
                          to={`/courses/${course.id}`} 
                          className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-xl shadow-slate-900/10 dark:shadow-none active:scale-95 group/btn"
                        >
                          Explore <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">System Empty.</h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 font-medium leading-relaxed">No curricula matches your current search parameters.</p>
            <button 
              onClick={() => {setSearchTerm(''); setActiveFilter('all');}} 
              className="px-10 py-5 bg-emerald-500 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:-translate-y-1 transition-all"
            >
              Reset Protocols
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Courses;
