import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
// Fix modular imports for Firebase Auth
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';

import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.email === 'viranadeep@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email or password is incorrect');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Check if user is new (no Firestore doc)
        const userRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create user profile
          await setDoc(userRef, {
            name: result.user.displayName || 'User',
            email: result.user.email,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp()
          });

          // Trigger Welcome Email
          try {
            await setDoc(doc(collection(db, 'mail')), {
              to: result.user.email,
              message: {
                subject: 'Welcome to the Edu-Alt-Tech Community! 🚀',
                text: `Hi ${result.user.displayName || 'Learner'},\n\nWelcome to Edu-Alt-Tech! We're excited to have you on board. You've taken the first step towards a more disciplined and structured learning journey.\n\nWhat's next?\n1. Explore our high-discipline curricula.\n2. Apply for mentorship or find a mentor for your target subject.\n3. Track your progress daily in your personal dashboard.\n\nWe're here to support you every step of the way.\n\nKeep building,\nThe Edu-Alt-Tech Team`
              }
            });
          } catch (mailErr) {
            console.error("Welcome email failed", mailErr);
          }
        }

        if (result.user.email === 'viranadeep@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }
    setResetLoading(true);
    setError('');
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Reset link sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError('Failed to send reset email. Verify your email address.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-[#020617] flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 dark:from-emerald-500/10 dark:to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <Link to="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium relative z-10">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <motion.div
        ref={formRef}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-950 border border-slate-200/50 dark:border-slate-800/50 relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Continue your execution journey.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm font-medium">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800 text-sm font-medium">
            {resetMessage}
          </div>
        )}


        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>

              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-12 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>

              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all shadow-sm text-lg flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </>
            )}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Don't have an account? <Link to="/signup" className="font-bold text-slate-900 dark:text-emerald-400 hover:text-emerald-600 transition-colors underline underline-offset-4">Sign Up</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;