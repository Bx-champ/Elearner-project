import React from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔒 Redirect if not logged in
  if (!user || !user.token) {
    return (
    <Navigate to="/" replace />

    
    );
  }

  return children;
}
