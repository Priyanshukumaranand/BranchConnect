import { apiFetch } from './client';

export const requestOtp = (email, purpose = 'signup') =>
  apiFetch('/generate-otp', {
    method: 'POST',
    body: { email, purpose }
  });

export const signUp = (payload) =>
  apiFetch('/signup', {
    method: 'POST',
    body: payload
  });

export const signIn = (credentials) =>
  apiFetch('/login', {
    method: 'POST',
    body: credentials
  });

export const signOut = () =>
  apiFetch('/logout', { method: 'POST' });

export const fetchCurrentUser = () =>
  apiFetch('/me', { method: 'GET' });

export const forgotPassword = (email) =>
  apiFetch('/forgetPassword', {
    method: 'POST',
    body: { email }
  });

export const resetPassword = ({ email, otp, password }) =>
  apiFetch('/reset-password', {
    method: 'POST',
    body: { email, otp, password }
  });
