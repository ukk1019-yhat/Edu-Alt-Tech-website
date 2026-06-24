import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, { name: u.displayName || 'User', email: u.email, photoURL: u.photoURL, createdAt: serverTimestamp() });
        }
        if (u.email === 'ukkukk97@gmail.com' || u.email === 'umakrishnakanthchokkapu15@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user) return;
      if (userCredential.user.email === 'ukkukk97@gmail.com' || userCredential.user.email === 'umakrishnakanthchokkapu15@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
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
      await signInWithPopup(auth, provider);
    } catch {
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="btn btn-sm btn-secondary" style={{ marginBottom: 24 }}>
          Back to Home
        </Link>

        <div className="bento-card" style={{ gap: 20 }}>
          <div>
            <h1>Welcome Back</h1>
            <p>Continue your execution journey.</p>
          </div>

          {error && (
            <div className="badge badge-danger w-full text-center text-sm" style={{ padding: '10px 14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder=".........." style={{ paddingRight: 40, width: '100%' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--ink-mute)', padding: 0, lineHeight: 1 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full mt-8" disabled={loading || googleLoading}>
              {loading ? 'Loading...' : 'Login'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 2, background: 'var(--rule-soft)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>Or continue with</span>
              <div style={{ flex: 1, height: 2, background: 'var(--rule-soft)' }} />
            </div>

            <button type="button" className="btn btn-full" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
              {googleLoading ? (
                'Loading...'
              ) : (
                <svg viewBox="0 0 24 24" width={16} height={16}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Google
            </button>

            <p className="text-sm text-center mt-8">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
