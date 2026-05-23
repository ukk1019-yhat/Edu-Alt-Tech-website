import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock } from 'lucide-react';

const stats = [
  { icon: TrendingUp, value: '45%', label: 'Increase in Engagement' },
  { icon: Clock, value: '12hrs', label: 'Admin Time Saved/Week' },
  { icon: Users, value: '98%', label: 'Parent Satisfaction' }
];

const CaseStudySection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-slate-800/50 border border-slate-700/50 p-8 md:p-12 glass"
          >
            <h3 className="text-slate-400 font-semibold uppercase tracking-widest text-sm mb-4">Case Study</h3>
            <h4 className="text-3xl font-bold mb-6">"Helping schools improve student tracking and engagement"</h4>
            <p className="text-slate-300 leading-relaxed mb-8">
              "Before Edu Alt Tech, we relied on disconnected WhatsApp groups, paper diaries, and manual Excel sheets. We had no real-time transparency into how our students were actually performing.
              <br/><br/>
              After implementing the School OS, our completely digitized workflow allowed teachers to focus on teaching rather than administrative paperwork. The parents love the mobile app!"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-700" />
              <div>
                <p className="font-bold">Dr. Sharma</p>
                <p className="text-sm text-slate-400">Principal, Modern High School</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-12">The Impact</h2>
            
            <div className="space-y-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                      {stat.value}
                    </h3>
                    <p className="text-slate-400 text-lg">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
