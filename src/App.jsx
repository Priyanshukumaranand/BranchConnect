import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Link } from 'react-router-dom';
import Navbar from './components/navbar/Navbar'
import About from './components/about/About'
import Login from './components/login/Login'
import Society from './components/society/Society'
import HomePage from './components/homepage/HomePage'
import Footer from './components/footer/Footer'
const App = () => {
  return (
 <div>
    <Navbar/>
      <Routes>
          <Route index element={<Login />} />
          <Route path="home" element={<HomePage />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="society" element={<Society />} />
      </Routes>
   
    <Footer/>
 </div>
   
   
  )
}

export default App