import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import { resetPassword } from '../api/auth';

const initialForm = {
  email: '',
  otp: '',
  password: '',
  confirmPassword: ''
};

const ResetPassword = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTimerRef = useRef(null);

  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);

  useEffect(() => {
    const presetEmail = location.state?.email || emailFromQuery;
    if (presetEmail) {
      setForm((prev) => (prev.email ? prev : { ...prev, email: presetEmail }));
      if (location.state?.otpSent) {
        setStatus({
          type: 'pending',
          message: `We’ve sent a one-time password to ${presetEmail}. Enter it below to continue.`
        });
      }
    }
  }, [location.state, emailFromQuery]);

  useEffect(() => () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const validators = useMemo(() => ({
    email: (value) => {
      if (!value.trim()) return 'Enter the email you used for your account.';
      const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
      if (!pattern.test(value)) return 'That email address looks incorrect.';
      return undefined;
    },
    otp: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return 'Enter the 6-digit OTP sent to your email.';
      if (!/^[0-9]{6}$/.test(trimmed)) return 'OTP should be exactly 6 digits.';
      return undefined;
    },
    password: (value) => {
      if (!value.trim()) return 'Choose a new password.';
      if (value.length < 8) return 'Use at least 8 characters for stronger security.';
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        return 'Include an uppercase letter and a number.';
      }
      return undefined;
    },
    confirmPassword: (value, fullForm) => {
      if (!value.trim()) return 'Confirm your new password.';
      if (value !== fullForm.password) return 'Those passwords don’t match yet.';
      return undefined;
    }
  }), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = Object.entries(form).reduce((acc, [key, value]) => {
      const validator = validators[key];
      if (validator) {
        const error = validator(value, form);
        if (error) acc[key] = error;
      }
      return acc;
    }, {});

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Please resolve the highlighted fields.'
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: 'pending', message: 'Resetting your password…' });

      const payload = {
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
        password: form.password
      };

      await resetPassword(payload);

      setStatus({
        type: 'success',
        message: 'Password updated successfully! Redirecting you to sign in…'
      });

      setForm((prev) => ({ ...initialForm, email: prev.email }));

      redirectTimerRef.current = setTimeout(() => {
        navigate('/auth/sign-in', { replace: true });
      }, 1200);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Unable to reset password right now.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page auth-page--single">
      <div className="auth-card">
        <div className="auth-headline">
          <h1>Set a new password</h1>
          <p>Verify with the OTP from your email, then choose a fresh password to get back in.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="reset-email">Institute email</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@iiit-bh.ac.in"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="reset-otp">OTP</label>
            <input
              id="reset-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 6 digit code"
              value={form.otp}
              onChange={handleChange}
            />
            {errors.otp && <p className="field-error">{errors.otp}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={handleChange}
            />
            <p className="field-hint">Minimum 8 characters, with one uppercase letter and one number.</p>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
          </div>

          {status && (
            <div className={`auth-status ${status.type}`} role="status">
              <strong>
                {status.type === 'success'
                  ? 'Password ready'
                  : status.type === 'pending'
                    ? 'Working on it'
                    : 'Let’s fix a few things'}
              </strong>
              <span>{status.message}</span>
            </div>
          )}

          <div className="auth-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update password'}
            </button>
            <Link className="secondary-link" to="/auth/sign-in">Back to sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
