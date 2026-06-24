
import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import AIAssistant from './components/AIAssistant';
import NotificationDrawer from './components/NotificationDrawer';
import CommandPalette from './components/CommandPalette';

const Home = lazy(() => import('./pages/Home'));
const PeerEducation = lazy(() => import('./pages/PeerEducation'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const TeacherApplication = lazy(() => import('./pages/TeacherApplication'));
const CourseClassroom = lazy(() => import('./pages/CourseClassroom'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PatchNotes = lazy(() => import('./pages/PatchNotes'));
const Verification = lazy(() => import('./pages/Verification'));
const FlashcardDeck = lazy(() => import('./components/FlashcardDeck'));
const BehaviorInsights = lazy(() => import('./pages/BehaviorInsights'));
const Services = lazy(() => import('./pages/Services'));
const Resources = lazy(() => import('./pages/Resources'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Practice = lazy(() => import('./pages/Practice'));
const TeacherPanel = lazy(() => import('./pages/TeacherPanel'));
const Messages = lazy(() => import('./pages/Messages'));

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isClassroomPath = location.pathname.startsWith('/classroom');
  const isTeacherPath = location.pathname.startsWith('/teacher-panel');
  const isHideLayout = isAdminPath || isClassroomPath || isTeacherPath;

  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleNotif = useCallback(() => setNotifOpen(v => !v), []);
  const togglePalette = useCallback(() => setPaletteOpen(v => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div>
      <Toaster position="top-right" />
      {!isHideLayout && <Navbar onSearchToggle={togglePalette} onNotifToggle={toggleNotif} />}
      <div>
        <Suspense fallback={<div><div>Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/peer-education" element={<PeerEducation />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/classroom/:courseId" element={<CourseClassroom />} />
            <Route path="/teacher-application" element={<TeacherApplication />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/patch-notes" element={<PatchNotes />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/flashcards" element={<FlashcardDeck />} />
            <Route path="/admin/behavior" element={<BehaviorInsights />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/teacher-panel" element={<TeacherPanel />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
        </Suspense>
      </div>
      {!isHideLayout && <Footer />}
      {!isHideLayout && <AIAssistant />}
      {!isHideLayout && <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />}
      {!isHideLayout && <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </HelmetProvider>
  );
};

export default App;
