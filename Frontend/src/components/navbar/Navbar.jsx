import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './navbar.css'
import logo from '../../assets/bootcamp_logo_wo_bg.png'
import { useAuth } from '../../context/AuthContext'

const baseLinks = [
    { to: '/', label: 'HOME', end: true },
    { to: '/about', label: 'ABOUT' },
    { to: '/societies', label: 'SOCIETIES' }
]

const authedLinks = [
    { to: '/batches', label: 'BATCHES' },
    { to: '/chats', label: 'CHATS' },
    { to: '/profile', label: 'EDIT PROFILE' }
]

const guestLinks = [
    { to: '/auth/sign-in', label: 'SIGN IN' },
    { to: '/auth/sign-up', label: 'SIGN UP' }
]

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, initializing, signOut } = useAuth()

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

    const navLinks = useMemo(() => {
        const links = [...baseLinks]
        if (user) {
            links.push(...authedLinks)
        }
        if (!user && !initializing) {
            links.push(...guestLinks)
        }
        return links
    }, [user, initializing])

    const initials = useMemo(() => {
        if (!user) return null
        if (user.name) {
            return user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        }
        return user.email?.[0]?.toUpperCase() || null
    }, [user])

    const avatarUrl = user?.avatarUrl

    const handleSignOut = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Failed to sign out', error)
        } finally {
            closeMenu()
            navigate('/', { replace: true })
        }
    }

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

                <ul id="navbar-menu" className={`menu ${menuOpen ? 'menu--active' : ''}`}>
                    {navLinks.map(({ to, label, end }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                onClick={closeMenu}
                                className={({ isActive }) => `menu__link${isActive ? ' menu__link--active' : ''}`}
                                end={end}
                            >
                                {label}
                            </NavLink>
                        </li>
                    ))}

                    {!initializing && user && (
                        <li className="menu__account">
                            <NavLink
                                to="/profile"
                                onClick={closeMenu}
                                className={({ isActive }) => `menu__avatar-link${isActive ? ' menu__avatar-link--active' : ''}`}
                                aria-label="Edit your profile"
                            >
                                <span className="menu__avatar">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" aria-hidden />
                                    ) : (
                                        <span aria-hidden>{initials}</span>
                                    )}
                                </span>
                            </NavLink>
                            <button type="button" onClick={handleSignOut} className="menu__signout">
                                Sign out
                            </button>
                        </li>
                    )}
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