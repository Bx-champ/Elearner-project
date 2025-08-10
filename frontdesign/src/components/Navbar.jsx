// import { Link, useLocation } from 'react-router-dom';
// import { useState } from 'react';
// import { Menu, X } from 'lucide-react';
// import logoImage from '../assets/logo3.png'; 

// export default function Navbar() {
//   const location = useLocation();
//   const currentPath = location.pathname;
//   const [menuOpen, setMenuOpen] = useState(false);

//   const navLinks = [
//     { path: '/', label: 'Home' },
//     { path: '/about', label: 'About Us' },
//     { path: '/contact', label: 'Contact Us' },
//     { path: '/signin', label: 'Sign In' },
//     { path: '/signup', label: 'Sign Up' },
//   ];

//   const toggleMenu = () => setMenuOpen(!menuOpen);
//   const closeMenu = () => setMenuOpen(false);

//   const NavItem = ({ path, label }) => {
//     const isActive = currentPath === path;

//     return (
//       <Link to={path} onClick={closeMenu}>
//         <div
//           className={`relative px-2 py-1 rounded transition-all duration-300 text-lg font-medium ${
//             isActive
//               ? 'text-[#4457ff]'
//               : 'text-[#16355a] hover:text-white hover:shadow-[0_0_10px_2px_rgba(68,87,255,0.5)] hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500'
//           }`}
//         >
//           {label}
//         </div>
//       </Link>
//     );
//   };

//   return (
//     <>
//       <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5 shadow-md">
//         <div className="flex justify-between items-center md:flex">
//           {/* Logo */}
//           {/* <div className="text-2xl font-extrabold basis-1/4 md:basis-1/8 lg:basis-1/4">LOGO</div> */}
//           <div className="basis-1/4 md:basis-1/8 lg:basis-1/4 flex items-center  h-8">
//   <a href="/"> <img src={logoImage} alt="Logo" className="h-16 w-auto object-contain"/>
//   </a>
// </div>

//           {/* Hamburger Icon for Mobile */}
//           <div className="md:hidden">
//             <button onClick={toggleMenu}>
//               {menuOpen ? <X size={28} /> : <Menu size={28} />}
//             </button>
//           </div>

//           {/* Nav Links - Desktop */}
//           <div className="hidden md:flex basis-1/2 md:basis-6/8 lg:basis-1/2 justify-evenly gap-6 text-lg px-6">
//             {navLinks.map((link) => (
//               <NavItem key={link.path} path={link.path} label={link.label} />
//             ))}
//           </div>

//           {/* Vendor Register Button - Desktop */}
//           <div className="basis-1/4 md:basis-1/8 lg:basis-1/4 hidden md:flex justify-end">
//             <Link
//               to="/register/vendor"
//               onClick={closeMenu}
//               className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded shadow hover:shadow-lg transition-all duration-300"
//             >
//               Register as Vendor
//             </Link>
//           </div>
//         </div>

//         {/* Mobile Dropdown */}
//         {menuOpen && (
//           <div className="flex flex-col mt-4 gap-4 md:hidden text-lg relative z-50">
//             {navLinks.map((link) => (
//               <NavItem key={link.path} path={link.path} label={link.label} />
//             ))}
//             <Link
//               to="/register/vendor"
//               onClick={closeMenu}
//               className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded shadow hover:shadow-lg transition-all duration-300"
//             >
//               Register as Vendor
//             </Link>
//           </div>
//         )}
//       </div>

//       {/* Glass Blur Overlay */}
//       {menuOpen && (
//         <div
//           onClick={closeMenu}
//           className="fixed top-0 left-0 w-full h-full backdrop-blur-md bg-black/10 z-40"
//         ></div>
//       )}
//     </>
//   );
// }




import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext';
import { NotificationContext } from '../context/NotificationContext';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from '../assets/logo3.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact Us' },
  ];

  const loggedOutLinks = [
    { path: '/signin', label: 'Sign In' },
  ];

  const loggedInLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/notifications', label: 'Notifications' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg z-50 shadow-sm border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex-shrink-0">
              <Link to={user ? "/dashboard" : "/"} onClick={closeMenu}>
                <img src={logoImage} alt="Logo" className="h-12 w-auto" />
              </Link>
            </div>

            <div className="hidden md:flex gap-6 items-center">
              {publicLinks.map(link => (
                <Link key={link.path} to={link.path} className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-300 ${currentPath === link.path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  {loggedInLinks.map(link => (
                    <Link key={link.path} to={link.path} className={`relative px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-300 ${currentPath === link.path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                      {link.label}
                      {link.path === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="ml-4 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-transform duration-300 transform hover:scale-105">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {loggedOutLinks.map(link => (
                    <Link key={link.path} to={link.path} className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-300 ${currentPath === link.path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                      {link.label}
                    </Link>
                  ))}
                   <Link to="/signup" className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105">
                    Sign Up
                  </Link>
                  {/* ===== VENDOR BUTTON ADDED BACK ===== */}
                  <Link to="/register/vendor" className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-md hover:bg-purple-700 transition-transform duration-300 transform hover:scale-105">
                    Register as Vendor
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={toggleMenu} className="p-2 rounded-md text-gray-600 hover:bg-gray-200">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/80 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {[...publicLinks, ...(user ? loggedInLinks : loggedOutLinks)].map(link => (
                <Link key={link.path} to={link.path} onClick={closeMenu} className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPath === link.path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <span>{link.label}</span>
                  {link.path === '/notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-gray-200">
                {user ? (
                  <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full text-center px-4 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition">
                    Logout
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/signup" onClick={closeMenu} className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition">
                      Sign Up
                    </Link>
                    {/* ===== VENDOR BUTTON ADDED BACK ===== */}
                    <Link to="/register/vendor" onClick={closeMenu} className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 transition">
                      Register as Vendor
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
        ></div>
      )}
    </>
  );
}