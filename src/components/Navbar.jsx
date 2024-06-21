import React from 'react'
import './navbar.css'
import logo from '../assets/bootcamp_logo_wo_bg.png'

const Navbar = () => {
  return (
    <header>

<nav class="navbar">
    <div class="logo">
        <img src={logo} alt=""/>
        <p>Bootcamp</p>
    </div>
    <ul class="menu">
        <li><a href="#">HOME</a></li>
        <li><a href="/About_Page/index.html">ABOUT</a></li>
        {/* <li class="dropdown">
            <a href="javascript:void(0)" class="dropbtn">BATCH</a>
            <div class="dropdown-content">
                <a href="#">2026</a>
                <a href="#">2027</a>
                <a href="#">2028</a>
            </div>
        </li> */}
        <li><a href="/society/index.html">SOCIETY</a></li>
    </ul>
    <div class="menu-btn">
        <i class="fa-solid fa-bars"></i>
    </div>
</nav>

</header>
  )
}

export default Navbar