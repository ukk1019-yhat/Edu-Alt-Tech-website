
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Team from './pages/Team';
import PeerEducation from './pages/PeerEducation';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import TeacherApplication from './pages/TeacherApplication';
import CourseClassroom from './pages/CourseClassroom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import PatchNotes from './pages/PatchNotes';
import Verification from './pages/Verification';
import FlashcardDeck from './components/FlashcardDeck';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import AIAssistant from './components/AIAssistant';
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

import { SmoothScroll } from './components/SmoothScroll';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isClassroomPath = location.pathname.startsWith('/classroom');
  const isHideLayout = isAdminPath || isClassroomPath;

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />
      {!isHideLayout && <Navbar />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/peer-education" element={<PeerEducation />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
          <Route path="/classroom/:courseId" element={<CourseClassroom />} />
          <Route path="/teacher-application" element={<TeacherApplication />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/patch-notes" element={<PatchNotes />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/flashcards" element={<FlashcardDeck />} />
        </Routes>
      </div>
      {!isHideLayout && <Footer />}
      {!isHideLayout && <AIAssistant />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </SmoothScroll>
    </ThemeProvider>
  );
};

export default App;
