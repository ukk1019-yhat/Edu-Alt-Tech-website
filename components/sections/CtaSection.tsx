import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[3rem] p-14 md:p-24 text-center overflow-hidden shadow-2xl shadow-emerald-500/20"
        >
          {/* Layered Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-conic from-emerald-500/20 via-transparent to-indigo-500/20 rounded-full pointer-events-none"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold mb-10 border border-white/20 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Transform Your Institution</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]"
            >
              Ready to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Level Up?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/70 text-xl md:text-2xl font-medium mb-14 max-w-2xl mx-auto leading-relaxed"
            >
              Join forward-thinking institutions that have already unlocked the full power of the Edu Alt Tech operating system.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 bg-white text-slate-900 hover:bg-emerald-50 px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 group"
              >
                Book a Free Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur text-white hover:bg-white/20 px-10 py-5 rounded-2xl font-bold text-lg transition-all border border-white/20 hover:-translate-y-1"
              >
                <Zap className="w-5 h-5 text-yellow-300" />
                Explore Courses
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
