import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { requestOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const INSTITUTE_EMAIL_PATTERN = /^b\d{6}@iiit-bh\.ac\.in$/i;
const COLLEGE_ID_PATTERN = /^b\d{6}$/i;

const initialForm = {
  fullName: '',
  rollId: '',
  email: '',
  password: '',
  confirmPassword: '',
  otp: ''
};

const SignUp = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [otpStatus, setOtpStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { signUp: register } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    // Lowercase rollId and email for standardization
    const nextValue = ['rollId', 'email'].includes(name) ? value.toLowerCase() : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const validators = useMemo(() => ({
    fullName: (value) => {
      if (!value.trim()) return 'Tell us your full name.';
      if (value.trim().split(' ').length < 2) {
        return 'Please include both first and last name.';
      }
      return undefined;
    },
    rollId: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return 'Roll ID is required.';
      if (!COLLEGE_ID_PATTERN.test(trimmed)) {
        return 'Expected format: b[branch][year][roll] (e.g. b522046).';
      }
      return undefined;
    },
    email: (value, fullForm) => {
      const trimmed = value.trim();
      if (!trimmed) return 'Email is required.';
      if (!INSTITUTE_EMAIL_PATTERN.test(trimmed)) {
        return 'Use your institute email (e.g. b522046@iiit-bh.ac.in).';
      }
      if (fullForm?.rollId && trimmed.split('@')[0] !== fullForm.rollId.trim()) {
        return 'Email prefix should match your roll ID.';
      }
      return undefined;
    },
    password: (value) => {
      if (!value.trim()) return 'Choose a password.';
      if (value.length < 6) return 'Password must be at least 6 characters.';
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        return 'Include an uppercase letter and a number for security.';
      }
      return undefined;
    },
    confirmPassword: (value, fullForm) => {
      if (!value.trim()) return 'Confirm your password.';
      if (value !== fullForm.password) return 'Passwords do not match.';
      return undefined;
    },
    otp: (value) => {
      if (!value.trim()) return 'Enter the 6-digit OTP sent to your email.';
      if (!/^[0-9]{6}$/.test(value)) return 'OTP should be a 6 digit code.';
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
        message: 'Please correct the highlighted fields.'
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: 'pending', message: 'Creating your account…' });
      await register({
        name: form.fullName.trim(),
        collegeId: form.rollId.trim(),
        email: form.email.trim(),
        password: form.password,
        otp: form.otp
      });
      setStatus({
        type: 'success',
        message: 'Account created! You can now sign in.'
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Unable to sign you up right now.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    const emailError = validators.email(form.email, form);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      setOtpStatus({ type: 'error', message: 'Fix your email before requesting OTP.' });
      return;
    }

    try {
      setSendingOtp(true);
      setOtpStatus({ type: 'pending', message: 'Sending OTP…' });
      await requestOtp(form.email.trim());
      setOtpStatus({ type: 'success', message: 'OTP sent! Check your inbox.' });
    } catch (error) {
      setOtpStatus({
        type: 'error',
        message: error.payload?.error || error.message || 'Could not send OTP.'
      });
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-headline">
        <h1>Create your IIIT Network account</h1>
        <p>Unlock mentor feedback, society collaborations, and personalised workshops tailored to your goals.</p>
      </div>

      <div className="auth-split">
        <Card className="auth-card" variant="glass">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Priyanshu Kumar Anand"
                value={form.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="rollId">Roll ID</label>
              <input
                id="rollId"
                name="rollId"
                type="text"
                placeholder="b520123"
                value={form.rollId}
                onChange={handleChange}
              />
              {errors.rollId && <p className="field-error">{errors.rollId}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
            </div>

            <div className="form-field otp-field">
              <label htmlFor="otp">OTP</label>
              <div className="otp-input-row">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6 digit code"
                  value={form.otp}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  size="sm"
                >
                  {sendingOtp ? 'Sending…' : 'Send OTP'}
                </Button>
              </div>
              {errors.otp && <p className="field-error">{errors.otp}</p>}
              {otpStatus && (
                <p className={`field-hint otp-${otpStatus.type}`}>
                  {otpStatus.message}
                </p>
              )}
            </div>

            <div className="auth-actions">
              <Button type="submit" variant="primary" fullWidth loading={submitting}>
                Create account
              </Button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Already have an account?{' '}
                <Link className="secondary-link" to="/auth/sign-in">Sign in</Link>
              </span>
            </div>
          </form>

          {status && (
            <div className={`auth-status ${status.type}`} role="status">
              <span>{status.message}</span>
            </div>
          )}
        </Card>

        <aside className="auth-benefits">
          <Card variant="elevated">
            <h2>Membership perks</h2>
            <ul>
              <li>Showcase your portfolio to incoming recruiters.</li>
              <li>Book mentor hours to unblock tricky challenges.</li>
              <li>Join exclusive society collaborations and campus projects.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </section>
  );
};

export default SignUp;
