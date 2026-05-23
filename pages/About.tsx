import React from 'react';
import { Target, Users, BookOpen, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const values = [
  { icon: <Target className="w-8 h-8" />, title: 'Focused Goals', desc: 'Targeted learning pathways designed for real-world impact and academic excellence.', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10', border: 'border-emerald-100 dark:border-emerald-800/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { icon: <Users className="w-8 h-8" />, title: 'Community', desc: 'Collaborative learning spaces that foster peer-to-peer education and global networking.', bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10', border: 'border-blue-100 dark:border-blue-800/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  { icon: <BookOpen className="w-8 h-8" />, title: 'Modern Curriculum', desc: 'Constantly updating our resources to provide up-to-date technological and alternative skills.', bg: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10', border: 'border-purple-100 dark:border-purple-800/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  { icon: <Rocket className="w-8 h-8" />, title: 'Innovation', desc: 'Pushing the boundaries of what an educational platform can do, driven by AI and analytics.', bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10', border: 'border-amber-100 dark:border-amber-800/30', iconColor: 'text-amber-600 dark:text-amber-400' },
];

const About: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#020617] min-h-screen pt-32 pb-32 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-28"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mb-10 shadow-sm">
            Our Story
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]">
            Our Mission at <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">EduAltTech</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            We believe that education must evolve. Our platform is dedicated to blending traditional academics with essential modern skills, empowering the next generation to thrive.
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-28">
          {values.map((v, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className={`p-10 rounded-[2.5rem] bg-gradient-to-br ${v.bg} border ${v.border} hover:-translate-y-2 hover:shadow-xl transition-all duration-500`}
            >
              <div className={`mb-8 ${v.iconColor}`}>{v.icon}</div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{v.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-14 lg:p-24 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 relative z-10 tracking-tighter">Ready to Join the Revolution?</h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto relative z-10 font-medium">Start your journey today and unlock access to an entirely new way of learning.</p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link to="/signup" className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-1">
              Get Started Free
            </Link>
            <Link to="/courses" className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold transition-all backdrop-blur-sm hover:-translate-y-1">
              Explore Courses
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
