
import React from 'react';
import { Mail, Phone, Instagram, MessageCircle, Send } from 'lucide-react';
import { LINKS } from '../constants';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
  return (
    <div className="pt-32 pb-32 px-6 bg-slate-50 dark:bg-[#020617] min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="max-w-[1400px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
            Get in Touch
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[0.95]">Let's Connect</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-xl mx-auto">
            Have questions about our peer-driven ecosystem? We're here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Email us</p>
                  <p className="text-slate-900 dark:text-white font-bold break-all">ukkukk97@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Call us</p>
                  <p className="text-slate-900 dark:text-white font-bold">+91 91215 05879</p>
                </div>
              </div>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connect with us</p>
                <div className="flex gap-4">
                  <a href={LINKS.whatsapp} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors w-full justify-center">
                    <MessageCircle className="w-5 h-5" /><span className="font-bold">WhatsApp</span>
                  </a>
                  <a href={LINKS.instagram} target="_blank" className="flex items-center gap-3 p-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-slate-800 transition-colors w-full justify-center">
                    <Instagram className="w-5 h-5" /><span className="font-bold">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="lg:col-span-8"
          >
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
              <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                    <input type="text" placeholder="Your name"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input type="email" placeholder="name@example.com"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</label>
                  <textarea placeholder="How can we help you?"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] outline-none transition-all h-40 resize-none"
                  />
                </div>
                <button className="w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-xl flex items-center justify-center gap-2 text-lg">
                  Send Message <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
