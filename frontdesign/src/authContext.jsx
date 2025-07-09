// src/authContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         // Full user object
  const [role, setRole] = useState(null);         // Role like 'user', 'admin', 'vendor'
  const [loading, setLoading] = useState(true);   // Controls when context is ready

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedRole) setRole(storedRole);

    setLoading(false); // Context ready
  }, []);

  const login = (userData, userRole) => {
  // Safety check
  if (typeof userData !== 'object') {
    console.warn("Expected user object but got:", userData);
    return;
  }

  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('role', userRole);

  setUser(userData);
  setRole(userRole);
};


  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
