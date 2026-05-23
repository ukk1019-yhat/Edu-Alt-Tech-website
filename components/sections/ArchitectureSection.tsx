import React from 'react';
import { motion } from 'framer-motion';
import { Server, Smartphone, MonitorSmartphone, Shield, ArrowRight } from 'lucide-react';

const flows = [
  { icon: Smartphone, label: 'Student App', connection: 'Backend API', destIcon: Server },
  { icon: MonitorSmartphone, label: 'Teacher Panel', connection: 'Analytics Engine', destIcon: Server },
  { icon: Shield, label: 'Admin Dashboard', connection: 'Full System Control', destIcon: Server },
];

const ArchitectureSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-blue-500 font-semibold tracking-wide uppercase text-sm mb-3">Enterprise-Grade</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Robust Architecture</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Secure, scalable, and built on an interconnected system designed for high availability.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-6">
            {flows.map((flow, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50"
              >
                {/* Source */}
                <div className="flex flex-col border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 w-48 py-6 rounded-xl items-center justify-center shadow-inner">
                  <flow.icon className="w-8 h-8 text-indigo-500 mb-3" />
                  <span className="font-bold text-slate-900 dark:text-white">{flow.label}</span>
                </div>

                {/* Connection */}
                <div className="flex-1 flex items-center justify-center relative py-8 sm:py-0 w-full sm:w-auto">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dashed bg-slate-200 dark:bg-slate-700 -translate-y-1/2 sm:block hidden" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dashed bg-slate-200 dark:bg-slate-700 -translate-x-1/2 sm:hidden block" />
                  
                  <div className="relative z-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800/50 text-sm font-semibold flex items-center gap-2">
                    {flow.connection}
                    <ArrowRight className="w-4 h-4 hidden sm:block" />
                  </div>
                </div>

                {/* Destination */}
                <div className="flex flex-col border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 w-48 py-6 rounded-xl items-center justify-center shadow-inner">
                  <flow.destIcon className="w-8 h-8 text-emerald-500 mb-3" />
                  <span className="font-bold text-slate-900 dark:text-white text-center px-2">Centralized Database</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
