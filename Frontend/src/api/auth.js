import { apiFetch } from './client';

export const requestOtp = (email) =>
  apiFetch('/generate-otp', {
    method: 'POST',
    body: { email }
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
  apiFetch('/logout', { method: 'GET' });

export const forgotPassword = (email) =>
  apiFetch('/forgetPassword', {
    method: 'POST',
    body: { email }
  });

export const resetPassword = (token, password) =>
  apiFetch('/reset-password', {
    method: 'POST',
    body: { token, password }
  });
