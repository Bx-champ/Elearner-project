// src/authContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => localStorage.getItem('role'));

  const login = (newRole) => {
    localStorage.setItem('role', newRole);
    setRole(newRole); // ✅ Trigger re-render
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole(null); // ✅ Trigger re-render
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
