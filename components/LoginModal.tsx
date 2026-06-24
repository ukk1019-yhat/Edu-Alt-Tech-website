import React, { useState } from 'react';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoginModal({ isOpen, onClose, title = "Sign In Required", subtitle = "Log in or create a free account to unlock full access." }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const resetState = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setGoogleLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        toast.success("Successfully logged in!");
        onClose();
        resetState();
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('Phone number is already registered. Please use another one.');
        setLoading(false);
        return;
      }

      if (!userCredential.user) {
        setError('Account creation failed. Please try again.');
        setLoading(false);
        return;
      }
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: serverTimestamp()
      });

      await updateProfile(userCredential.user, {
        displayName: name
      });

      try {
        await setDoc(doc(collection(db, 'mail')), {
          to: email,
          message: {
            subject: 'Welcome to the Edu-Alt-Tech Community! 🚀',
            text: `Hi ${name},\n\nWelcome to Edu-Alt-Tech! We're excited to have you on board. You've taken the first step towards a more disciplined and structured learning journey.\n\nWhat's next?\n1. Explore our high-discipline curricula.\n2. Apply for mentorship or find a mentor for your target subject.\n3. Track your progress daily in your personal dashboard.\n\nWe're here to support you every step of the way.\n\nKeep building,\nThe Edu-Alt-Tech Team`
          }
        });
      } catch (mailErr) {
        console.error("Welcome email failed", mailErr);
      }

      toast.success("Account created successfully!");
      onClose();
      resetState();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in.');
      } else {
        setError(err.message || 'Failed to create account.');
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
        const userRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: result.user.displayName || 'User',
            email: result.user.email,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp()
          });

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

        toast.success("Successfully logged in with Google!");
        onClose();
        resetState();
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

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--overlay-bg)',
            padding: '16px'
          }}
          onClick={() => { onClose(); resetState(); }}
        >
          <div
            className="bento-card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '32px 24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Rigid Close Button */}
            <button
              className="btn"
              onClick={() => { onClose(); resetState(); }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>&times;</span>
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '2px solid var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-soft)',
                  margin: '0 auto 16px',
                  boxShadow: '2px 2px 0 0 var(--ink)'
                }}
              >

              </div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{title}</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: '1.5' }}>{subtitle}</p>
            </div>

            {/* Brutalist Danger Badge */}
            {error && (
              <div
                style={{
                  border: '2px solid #dc2626',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  width: '100%',
                  textAlign: 'center',
                  margin: '8px 0',
                  boxShadow: '2px 2px 0 0 #dc2626'
                }}
              >
                {error}
              </div>
            )}

            {/* Form Fields container */}
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {mode === 'signup' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary action submit button */}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || googleLoading}
                style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* Dotted separator gradient wrapper matching .asc primitive */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0 8px' }}>
              <div style={{ width: '100%', height: '6px', background: 'repeating-linear-gradient(90deg, var(--ink) 0, var(--ink) 2px, transparent 2px, transparent 6px)' }} />
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ink-mute)', background: 'var(--bg-surface)', padding: '0 8px', position: 'relative', top: '-11px' }}>
                Or continue with
              </span>
            </div>

            {/* Google Authentication Button */}
            <button
              className="btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {googleLoading ? (
                'Loading...'
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span style={{ fontWeight: '600' }}>Google</span>
                </>
              )}
            </button>

            {/* Bottom Form Toggle Button */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => { setMode('signup'); setError(''); }}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '4px' }}
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => { setMode('login'); setError(''); }}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '4px' }}
                    >
                      Log In
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}