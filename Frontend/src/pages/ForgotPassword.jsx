import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  useEffect(() => () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setStatus({ type: 'error', message: 'Enter the email associated with your account.' });
      return;
    }

    const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!pattern.test(trimmed)) {
      setStatus({ type: 'error', message: 'That email doesn’t look valid yet.' });
      return;
    }

    const sendOtp = async () => {
      try {
        setSubmitting(true);
        setStatus({ type: 'pending', message: 'Sending a verification code to your inbox…' });
        await forgotPassword(trimmed);
        setStatus({
          type: 'success',
          message: `OTP sent to ${trimmed}. Redirecting you to verification…`
        });
        redirectTimerRef.current = setTimeout(() => {
          navigate(`/auth/reset-password?email=${encodeURIComponent(trimmed)}`, {
            state: { email: trimmed, otpSent: true }
          });
        }, 1200);
      } catch (error) {
        setStatus({
          type: 'error',
          message: error.payload?.error || error.message || 'Unable to send reset OTP right now.'
        });
      } finally {
        setSubmitting(false);
      }
    };

    sendOtp();
  };

  return (
    <section className="auth-page auth-page--single">
      <div className="auth-card">
        <div className="auth-headline">
          <h1>Forgot your password?</h1>
          <p>No stress. We’ll help you bounce back in a couple of clicks.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="forgot-email">Institute email</label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="you@iiit-bh.ac.in"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setStatus(null);
              }}
            />
            <p className="field-hint">We’ll send a 6-digit code to the email you registered with.</p>
          </div>

          {status && (
            <div className={`auth-status ${status.type}`} role="status">
              <strong>
                {status.type === 'success'
                  ? 'OTP on the way'
                  : status.type === 'pending'
                    ? 'Working on it'
                    : 'Let’s try that again'}
              </strong>
              <span>{status.message}</span>
            </div>
          )}

          <div className="auth-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send OTP'}
            </button>
            <Link className="secondary-link" to="/auth/sign-in">Remembered it? Sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
