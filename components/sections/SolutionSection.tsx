import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Smartphone, MonitorDot, TabletSmartphone, BarChart3, Zap } from 'lucide-react';

const solutions = [
  { icon: <Globe className="w-5 h-5 text-emerald-500" />, title: "Headless CMS Web App", desc: "Decoupled architecture for instant load times." },
  { icon: <Smartphone className="w-5 h-5 text-emerald-500" />, title: "Native Student App", desc: "iOS/Android unified codebase for max engagement." },
  { icon: <MonitorDot className="w-5 h-5 text-emerald-500" />, title: "Teacher OS Dashboard", desc: "Real-time moderation and grading workflow." },
  { icon: <TabletSmartphone className="w-5 h-5 text-emerald-500" />, title: "Parent Guardian Portal", desc: "Live analytics on student health & progress." },
  { icon: <BarChart3 className="w-5 h-5 text-emerald-500" />, title: "SuperAdmin Analytics", desc: "Macro-level insights across the entire network." },
];

const SolutionSection: React.FC = () => {
  return (
    <section id="solutions" className="py-24 md:py-40 bg-white dark:bg-[#020617] transition-colors duration-300 relative overflow-hidden">
      {/* Premium Deep Ambient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase text-xs mb-8 shadow-sm w-max">
              <Zap className="w-4 h-4" />
              Unified Solution
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-[1.05] tracking-tight">
              The Ultimate <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Operating System</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed font-medium">
              We unify fragmented school processes into one synchronized digital ecosystem. A single platform that connects students, teachers, parents, and administrators effortlessly.
            </p>
            
            <ul className="space-y-4">
              {solutions.map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * idx, duration: 0.5 }}
                  className="flex items-center gap-6 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/5 ring-1 ring-slate-100 dark:ring-slate-800 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Abstract OS Visualization (Premium execution) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="lg:col-span-7 relative h-[700px] w-full hidden lg:flex items-center justify-center perspective-[1200px]"
          >
            {/* Core Node */}
            <div className="absolute w-56 h-56 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30 z-30 ring-8 ring-white/50 dark:ring-slate-900/50 transform rotate-12 hover:rotate-0 transition-transform duration-700">
              <div className="text-center text-white">
                <Globe className="w-16 h-16 mx-auto mb-3 opacity-90" />
                <span className="font-black tracking-widest text-lg">CORE OS</span>
              </div>
            </div>

            {/* Orbital Rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} className="absolute w-[500px] h-[500px] border-[2px] border-dashed border-emerald-300/40 dark:border-emerald-700/40 rounded-full z-10" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, ease: "linear", repeat: Infinity }} className="absolute w-[700px] h-[700px] border border-slate-200 dark:border-slate-800 rounded-full z-0" />
            
            {/* Floating Satellites with Premium Glassmorphism */}
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[10%] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/10 z-40">
              <Smartphone className="w-10 h-10 text-indigo-500 mb-3" />
              <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Parent Portal</p>
              <div className="mt-3 flex gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/><div className="w-10 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"/></div>
            </motion.div>
            
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1, ease: "easeInOut" }} className="absolute bottom-[15%] right-[10%] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-teal-500/10 z-40">
              <MonitorDot className="w-10 h-10 text-teal-500 mb-3" />
              <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Teacher Dash</p>
              <div className="mt-3 flex gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/><div className="w-10 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"/></div>
            </motion.div>

            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 7, repeat: Infinity, delay: 2, ease: "easeInOut" }} className="absolute top-[30%] right-[0%] bg-slate-900 dark:bg-white p-6 rounded-3xl shadow-2xl z-40">
              <BarChart3 className="w-10 h-10 text-rose-400 dark:text-rose-500 mb-3" />
              <p className="font-bold text-sm text-white dark:text-slate-900 tracking-tight">Admin Master</p>
              <div className="mt-3 flex gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><div className="w-10 h-2 bg-slate-700 dark:bg-slate-200 rounded-full"/></div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
