import React from 'react';
import { motion } from 'framer-motion';
import { ServerCrash, Users, Activity } from 'lucide-react';

const problems = [
  {
    icon: <ServerCrash className="w-8 h-8 text-rose-500" />,
    title: "Fragmented Infrastructure",
    description: "Schools rely on monolithic legacy software, creating extreme data silos, communication gaps, and security vulnerabilities."
  },
  {
    icon: <Users className="w-8 h-8 text-amber-500" />,
    title: "Retention Plummets",
    description: "Traditional analog models fail to effectively capture the dopamine loops necessary to engage digital-native students."
  },
  {
    icon: <Activity className="w-8 h-8 text-blue-500" />,
    title: "Analytics Blindspots",
    description: "Administrators and parents lack instant, data-driven analytics into student performance, forcing reactive rather than proactive guidance."
  }
];

const Card = ({ problem, index }: { problem: any, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-10 md:p-14 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl transition-all duration-500 group"
    >
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mb-8 ring-1 ring-slate-100 dark:ring-slate-700 group-hover:scale-110 transition-transform duration-500 shadow-sm">
        {problem.icon}
      </div>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{problem.title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg font-medium">
        {problem.description}
      </p>
    </motion.div>
  );
};

const ProblemSection: React.FC = () => {
  return (
    <section className="py-24 md:py-40 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-32 relative items-start">
          
          <div className="lg:w-5/12 lg:sticky top-40 z-20">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold tracking-widest uppercase text-xs mb-8 shadow-sm">
                The Disconnect
              </div>
              <h2 className="text-5xl lg:text-[4.5rem] font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.95]">
                Why Legacy <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Systems Fail</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-md leading-relaxed font-medium">
                Education architecture hasn't evolved alongside modern cloud frameworks. We've identified critical structural bottlenecks hindering scalable institutional growth.
              </p>
            </motion.div>
          </div>

          <div className="lg:w-7/12 flex flex-col gap-8 pb-10 z-10 w-full">
            {problems.map((problem, idx) => (
              <Card key={idx} problem={problem} index={idx} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
