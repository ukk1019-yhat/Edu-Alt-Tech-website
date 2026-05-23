
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LINKS } from '../constants';
import { CheckCircle2, Loader2, ArrowRight, Home, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Enroll: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Google Apps Script Web App URL for enrollment tracking
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTwWclKSEHufZYCteDWd2IE9oLMuTBMcEeu7s7V8iAFyuX4JmJMP-EsQetgxkcca6Yzg/exec';

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires no-cors for simple POST
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setIsSubmitting(false);
      setIsDone(true);

      // Delay opening the form to ensure user sees the "Step 1 Complete" message
      setTimeout(() => {
        window.open(LINKS.enroll, '_blank');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('There was an error submitting your enrollment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="pt-32 pb-24 px-6 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full text-center space-y-8 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Step 1 Complete!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-xl font-medium leading-relaxed max-w-md mx-auto">
              We've opened the final enrollment form in a new tab. Please complete it to finalize your application.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <a href={LINKS.enroll} target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-5 bg-slate-900 dark:bg-emerald-600 text-white font-black rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              Didn't open? Click here <ExternalLink className="w-4 h-4" />
            </a>
            <Link to="/" className="w-full sm:w-auto px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-[0.95] tracking-tighter">
            Start Your Alternative Learning Journey
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed">
            Take the first step towards a structured, accountability-driven education. Join a community of doers and bridge the execution gap.
          </p>
          <div className="space-y-6">
            {["Join a peer-driven ecosystem","Access structured weekly plans","Get mentored by execution experts","Connect with driven students"].map(item => (
              <div key={item} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#90EE90] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-slate-900" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-950 border border-slate-200/50 dark:border-slate-800/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input type="text" required placeholder="Enter your full name"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input type="email" required placeholder="name@example.com"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input type="tel" required placeholder="+91 XXXXX XXXXX"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
                  value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Main Goal in Learning</label>
                <textarea required placeholder="What is your biggest execution hurdle?"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all h-32 resize-none"
                  value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 group text-lg"
            >
              {isSubmitting ? (<><Loader2 className="w-6 h-6 animate-spin" />Processing...</>) : (<>Proceed to Enrollment <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>)}
            </button>
            <p className="text-center text-xs text-slate-400">By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Enroll;
