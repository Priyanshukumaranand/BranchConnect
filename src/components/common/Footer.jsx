import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="brand-mark">CE</span>
          <div>
            <h3>CE Bootcamp</h3>
            <p>Discover the next wave of computer engineering talent. Portfolios, passion projects, and campus communities in one place.</p>
          </div>
        </div>

        <div className="site-footer__grid">
          <div>
            <h4>Explore</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/societies">Societies</a></li>
              <li><a href="/batches">Batches</a></li>
              <li><a href="/resources">Placement resources</a></li>
              <li><a href="/exams">Exam resources</a></li>
              <li><a href="/enroll">Enroll</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:hello@cebootcamp.dev">Contact</a></li>
              <li><a href="/auth/forgot-password">Forgot password</a></li>
              <li><a href="/auth/sign-up">Join the bootcamp</a></li>
              <li><a href="/server-error" onClick={(e) => e.preventDefault()}>Status</a></li>
            </ul>
          </div>
          <div>
            <h4>Connect</h4>
            <ul className="footer-socials">
              <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href="https://github.com/Priyanshukumaranand" target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer">X</a></li>
            </ul>
          </div>
        </div>

        <div className="site-footer__meta">
          <p>© {new Date().getFullYear()} CE Bootcamp. Crafted with passion for the next generation of engineers.</p>
          <div className="footer-links" aria-label="Footer links">
            <a href="/" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="/" onClick={(e) => e.preventDefault()}>Terms</a>
            <a href="/" onClick={(e) => e.preventDefault()}>Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
