import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Clock, CheckCircle, Bell, FileText, CheckSquare, MessageSquare, GraduationCap } from 'lucide-react';

const tabs = ['Students', 'Teachers', 'Parents'] as const;

const featuresData = {
  Students: [
    { icon: <Calendar className="w-6 h-6" />, title: 'Timetable & Reminders', desc: 'Stay ahead of every class and deadline with intelligent auto-scheduling.' },
    { icon: <BookOpen className="w-6 h-6" />, title: 'Homework Tracking', desc: 'Access, submit, and manage assignments digitally from any device.' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Performance Insights', desc: 'Real-time analytics surfacing your strengths, gaps, and growth trajectory.' },
  ],
  Teachers: [
    { icon: <CheckSquare className="w-6 h-6" />, title: 'Attendance Management', desc: 'One-click attendance tracking synced instantly to the institution dashboard.' },
    { icon: <FileText className="w-6 h-6" />, title: 'Assignment Uploads', desc: 'Distribute, collect, and grade homework efficiently with no paperwork.' },
    { icon: <GraduationCap className="w-6 h-6" />, title: 'Progress Tracking', desc: 'Monitor individual student learning outcomes seamlessly over time.' },
  ],
  Parents: [
    { icon: <Clock className="w-6 h-6" />, title: 'Real-Time Updates', desc: 'Know exactly what your child is learning, when, and how well.' },
    { icon: <Bell className="w-6 h-6" />, title: 'Instant Notifications', desc: 'Instant alerts for absences, low performance, or praise.' },
    { icon: <MessageSquare className="w-6 h-6" />, title: 'Student Reports', desc: 'Detailed monthly performance deep-dives on a single dashboard.' },
  ],
};

const tabColors: Record<typeof tabs[number], string> = {
  Students: 'from-emerald-500 to-teal-500',
  Teachers: 'from-indigo-500 to-blue-500',
  Parents: 'from-rose-500 to-orange-500',
};

const tabBg: Record<typeof tabs[number], string> = {
  Students: 'bg-emerald-500',
  Teachers: 'bg-indigo-500',
  Parents: 'bg-rose-500',
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
} as const;

const FeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Students');

  return (
    <section className="py-24 md:py-40 bg-white dark:bg-[#020617] transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
            Empowering Everyone
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.95]">
            Built for the <span className={`text-transparent bg-clip-text bg-gradient-to-r ${tabColors[activeTab]} transition-all duration-500`}>Entire Ecosystem</span>
          </h2>
        </motion.div>

        <div className="flex flex-col items-center">
          {/* Premium Tab Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex p-2 bg-slate-100 dark:bg-slate-900 rounded-[2rem] mb-20 shadow-inner border border-slate-200/50 dark:border-slate-800/50 max-w-full overflow-x-auto no-scrollbar"
          >
            <div className="flex min-w-max md:min-w-0 md:w-full justify-center">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 md:px-8 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 z-10 ${
                    activeTab === tab ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div layoutId="tab-bg" className={`absolute inset-0 ${tabBg[activeTab]} rounded-[1.5rem] -z-10`} />
                  )}
                  {tab}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cards with AnimatePresence */}
          <div className="w-full max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10"
              >
                {featuresData[activeTab].map((feat, idx) => (
                  <motion.div
                    key={`${activeTab}-${idx}`}
                    custom={idx}
                    variants={cardVariants}
                    className="group bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${tabColors[activeTab]} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-[2.5rem]`} />
                    <div className={`w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:${tabBg[activeTab]} group-hover:text-white transition-all duration-500 shadow-sm relative z-10`}>
                      {feat.icon}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight relative z-10">{feat.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg font-medium relative z-10">{feat.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
