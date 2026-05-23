import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Rocket, Zap } from 'lucide-react';

const VisionSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full mb-8 shadow-inner"
          >
            <Lightbulb className="w-8 h-8" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight"
          >
            Building India's First <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">
              Curriculum-Driven School OS
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12"
          >
            We believe that software should adapt to the way you teach, not the other way around. 
            By integrating directly with national and state curriculums, leveraging AI for personalized insights, 
            and prioritizing human-centric design, Edu Alt Tech is shaping the future of education.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
              <Rocket className="w-5 h-5 text-blue-500" /> Constant Innovation
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
              <Zap className="w-5 h-5 text-amber-500" /> AI-Powered Analytics
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
