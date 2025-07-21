import { StrictMode } from 'react'
import React from 'react';

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './authContext.jsx'
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
    <App />
    </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
