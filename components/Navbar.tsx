import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as LucideUser } from 'lucide-react';
import { auth, db, onAuthStateChanged, doc, getDoc } from '../lib/firebase';
import type { User as FirebaseUser } from '../lib/firebase';
import { UserObject } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) setUserProfile(docSnap.data() as UserObject);
        } catch (e) { console.error(e); }
      } else setUserProfile(null);
    });
    return () => unsubscribe();
  }, []);

  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Practice', path: '/practice' },
    { name: 'Resources', path: '/resources' },
    { name: 'Courses', path: '/courses' },
    { name: 'Contact', path: '/contact' },
  ];

  const studentLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Practice', path: '/practice' },
    { name: 'Resources', path: '/resources' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Admin Portal', path: '/admin' }
  ];

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'ukkukk97@gmail.com' || user?.email === 'umakrishnakanthchokkapu15@gmail.com' || user?.email === 'akulasatyanarayana2006@gmail.com';
  let navLinks = publicLinks;
  if (isAdmin) navLinks = adminLinks;
  else if (user) navLinks = studentLinks;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

 return (
  <>
  <motion.nav
  initial={{ y: -80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
  className={`fixed w-full z-50 transition-colors duration-300 ${
  isScrolled
  ? 'bg-bg-secondary/80 backdrop-blur-2xl border-b border-border/60 shadow-xl shadow-border/5 py-3'
  : 'bg-transparent py-5'
  }`}
  >
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
  <div className="flex items-center justify-between">
  <Link to="/" className="flex items-center gap-2 group">
  <div className="w-12 h-12 flex items-center justify-center transform group-hover:scale-105 transition-transform overflow-hidden rounded-xl">
  <img src="/logo.png" loading="lazy" decoding="async" alt="EduAltTech Logo" className="w-full h-full object-cover"
  onError={(e) => {
  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100"/><text fill="%23999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">LOGO</text></svg>';
  }}
  />
  </div>
  <div>
  <span className="text-lg font-bold text-heading tracking-tight leading-tight block">EduAltTech</span>
  <span className="text-[10px] font-semibold text-emerald-600 tracking-widest uppercase leading-tight hidden sm:block">Education Technology Partner</span>
  </div>
  </Link>
 
  <div className="hidden md:flex items-center gap-8">
  <div className="flex items-center gap-6">
  {navLinks.map((link) => (
  <Link
  key={link.name}
  to={link.path}
  className={`text-sm font-semibold transition-colors ${
  location.pathname === link.path
  ? 'text-primary'
  : 'text-text-secondary hover:text-primary'
  }`}
  >
  {link.name}
  </Link>
  ))}
  </div>
 
   <div className="flex items-center gap-3 pl-6 border-l border-border">
 
   {!user ? (
  <Link
  to="/login"
  className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl shadow-primary/20"
  >
  Login
  </Link>
  ) : (
  <Link
  to="/profile"
  className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-xl hover:bg-surface transition-colors border border-border shadow-sm"
  >
  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden">
  {userProfile?.profilePic ? (
  <img src={userProfile.profilePic} loading="lazy" decoding="async" alt="Avatar" className="w-full h-full object-cover" />
  ) : (
  userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
  )}
  </div>
  </Link>
  )}
  </div>
  </div>
 
  <div className="md:hidden flex items-center gap-4">
  <button onClick={() => setIsOpen(!isOpen)} className="text-heading p-2">
  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
  </button>
  </div>
  </div>
  </div>
  </motion.nav>
 
  <AnimatePresence>
  {isOpen && (
  <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  className="md:hidden fixed inset-0 z-[100] bg-bg flex flex-col"
  >
  <div className="flex items-center justify-between px-6 py-6 border-b border-border">
  <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
  <div className="w-12 h-12 overflow-hidden rounded-xl">
  <img src="/logo.png" loading="lazy" decoding="async" alt="EduAltTech Logo" className="w-full h-full object-cover" />
  </div>
   <span className="text-lg font-bold text-heading tracking-tight">EduAltTech</span>
  </Link>
  <button onClick={() => setIsOpen(false)} className="p-2 bg-surface-2 rounded-xl text-heading">
  <X className="w-6 h-6" />
  </button>
  </div>
 
   <div className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
   {navLinks.map((link, idx) => (
   <motion.div
   key={link.name}
   initial={{ opacity: 0, x: -20 }}
   animate={{ opacity: 1, x: 0 }}
   transition={{ delay: idx * 0.05 + 0.1 }}
   >
   <Link
   to={link.path}
   onClick={() => setIsOpen(false)}
   className={`text-base font-semibold px-5 py-3.5 rounded-xl transition-colors block ${
   location.pathname === link.path
   ? 'bg-primary/10 text-primary border border-primary/20'
   : 'text-text-secondary hover:bg-surface hover:text-heading'
   }`}
   >
   {link.name}
   </Link>
   </motion.div>
   ))}
 
   <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: navLinks.length * 0.05 + 0.2 }}
   className="mt-auto space-y-3"
   >
   {!user ? (
   <Link
   to="/login"
   onClick={() => setIsOpen(false)}
   className="bg-primary hover:bg-primary-hover text-white px-5 py-4 rounded-2xl font-bold text-center shadow-lg shadow-primary/20 block transition-colors"
   >
   Login
   </Link>
   ) : (
   <Link
   to="/profile"
   onClick={() => setIsOpen(false)}
   className="bg-primary hover:bg-primary-hover text-white px-5 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-colors"
   >
   <LucideUser className="w-5 h-5" /> Profile
   </Link>
   )}
   </motion.div>
   </div>
  </motion.div>
  )}
  </AnimatePresence>
  </>
 );
}
