
import React, { useEffect, useState } from 'react';
import { Mail, Phone, Instagram, MessageCircle, Send, Loader2 } from 'lucide-react';
import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { LINKS } from '../constants';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Contact: React.FC = () => {
 const [currentUser, setCurrentUser] = useState<any>(null);
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [message, setMessage] = useState('');
 const [sending, setSending] = useState(false);

 useEffect(() => {
 const unsub = onAuthStateChanged(auth, (u) => {
 setCurrentUser(u);
 if (u) {
 setName(u.displayName || '');
 setEmail(u.email || '');
 }
 });
 return () => unsub();
 }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentUser) {
  toast.error('Please log in to send a message');
  return;
  }
  if (!message.trim()) {
  toast.error('Please enter a message');
  return;
  }
  setSending(true);
  try {
  // Only insert chat message — never update user profile
  await db.from('contact_messages').insert({
  user_id: currentUser.uid,
  name: name.trim(),
  email: email.trim(),
  message: message.trim(),
  created_at: new Date().toISOString()
  });

  toast.success('Message sent!');
  setMessage('');
  } catch (e) {
  toast.error('Failed to send message');
  } finally {
  setSending(false);
  }
  };

 return (
 <div className="pt-32 pb-32 px-6 bg-slate-50 [#020617] min-h-screen relative overflow-hidden">
 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 /10 /10 rounded-full blur-[60px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
 <div className="max-w-[1400px] mx-auto relative z-10">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7 }}
 className="text-center mb-20"
 >
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase tracking-widest text-xs mb-8 shadow-sm">
 Get in Touch
 </div>
 <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">Let's Connect</h1>
 <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto">
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
 <div className="bg-white/90 /80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 /50 shadow-xl space-y-8">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 bg-emerald-50 /30 rounded-2xl flex items-center justify-center flex-shrink-0">
 <Mail className="w-6 h-6 text-emerald-600 " />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Email us</p>
 <p className="text-slate-900 font-bold break-all">info@edualttech.com</p>
 </div>
 </div>
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 bg-emerald-50 /30 rounded-2xl flex items-center justify-center flex-shrink-0">
 <Phone className="w-6 h-6 text-emerald-600 " />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Call us</p>
 <p className="text-slate-900 font-bold">+91 91215 05879</p>
 </div>
 </div>
 <hr className="border-slate-100 " />
 <div className="space-y-4">
 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connect with us</p>
 <div className="flex gap-4">
 <a href={LINKS.whatsapp} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors w-full justify-center">
 <MessageCircle className="w-5 h-5" /><span className="font-bold">WhatsApp</span>
 </a>
 <a href={LINKS.instagram} target="_blank" className="flex items-center gap-3 p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors w-full justify-center">
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
 <div className="bg-white/90 /80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] border border-slate-200/50 /50 shadow-2xl">
 {!currentUser ? (
 <div className="text-center py-12">
 <p className="text-slate-500 font-bold text-lg mb-2">Please log in to send a message</p>
 <p className="text-slate-400 text-sm">
 <a href="/login" className="text-emerald-500 underline">Login here</a> or create an account.
 </p>
 </div>
 ) : (
 <form className="space-y-6" onSubmit={handleSubmit}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
 className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-colors"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
 className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-colors"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
 <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help you?"
 className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-colors h-40 resize-none"
 />
 </div>
 <button
 type="submit"
 disabled={sending || !message.trim()}
 className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 :bg-emerald-500 transition-colors shadow-xl flex items-center justify-center gap-2 text-lg disabled:opacity-50"
 >
 {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
 {sending ? 'Sending...' : 'Send Message'}
 </button>
 </form>
 )}
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 );
};

export default Contact;
