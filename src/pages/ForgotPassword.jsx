import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setStatus({ type: 'error', message: 'Enter the email associated with your account.' });
      return;
    }

    const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!pattern.test(trimmed)) {
      setStatus({ type: 'error', message: 'That email doesn’t look valid yet.' });
      return;
    }

    setStatus({
      type: 'success',
      message: 'Reset instructions sent! Swap this stub with your email service integration.'
    });
    setEmail('');
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
            <p className="field-hint">We’ll send a reset link to the email you registered with.</p>
          </div>

          {status && (
            <div className={`auth-status ${status.type}`} role="status">
              <strong>{status.type === 'success' ? 'Email on the way' : 'Let’s try that again'}</strong>
              <span>{status.message}</span>
            </div>
          )}

          <div className="auth-actions">
            <button type="submit">Send reset link</button>
            <Link className="secondary-link" to="/auth/sign-in">Remembered it? Sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
