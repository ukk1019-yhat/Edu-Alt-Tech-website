import React from 'react';
import { motion } from 'framer-motion';
import { Network, Database, BrainCircuit, Target } from 'lucide-react';

const bars = [
  { label: 'Chapter 1 Mastery', width: 100 },
  { label: 'Chapter 2 Mastery', width: 85 },
  { label: 'Chapter 3 Mastery', width: 90 },
  { label: 'Chapter 4 Mastery', width: 75 },
];

const features = [
  { icon: <Database className="w-6 h-6" />, color: 'text-blue-500', hoverBg: 'hover:bg-blue-500', title: 'Cross-Board Support', desc: 'Seamlessly load content designed for your specific regional or national board.' },
  { icon: <Network className="w-6 h-6" />, color: 'text-teal-500', hoverBg: 'hover:bg-teal-500', title: 'Chapter-Wise Tracking', desc: 'Microscopic visibility into each student\'s progress module by module.' },
  { icon: <BrainCircuit className="w-6 h-6" />, color: 'text-indigo-500', hoverBg: 'hover:bg-indigo-500', title: 'Personalized Paths', desc: 'AI-driven interventions for areas where students need the most support.' },
];

const CurriculumSection: React.FC = () => {
  return (
    <section className="py-24 md:py-40 bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

          {/* Left: Animated progress card */}
          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-[3rem] -rotate-3 blur-sm" />
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] border border-white/50 dark:border-slate-700/50 shadow-2xl p-10 z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Learning Outcomes</h4>
                    <p className="text-sm text-slate-400 font-medium">Real-time mastery tracking</p>
                  </div>
                </div>

                <div className="space-y-7">
                  {bars.map((bar, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>{bar.label}</span>
                        <span className="text-blue-600 dark:text-blue-400">{bar.width}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
              Adaptive Learning
            </div>

            <h2 className="text-5xl lg:text-[4.5rem] font-black text-slate-900 dark:text-white mb-8 leading-[0.95] tracking-tighter">
              Curriculum-Driven <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">Intelligence</span>
            </h2>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-14 leading-relaxed font-medium">
              We seamlessly integrate with CBSE, ICSE, State Boards, or custom curriculums. Track chapter-wise progress, map learning outcomes, and provide personalized learning paths.
            </p>

            <div className="space-y-8">
              {features.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  className="flex gap-6 items-start group"
                >
                  <div className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl ${feat.color} shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 ${feat.hoverBg} group-hover:text-white transition-all duration-300 flex-shrink-0`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-xl mb-2 tracking-tight">{feat.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
