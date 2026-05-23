import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Verification: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || 'your email';
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to resend verification. Please try signing up again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
          {sent ? <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-in zoom-in-50 duration-300" /> : <Mail className="w-10 h-10 text-emerald-600" />}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
          {sent ? 'Email Sent!' : 'Verify Your Email'}
        </h1>

        <p className="text-slate-600 leading-relaxed mb-8">
          {sent
            ? `We've sent another verification email to ${email}. Please check your inbox (and spam folder).`
            : `We have sent you a verification email to ${email}. Please verify it and log in.`
          }
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Link
            to="/login"
            className="block w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-lg"
          >
            Go to Login
          </Link>

          {!sent && (
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Resend Verification</>}
            </button>
          )}

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Verification;
