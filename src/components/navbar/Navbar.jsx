import React from 'react'
import style from './navbar.css'
import logo from '../../assets/bootcamp_logo_wo_bg.png'
import { Link } from 'react-router-dom'
const Navbar = () => {
  return (
    <div className={style.Navbar}>
    <header>

<nav className="navbar">
    <div className="logo">
        <img src={logo} alt=""/>
        <p>Bootcamp</p>
    </div>
    <ul className="menu">
   
        <li><Link to="/home">HOME</Link></li>
        <li><Link to="/about">ABOUT</Link></li>
        <li><Link to="/login">LOGIN</Link></li>
        {/* <li class="dropdown">
            <a href="javascript:void(0)" class="dropbtn">BATCH</a>
            <div class="dropdown-content">
                <a href="#">2026</a>
                <a href="#">2027</a>
                <a href="#">2028</a>
            </div>
        </li> */}
        <li><Link to="/society">SOCIETY</Link></li>
    </ul>
    <div className="menu-btn">
        <i className="fa-solid fa-bars"></i>
    </div>
</nav>

</header>
</div>
  )
}

export default Navbar