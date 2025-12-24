import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import logoIcon from '../../assets/logo-icon.svg';

const baseLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/societies', label: 'Societies' },
  { to: '/placement', label: 'Placement' },
  { to: '/exams', label: 'Exams' }
];

const authedLinks = [
  { to: '/batches', label: 'Batches' },
  { to: '/chats', label: 'Chats' }
];

const guestLinks = [
  { to: '/auth/sign-in', label: 'Sign In' }
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, initializing, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);
  const handleThemeToggle = () => {
    toggleTheme();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const navLinks = useMemo(() => {
    const links = [...baseLinks];
    if (user) {
      links.push(...authedLinks);
    }
    if (!user && !initializing) {
      links.push(...guestLinks);
    }
    return links;
  }, [user, initializing]);

  const initials = useMemo(() => {
    if (!user) return null;
    if (user.name) {
      return user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || null;
  }, [user]);

  const avatarUrl = user?.avatarUrl;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    } finally {
      closeMenu();
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="site-header" data-open={isMenuOpen}>
      <div className="site-header__inner">
        <Link to="/" className="brand">
          <div className="brand__logo">
            <img src={logoIcon} alt="IIIT Network Logo" />
          </div>
          <span className="brand__text">IIIT Network</span>
        </Link>
        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <nav aria-label="Primary" className="primary-nav" data-open={isMenuOpen}>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => isActive ? 'active' : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="theme-toggle"
            data-theme={theme}
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-pressed={theme === 'dark'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span className="theme-toggle__icon" aria-hidden>
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" role="img" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" role="img" aria-hidden>
                  <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 20v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="m4.93 4.93 1.41 1.41" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="m17.66 17.66 1.41 1.41" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M2 12h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M20 12h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="m4.93 19.07 1.41-1.41" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="m17.66 6.34 1.41-1.41" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </span>
          </button>
          <div className="nav-actions">
            {!user && (
              <NavLink to="/auth/sign-up" className="cta" onClick={closeMenu}>
                Join IIIT Network
              </NavLink>
            )}
            {user && (
              <div className="nav-account">
                <NavLink
                  to="/profile"
                  className={({ isActive }) => isActive ? 'nav-avatar nav-avatar--active' : 'nav-avatar'}
                  onClick={closeMenu}
                  aria-label="Edit your profile"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="" aria-hidden /> : <span aria-hidden>{initials}</span>}
                </NavLink>
                <button type="button" className="nav-signout" onClick={handleSignOut} aria-label="Sign out of your account">
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="site-header__backdrop" onClick={closeMenu} aria-hidden="true" />
    </header>
  );
};

export default Navbar;
