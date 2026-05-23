import React from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, ArrowRight, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const PeerEducation: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 bg-slate
    -50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold mb-6"
          >
            <Users className="w-4 h-4" /> Alternative Learning Model
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight"
          >
            Peer-to-Peer <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Education</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            Step outside the traditional classroom. We connect passionate mentors with driven learners to create a collaborative, execution-focused ecosystem.
          </motion.p>
        </div>

        {/* Dual Paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          
          {/* Student Path */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300 flex flex-col"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-8">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Learn as a Student</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow leading-relaxed">
              If you lack discipline or struggle with traditional curriculums, join as a learner. Get matched with peer-mentors, access structured Weekly Plans, and bridge your execution gap through accountability.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Real-time peer accountability
              </li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> AI-generated structured roadmaps
              </li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Focus on deep execution
              </li>
            </ul>
            <Link 
              to="/enroll/student"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/30"
            >
              Enroll as a Student <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Teacher Path */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300 flex flex-col"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-8">
              <GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Join as a Teacher</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 flex-grow leading-relaxed">
              Share your expertise in a modern format. Whether you teach coding, languages, or core sciences, become a peer-mentor and monetize your skills while guiding students to absolute success.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Flexible, modern curriculum integration
              </li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Analytics dashboard to track student ROI
              </li>
              <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Grow your personal educator brand
              </li>
            </ul>
            <Link 
              to="/enroll/teacher"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/30"
            >
              Enroll as a Teacher <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default PeerEducation;
