import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './navbar.css'
import logo from '../../assets/bootcamp_logo_wo_bg.png'

const links = [
    { to: '/home', label: 'HOME' },
    { to: '/about', label: 'ABOUT' },
    { to: '/login', label: 'LOGIN' },
    { to: '/society', label: 'SOCIETY' }
]

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

    const toggleMenu = () => setMenuOpen((open) => !open)
    const closeMenu = () => setMenuOpen(false)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 991 && menuOpen) {
                setMenuOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [menuOpen])

    useEffect(() => {
        closeMenu()
    }, [location.pathname])

    return (
        <header className="navbar-wrapper">
            <nav className="navbar" aria-label="Primary navigation">
                <div className="logo">
                    <img src={logo} alt="CE Bootcamp" />
                    <p>Bootcamp</p>
                </div>

                <button
                    type="button"
                    className={`menu-btn ${menuOpen ? 'menu-btn--active' : ''}`}
                    aria-expanded={menuOpen}
                    aria-controls="navbar-menu"
                    aria-label="Toggle navigation menu"
                    onClick={toggleMenu}
                >
                    <span className="menu-btn__bar" />
                    <span className="menu-btn__bar" />
                    <span className="menu-btn__bar" />
                </button>

                <ul
                    id="navbar-menu"
                    className={`menu ${menuOpen ? 'menu--active' : ''}`}
                >
                    {links.map(({ to, label }) => (
                        <li key={to}>
                            <Link to={to} onClick={closeMenu}>
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div
                className={`menu-overlay ${menuOpen ? 'menu-overlay--visible' : ''}`}
                onClick={closeMenu}
                role="presentation"
            />
        </header>
    )
}

export default Navbar