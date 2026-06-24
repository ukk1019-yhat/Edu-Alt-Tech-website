import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth, sendEmailVerification } from '../lib/firebase';

const Verification: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || 'your email';
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to resend verification.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    } catch {
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="bento-card" style={{ alignItems: 'center', textAlign: 'center', gap: 16, padding: '48px 32px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              background: sent ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: sent ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            {sent ? '✓' : '✉'}
          </div>

          <h2>{sent ? 'Email Sent!' : 'Verify Your Email'}</h2>

          <p style={{ maxWidth: 380 }}>
            {sent
              ? `We've sent another verification email to ${email}. Please check your inbox (and spam folder).`
              : `We have sent you a verification email to ${email}. Please verify it and log in.`
            }
          </p>

          {error && (
            <div className="badge badge-danger" style={{ padding: '10px 14px', width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>

            {!sent && (
              <button className="btn" onClick={handleResend} disabled={loading}>
                {loading ? 'Sending...' : 'Resend Verification'}
              </button>
            )}

            <Link to="/" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
