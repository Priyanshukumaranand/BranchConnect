import React from 'react'
import style from './navbar.css'
import logo from '../../assets/bootcamp_logo_wo_bg.png'
import { Link } from 'react-router-dom'
const Navbar = () => {
  return (
    <div className={style.Navbar}>
    <header>

<nav class="navbar">
    <div class="logo">
        <img src={logo} alt=""/>
        <p>Bootcamp</p>
    </div>
    <ul class="menu">
   
        <li><a><Link to="/home">HOME</Link></a></li>
        <li><a><Link to="/about">ABOUT</Link></a></li>
        <li><a><Link to="/login">LOGIN</Link></a></li>
        {/* <li class="dropdown">
            <a href="javascript:void(0)" class="dropbtn">BATCH</a>
            <div class="dropdown-content">
                <a href="#">2026</a>
                <a href="#">2027</a>
                <a href="#">2028</a>
            </div>
        </li> */}
        <li><a ><Link to="/society">SOCIETY</Link></a></li>
    </ul>
    <div class="menu-btn">
        <i class="fa-solid fa-bars"></i>
    </div>
</nav>

</header>
</div>
  )
}

export default Navbar