import React from 'react';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import './MainLayout.css';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main" role="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
