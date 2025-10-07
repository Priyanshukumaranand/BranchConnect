import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Societies from './pages/Societies';
import Batches from './pages/Batches';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ServerError from './pages/ServerError';
import NotFound from './pages/NotFound';
import PlacementResources from './pages/PlacementResources';
import ExamResources from './pages/ExamResources';
import RequireAuth from './components/common/RequireAuth';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="societies" element={<Societies />} />
        <Route
          path="batches"
          element={(
            <RequireAuth>
              <Batches />
            </RequireAuth>
          )}
        />
        <Route
          path="profile"
          element={(
            <RequireAuth>
              <Profile />
            </RequireAuth>
          )}
        />
        <Route path="resources" element={<PlacementResources />} />
        <Route path="exams" element={<ExamResources />} />

        <Route path="auth">
          <Route index element={<Navigate to="sign-in" replace />} />
          <Route path="sign-in" element={<SignIn />} />
          <Route path="sign-up" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;