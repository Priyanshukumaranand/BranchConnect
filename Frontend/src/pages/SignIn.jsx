import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { signIn } from '../api/auth';

const initialForm = {
  email: '',
  password: ''
};

const SignIn = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const validators = useMemo(() => ({
    email: (value) => {
      if (!value.trim()) return 'Email address is required.';
      const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
      if (!pattern.test(value)) return 'Enter a valid institute email address.';
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
      await signIn(form);
      setStatus({
        type: 'success',
        message: 'Signed in! If your backend redirects, the cookie session is now set.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Unable to sign in right now.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-headline">
        <h1>Welcome back!</h1>
        <p>Sign in to manage your bootcamp journey, collaborate with societies, and keep tabs on submissions.</p>
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
              <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
              <Link className="secondary-link" to="/auth/forgot-password">Forgot password?</Link>
            </div>
          </form>

          <div className="alt-signin" aria-live="polite">
            <button type="button" className="alt-signin__google">
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
            <li>Unlock access to bootcamp-only resources and events.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
};

export default SignIn;
