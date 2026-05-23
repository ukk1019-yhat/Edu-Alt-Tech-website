import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Layers, Target, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
} as const;

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
} as const;

const scaleItem = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 50, damping: 15 } }
} as const;

const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-[95vh] flex flex-col justify-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-20 pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Main Hero Block (Asymmetrical Left) */}
          <motion.div variants={item} className="lg:col-span-7 flex flex-col justify-center bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-10 md:p-16 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/10 to-indigo-500/10 dark:from-emerald-900/10 dark:to-indigo-900/10 rounded-full blur-[80px] -mt-40 -mr-40 pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold mb-8 w-max relative z-10 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Premium Education Architecture</span>
            </div>
            
            <h1 className="text-5xl md:text-[5rem] lg:text-[5.5rem] font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.95] relative z-10">
              Future-Proofed
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500">
                Ecosystems
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-xl leading-relaxed relative z-10 font-medium">
              Bridging the execution gap. We build curriculum-driven platforms, beautiful interfaces, and alternative skill pathways for the modern digital learner.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Link to="/courses" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 group">
                Explore Courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="px-8 py-4 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md backdrop-blur-lg">
                Partner with us
              </Link>
            </div>
          </motion.div>
          
          {/* Bento Box Stack (Right) */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-6 lg:gap-8 min-h-[400px] lg:min-h-[600px]">
            
            {/* Top Interactive Metric Card */}
            <motion.div variants={scaleItem} className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl shadow-indigo-600/20 group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50 MIX-BLEND-OVERLAY pointer-events-none" />
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000 ease-out" />
              <div className="flex justify-between items-start text-white relative z-10">
                <Target className="w-10 h-10 opacity-80" />
                <span className="font-extrabold text-4xl tracking-tight">98%</span>
              </div>
              <div className="mt-8 text-white relative z-10">
                <p className="font-bold text-2xl mb-2 tracking-tight">Completion Rate</p>
                <p className="opacity-80 text-sm font-medium leading-relaxed max-w-[250px]">Industry-leading student retention metrics across all curriculum paths.</p>
              </div>
            </motion.div>

            {/* Bottom Split Bento */}
            <div className="grid grid-cols-2 gap-6 lg:gap-8">
              <motion.div variants={scaleItem} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 ring-4 ring-emerald-50 dark:ring-emerald-900/10">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <p className="font-bold text-slate-900 dark:text-white tracking-tight">Active<br/>Engagements</p>
              </motion.div>
              
              <motion.div variants={scaleItem} className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Layers className="w-10 h-10 text-indigo-400 mb-5 relative z-10" />
                <p className="font-black text-2xl text-white mb-1 relative z-10 tracking-tight">+150</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Mastery Hrs</p>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
