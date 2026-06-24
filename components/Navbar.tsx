import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from '../lib/firebase';
import type { User as FirebaseUser } from '../lib/firebase';
import { UserObject } from '../types';

interface NavbarProps {
  onSearchToggle?: () => void;
  onNotifToggle?: () => void;
}

export default function Navbar({ onSearchToggle, onNotifToggle }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setShowUserMenu(false);
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) setUserProfile(docSnap.data() as UserObject);
        } catch {}
      } else setUserProfile(null);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    setShowUserMenu(false);
    setIsOpen(false);
  };

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
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Courses', path: '/courses' },
    { name: 'Practice', path: '/practice' },
    { name: 'Resources', path: '/resources' },
  ];

  const adminLinks = [{ name: 'Admin Portal', path: '/admin' }];

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const isAdmin = user?.email === 'ukkukk97@gmail.com' || user?.email === 'umakrishnakanthchokkapu15@gmail.com' || userProfile?.role === 'admin';
  let navLinks = publicLinks;
  if (isAdmin) navLinks = adminLinks;
  else if (user) navLinks = studentLinks;

  return (
    <>
      <header>
        <div className="navbar">
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-dot" aria-hidden="true" />
            EduAltTech
          </Link>

          <nav className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={location.pathname === link.path ? 'font-bold' : ''}
                style={location.pathname === link.path ? { color: 'var(--ink)' } : undefined}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-8">
            <button onClick={onSearchToggle} aria-label="Search" title="Search (Cmd+K)" className="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button onClick={onNotifToggle} aria-label="Notifications" title="Notifications" className="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme" className="btn btn-sm" style={{ fontFamily: 'var(--font-body)', textTransform: 'none', letterSpacing: 'normal' }}>
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            {!user ? (
              <Link to="/login" className="btn btn-sm">Sign In</Link>
            ) : (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="btn-icon font-mono font-bold" style={{ position: 'relative' }}>
                  {userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </button>
                {showUserMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, minWidth: 180, background: 'var(--bg)', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)', zIndex: 100, padding: 8 }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--rule-soft)', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{userProfile?.name || 'User'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '8px 10px', fontSize: '0.85rem', color: 'var(--ink)', textDecoration: 'none' }}>Profile</Link>
                    <Link to="/dashboard" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '8px 10px', fontSize: '0.85rem', color: 'var(--ink)', textDecoration: 'none' }}>Dashboard</Link>
                    <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: '0.85rem', background: 'none', border: 'none', borderTop: '1px solid var(--rule-soft)', marginTop: 4, cursor: 'pointer', color: 'var(--ink)' }}>Logout</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="navbar-hamburger" aria-label="Menu">
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${isOpen ? ' open' : ''}`}>
        <div className="mobile-menu-links">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className={location.pathname === link.path ? 'text-accent font-bold' : ''}>
              {link.name}
            </Link>
          ))}
          <div className="mt-8" style={{ borderTop: '2px solid var(--rule-soft)', paddingTop: 12 }}>
            {!user ? (
              <Link to="/login" className="btn btn-sm btn-full" onClick={() => setIsOpen(false)}>Login</Link>
            ) : (
              <>
                <Link to="/profile" className="btn btn-sm btn-full" onClick={() => setIsOpen(false)} style={{ marginBottom: 8 }}>Profile</Link>
                <button onClick={handleLogout} className="btn btn-sm btn-full" style={{ background: 'none' }}>Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
