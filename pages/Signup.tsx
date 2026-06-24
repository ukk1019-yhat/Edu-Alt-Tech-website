import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, doc, setDoc, serverTimestamp, collection, query, where, getDocs } from '../lib/firebase';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

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
        setError('Account creation failed. Please check your email confirmation settings and try again.');
        setLoading(false);
        return;
      }
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: serverTimestamp()
      });

      await updateProfile(userCredential.user, { displayName: name });

      await sendEmailVerification(userCredential.user);

      if (email === 'ukkukk97@gmail.com' || email === 'umakrishnakanthchokkapu15@gmail.com' || email === 'admin@edualttech.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = (input: React.ReactNode, show: boolean, toggle: () => void) => (
    <div style={{ position: 'relative' }}>
      {input}
      <button type="button" onClick={toggle} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--ink-mute)', padding: 0, lineHeight: 1 }}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="btn btn-sm btn-secondary" style={{ marginBottom: 24 }}>
          Back to Home
        </Link>

        <div className="bento-card" style={{ gap: 20 }}>
          <div>
            <h1>Create Account</h1>
            <p>Join the world's most disciplined learners.</p>
          </div>

          {error && (
            <div className="badge badge-danger w-full text-center text-sm" style={{ padding: '10px 14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              {inputWrap(
                <input type={showPassword ? 'text' : 'password'} className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder=".........." style={{ paddingRight: 40, width: '100%' }} />,
                showPassword,
                () => setShowPassword(!showPassword)
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              {inputWrap(
                <input type={showConfirmPassword ? 'text' : 'password'} className="input" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder=".........." style={{ paddingRight: 40, width: '100%' }} />,
                showConfirmPassword,
                () => setShowConfirmPassword(!showConfirmPassword)
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full mt-8" disabled={loading}>
              {loading ? 'Loading...' : 'Create Account'}
            </button>

            <p className="text-sm text-center mt-8">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
