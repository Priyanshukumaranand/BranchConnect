import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const initialForm = {
  password: '',
  confirmPassword: ''
};

const ResetPassword = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const validators = useMemo(() => ({
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

  const handleSubmit = (event) => {
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

    if (Object.keys(nextErrors).length === 0) {
      setStatus({
        type: 'success',
        message: 'Password updated. Replace this stub with your backend token logic.'
      });
      setForm(initialForm);
    } else {
      setStatus({
        type: 'error',
        message: 'Please resolve the highlighted fields.'
      });
    }
  };

  return (
    <section className="auth-page auth-page--single">
      <div className="auth-card">
        <div className="auth-headline">
          <h1>Set a new password</h1>
          <p>After this step you’ll be ready to sign in again. Tokens or OTP checks can plug in later.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
              <strong>{status.type === 'success' ? 'Password ready' : 'Let’s fix a few things'}</strong>
              <span>{status.message}</span>
            </div>
          )}

          <div className="auth-actions">
            <button type="submit">Update password</button>
            <Link className="secondary-link" to="/auth/sign-in">Back to sign in</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
