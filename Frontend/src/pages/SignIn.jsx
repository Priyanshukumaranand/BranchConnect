import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

const INSTITUTE_EMAIL_PATTERN = /^b\d{6}@iiit-bh\.ac\.in$/i;

const initialForm = {
  email: '',
  password: ''
};

const SignIn = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn: authenticate, user, initializing } = useAuth();

  const redirectPath = useMemo(() => {
    const fromState = location.state?.from;
    if (fromState?.pathname) {
      return fromState.pathname + (fromState.search || '') + (fromState.hash || '');
    }
    return '/batches';
  }, [location.state]);

  useEffect(() => {
    if (!initializing && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, initializing, navigate, redirectPath]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'email' ? value.toLowerCase() : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const validators = useMemo(() => ({
    email: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return 'Email address is required.';
      if (!INSTITUTE_EMAIL_PATTERN.test(trimmed)) {
        return 'Use your institute email (e.g. b522046@iiit-bh.ac.in).';
      }
      return undefined;
    },
    password: (value) => {
      if (!value.trim()) return 'Password is required.';
      if (value.length < 6) return 'Password must be at least 6 characters long.';
      return undefined;
    }
  }), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = Object.entries(form).reduce((acc, [key, value]) => {
      const validator = validators[key];
      if (validator) {
        const error = validator(value);
        if (error) acc[key] = error;
      }
      return acc;
    }, {});

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Please resolve the highlighted fields to continue.'
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: 'pending', message: 'Signing you in…' });
      await authenticate({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      setStatus({
        type: 'success',
        message: 'Signed in! Redirecting you to your batches…'
      });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Unable to sign in right now.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    const endpoint = `${API_BASE_URL}/auth/google`;
    window.location.href = endpoint;
  };

  return (
    <section className="auth-page">
      <div className="auth-headline">
  <h1>Welcome back!</h1>
  <p>Sign in to stay connected with every branch, collaborate with societies, and keep tabs on submissions.</p>
      </div>

      <div className="auth-split">
        <div className="auth-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">Institute email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@iiit-bh.ac.in"
                value={form.email}
                onChange={handleChange}
              />
              <p className="field-hint">Use your institute-issued email for the smoothest approval.</p>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              <p className="field-hint">Minimum 6 characters. Use a mix of letters, numbers, and symbols.</p>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className="auth-actions">
              <button type="submit" disabled={submitting || initializing}>{submitting ? 'Signing in…' : 'Sign in'}</button>
              <Link className="secondary-link" to="/auth/forgot-password">Forgot password?</Link>
            </div>
          </form>

          <div className="alt-signin" aria-live="polite">
            <button type="button" className="alt-signin__google" onClick={handleGoogleSignIn}>
              <span aria-hidden className="alt-signin__icon">G</span>
              <span>Continue with Google</span>
            </button>
            <span>
              New here?{' '}
              <Link className="secondary-link" to="/auth/sign-up">Create an account</Link>
            </span>
          </div>

          {status && (
            <div className={`auth-status ${status.type}`} role="status">
              <strong>
                {status.type === 'success'
                  ? 'Success'
                  : status.type === 'pending'
                    ? 'Working on it'
                    : 'Let’s fix this'}
              </strong>
              <span>{status.message}</span>
            </div>
          )}
        </div>

        <aside className="auth-benefits">
          <h2>Why sign in?</h2>
          <ul>
            <li>Track your society or project submissions in real time.</li>
            <li>Collaborate with mentors and peer reviewers seamlessly.</li>
            <li>Unlock Branch Connect-only resources and campus events.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
};

export default SignIn;
