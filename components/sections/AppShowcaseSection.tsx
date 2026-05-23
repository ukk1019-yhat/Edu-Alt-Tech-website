import React from 'react';
import { motion } from 'framer-motion';
import { Download, Play } from 'lucide-react';

const AppShowcaseSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/40 via-transparent to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 font-semibold text-sm mb-6">
              Coming Soon to Play Store
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              The Entire School <br/> in Your Pocket
            </h2>
            <p className="text-lg text-slate-300 mb-10 leading-relaxed">
              Experience the power of the Edu Alt Tech ecosystem on the go. Our native mobile applications provide students and parents with instant access to grades, timetables, and notifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors opacity-50 cursor-not-allowed">
                <Play className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] uppercase">Get it on</div>
                  <div className="text-lg">Google Play</div>
                </div>
              </button>
              <button className="flex items-center justify-center gap-3 bg-slate-800 text-white px-6 py-4 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-colors opacity-50 cursor-not-allowed">
                <Download className="w-6 h-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] uppercase">Download on the</div>
                  <div className="text-lg">App Store</div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Phone mockups */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex justify-center lg:justify-end gap-6 relative h-[500px]"
          >
            {/* Phone 1 */}
            <div className="relative w-64 h-[500px] bg-slate-800 rounded-[3rem] border-8 border-slate-700 shadow-2xl overflow-hidden -rotate-6 transform translate-y-8 z-10 glass">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-700 rounded-b-3xl mx-auto w-1/3 z-20" />
              <div className="p-4 pt-10 h-full bg-slate-900 border border-slate-800 animate-pulse">
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20" />
                  <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-slate-800 rounded-2xl" />
                  <div className="h-20 bg-slate-800 rounded-2xl" />
                  <div className="h-20 bg-slate-800 rounded-2xl" />
                </div>
              </div>
            </div>

            {/* Phone 2 */}
            <div className="relative w-64 h-[500px] bg-slate-800 rounded-[3rem] border-8 border-slate-700 shadow-2xl overflow-hidden rotate-6 transform -translate-y-8 z-20 glass">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-700 rounded-b-3xl mx-auto w-1/3 z-20" />
              <div className="p-4 pt-10 h-full bg-indigo-950 border border-indigo-900 animate-pulse">
                <div className="h-4 bg-indigo-800 rounded w-1/3 mx-auto mb-6" />
                <div className="flex gap-2 mb-6">
                  <div className="h-24 bg-emerald-500/20 rounded-2xl w-1/2" />
                  <div className="h-24 bg-rose-500/20 rounded-2xl w-1/2" />
                </div>
                <div className="space-y-3">
                  <div className="h-12 bg-indigo-900 rounded-xl" />
                  <div className="h-12 bg-indigo-900 rounded-xl" />
                  <div className="h-12 bg-indigo-900 rounded-xl" />
                  <div className="h-12 bg-indigo-900 rounded-xl" />
                </div>
              </div>
            </div>
            
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AppShowcaseSection;
