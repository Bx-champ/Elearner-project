// // src/authContext.jsx
// import { createContext, useState, useEffect } from 'react';

// export const AuthContext = createContext();

// // ✅ Helper to check if token is expired
// const isTokenExpired = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     return payload.exp * 1000 < Date.now(); // exp is in seconds
//   } catch (err) {
//     console.warn('Invalid token:', err);
//     return true;
//   }
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);         // Full user object
//   const [role, setRole] = useState(null);         // Role like 'user', 'admin', 'vendor'
//   const [loading, setLoading] = useState(true);   // Controls when context is ready

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     const storedRole = localStorage.getItem('role');

//     if (storedUser && storedRole) {
//       const parsedUser = JSON.parse(storedUser);
//       const token = parsedUser?.token;

//       if (token && !isTokenExpired(token)) {
//         setUser(parsedUser);
//         setRole(storedRole);
//       } else {
//         console.warn('🔒 Token expired or invalid, logging out.');
//         localStorage.removeItem('user');
//         localStorage.removeItem('role');
//       }
//     }

//     setLoading(false); // Context ready
//   }, []);

//   const login = (userData, userRole) => {
//     if (typeof userData !== 'object') {
//       console.warn("Expected user object but got:", userData);
//       return;
//     }

//     localStorage.setItem('user', JSON.stringify(userData));
//     localStorage.setItem('role', userRole);

//     setUser(userData);
//     setRole(userRole);
//   };

//   const logout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('role');
//     setUser(null);
//     setRole(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, role, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };



// src/authContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Helper to check if token is expired
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now(); // exp is in seconds
  } catch (err) {
    console.warn('Invalid token:', err);
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedUser && storedRole) {
      const parsedUser = JSON.parse(storedUser);
      const token = parsedUser?.token;

      if (token && !isTokenExpired(token)) {
        setUser(parsedUser);
        setRole(storedRole);
      } else {
        console.warn('🔒 Token expired or invalid, logging out.');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, userRole) => {
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

  // =========================================================
  // ===== NEW FUNCTION TO UPDATE USER DETAILS =====
  // =========================================================
  const updateUser = (updatedDetails) => {
    // 1. Get current user data from state
    const updatedUser = { ...user, ...updatedDetails };
    
    // 2. Update the state
    setUser(updatedUser);

    // 3. Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };


  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateUser }}>
      {/* ===== ADDED updateUser to the context value ===== */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
