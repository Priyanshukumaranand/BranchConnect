import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);
  const handleThemeToggle = () => {
    toggleTheme();
  };

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
        <NavLink to="/" className="brand" aria-label="Branch Connect home" onClick={closeMenu}>
          <span className="brand__logo" aria-hidden>BC</span>
          <span className="brand__text">Branch Connect</span>
        </NavLink>
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
        <nav aria-label="Primary" className="primary-nav">
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
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-pressed={theme === 'dark'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span aria-hidden>{theme === 'dark' ? '🌞' : '🌙'}</span>
          </button>
          <div className="nav-actions">
            {!user && (
              <NavLink to="/auth/sign-up" className="cta" onClick={closeMenu}>
                Join Branch Connect
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
