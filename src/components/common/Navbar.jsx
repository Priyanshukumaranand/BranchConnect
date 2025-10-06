import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import { useTheme } from '../../context/ThemeContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/societies', label: 'Societies' },
  { to: '/batches', label: 'Batches' },
  { to: '/resources', label: 'Resources' },
  { to: '/exams', label: 'Exams' },
  { to: '/enroll', label: 'Enroll' },
  { to: '/auth/sign-in', label: 'Sign In' }
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const closeMenu = () => setIsMenuOpen(false);
  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <header className="site-header" data-open={isMenuOpen}>
      <div className="site-header__inner">
        <NavLink to="/" className="brand" aria-label="CE Bootcamp home" onClick={closeMenu}>
          <span className="brand__logo" aria-hidden>CE</span>
          <span className="brand__text">Bootcamp</span>
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
            {links.map((link) => (
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
          <div className="nav-cta">
            <NavLink to="/auth/sign-up" className="cta" onClick={closeMenu}>
              Join Cohort
            </NavLink>
          </div>
        </nav>
      </div>
      <div className="site-header__backdrop" onClick={closeMenu} aria-hidden="true" />
    </header>
  );
};

export default Navbar;
