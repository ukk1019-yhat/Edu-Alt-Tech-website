import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, sendPasswordResetEmail } from '../lib/firebase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError('Failed to send reset email. Verify your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="btn btn-sm btn-secondary" style={{ marginBottom: 24 }}>
          Back to Login
        </Link>

        <div className="bento-card" style={{ gap: 20 }}>
          <div>
            <h1>Reset Password</h1>
            <p>Enter your email and we'll send you a reset link.</p>
          </div>

          {error && (
            <div className="badge badge-danger w-full text-center text-sm" style={{ padding: '10px 14px' }}>
              {error}
            </div>
          )}

          {sent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'var(--accent-soft)', fontWeight: 700, fontSize: 24, color: 'var(--accent)' }}>
                ✓
              </div>
              <h3>Check your inbox</h3>
              <p style={{ color: 'var(--ink-soft)' }}>
                We sent a reset link to <strong>{email}</strong>
              </p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>

              <button type="submit" className="btn btn-primary btn-full mt-8" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-sm text-center">
            Remember your password? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
