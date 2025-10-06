import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cebootcamp.theme';
const FALLBACK_THEME = 'dark';

const ThemeContext = createContext({
  theme: FALLBACK_THEME,
  toggleTheme: () => {},
  setTheme: () => {}
});

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { theme: FALLBACK_THEME, userOverride: false };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return { theme: stored, userOverride: true };
  }

  const prefersDark = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  return { theme: prefersDark ? 'dark' : 'light', userOverride: false };
};

export const ThemeProvider = ({ children }) => {
  const [{ theme, userOverride }, setState] = useState(() => getInitialState());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (userOverride) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [theme, userOverride]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const mediaListener = (event) => {
      setState((prev) => {
        if (prev.userOverride) {
          return prev;
        }

        return { theme: event.matches ? 'dark' : 'light', userOverride: false };
      });
    };

    media.addEventListener('change', mediaListener);
    return () => media.removeEventListener('change', mediaListener);
  }, []);

  const applyTheme = useCallback((nextTheme, { persist = true } = {}) => {
    setState({ theme: nextTheme, userOverride: persist });
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      theme: prev.theme === 'dark' ? 'light' : 'dark',
      userOverride: true
    }));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme: (nextTheme, options) => applyTheme(nextTheme, options)
    }),
    [theme, toggleTheme, applyTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
