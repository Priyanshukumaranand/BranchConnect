import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp } from '../api/auth';
import { updateProfile as apiUpdateProfile } from '../api/users';
import { API_BASE_URL, setApiAuthToken, clearApiAuthToken } from '../api/client';

const TOKEN_STORAGE_KEY = 'cebb.auth.token';

const AuthContext = createContext({
  user: null,
  initializing: true,
  authError: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {}
});

const toAbsoluteUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value, API_BASE_URL).toString();
  } catch (error) {
    return value;
  }
};

const normaliseUser = (rawUser) => {
  if (!rawUser) return null;

  const avatarCandidate = rawUser.image || rawUser.avatarUrl || rawUser.avatarPath;
  const avatarUrl = avatarCandidate
    ? avatarCandidate.startsWith('data:')
      ? avatarCandidate
      : toAbsoluteUrl(avatarCandidate)
    : null;

  return {
    ...rawUser,
    avatarUrl
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let subscribed = true;

    if (typeof window !== 'undefined') {
      try {
        const storedToken = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          setApiAuthToken(storedToken);
        }
      } catch (storageError) {
        console.warn('Unable to read stored auth token:', storageError);
      }
    }

    (async () => {
      try {
        const response = await fetchCurrentUser();
        if (!subscribed) return;
        setUser(normaliseUser(response?.user));
        setAuthError(null);
      } catch (error) {
        if (!subscribed) return;
        if (error.status === 401) {
          setUser(null);
          setAuthError(null);
          if (typeof window !== 'undefined') {
            try {
              window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            } catch (storageError) {
              console.warn('Unable to clear stored auth token:', storageError);
            }
          }
          clearApiAuthToken();
        } else {
          setAuthError(error);
        }
      } finally {
        if (subscribed) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      subscribed = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await apiSignIn(credentials);
    const token = response?.token;
    if (token) {
      setApiAuthToken(token);
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        } catch (storageError) {
          console.warn('Unable to persist auth token:', storageError);
        }
      }
    }
    setUser(normaliseUser(response?.user));
    setAuthError(null);
    return response;
  }, []);

  const signUp = useCallback(async (payload) => apiSignUp(payload), []);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
      setAuthError(null);
    } catch (error) {
      setAuthError(error);
      throw error;
    } finally {
      setUser(null);
      clearApiAuthToken();
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch (storageError) {
          console.warn('Unable to clear stored auth token:', storageError);
        }
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetchCurrentUser();
      setUser(normaliseUser(response?.user));
      setAuthError(null);
      return normaliseUser(response?.user);
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        setAuthError(null);
        clearApiAuthToken();
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          } catch (storageError) {
            console.warn('Unable to clear stored auth token:', storageError);
          }
        }
        return null;
      }
      setAuthError(error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const response = await apiUpdateProfile(payload);
    setUser(normaliseUser(response?.user));
    return response;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      authError,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile
    }),
    [user, initializing, authError, signIn, signUp, signOut, refreshUser, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
