// import React, { useState, useContext } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../authContext';
// import { NotificationContext } from '../context/NotificationContext';
// import { Menu, X } from 'lucide-react';

// export default function UserNavbar() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { logout, user } = useContext(AuthContext);
//   const { unreadCount } = useContext(NotificationContext);

//   const [menuOpen, setMenuOpen] = useState(false);

//   const currentPath = location.pathname;

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   const toggleMenu = () => setMenuOpen(!menuOpen);
//   const closeMenu = () => setMenuOpen(false);

//   const navLinks = [
//     { path: '/dashboard', label: 'Dashboard' },
//     { path: '/profile', label: 'Profile' },
//     { path: '/myfiles', label: 'My Files' },
//     {
//       path: '/notifications',
//       label: (
//         <span className="relative">
//           Notifications
//           {unreadCount > 0 && (
//             <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
//               {unreadCount}
//             </span>
//           )}
//         </span>
//       ),
//     },
//   ];

//   return (
//     <>
//       <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5 shadow-md">
//         <div className="flex justify-between items-center">
//           {/* Logo or Brand */}
//           <div className="text-2xl font-bold">USER</div>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex gap-8 items-center text-lg">
//             {navLinks.map(link => {
//               const isActive = currentPath === link.path;
//               return (
//                 <Link
//                   key={link.path}
//                   to={link.path}
//                   className={`relative group ${
//                     isActive ? 'text-[#4457ff] font-semibold' : ''
//                   }`}
//                 >
//                   {link.label}
//                   <span
//                     className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
//                       isActive
//                         ? 'w-full bg-[#4457ff]'
//                         : 'w-0 bg-black group-hover:w-full'
//                     }`}
//                   ></span>
//                 </Link>
//               );
//             })}
//             <button
//               onClick={handleLogout}
//               className="ml-6 px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
//             >
//               Logout
//             </button>
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden">
//             <button onClick={toggleMenu}>
//               {menuOpen ? <X size={28} /> : <Menu size={28} />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {menuOpen && (
//           <div className="flex flex-col mt-4 gap-4 md:hidden text-lg animate-slide-down">
//             {navLinks.map(link => {
//               const isActive = currentPath === link.path;
//               return (
//                 <Link
//                   key={link.path}
//                   to={link.path}
//                   onClick={closeMenu}
//                   className={`relative group ${
//                     isActive ? 'text-[#4457ff] font-semibold' : ''
//                   }`}
//                 >
//                   {link.label}
//                   <span
//                     className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
//                       isActive
//                         ? 'w-full bg-[#4457ff]'
//                         : 'w-0 bg-black group-hover:w-full'
//                     }`}
//                   ></span>
//                 </Link>
//               );
//             })}
//             <button
//               onClick={() => {
//                 handleLogout();
//                 closeMenu();
//               }}
//               className="px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
//             >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Backdrop overlay for mobile menu */}
//       {menuOpen && (
//         <div
//           onClick={closeMenu}
//           className="fixed top-0 left-0 w-full h-full backdrop-blur-sm bg-black/20 z-40"
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

export default function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // --- Refactored navLinks to use simple strings ---
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'Profile' },
    { path: '/myfiles', label: 'My Files' },
    { path: '/notifications', label: 'Notifications' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg z-50 shadow-sm border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo */}
                <div className="flex-shrink-0">
                    <Link to="/dashboard" onClick={closeMenu}>
                        <img src={logoImage} alt="Logo" className="h-12 w-auto" />
                    </Link>
                </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex gap-6 items-center">
                {navLinks.map(link => {
                  const isActive = currentPath === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-300 ${
                        isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {link.label}
                      {/* --- Conditionally render notification badge --- */}
                      {link.path === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={toggleMenu} className="p-2 rounded-md text-gray-600 hover:bg-gray-200">
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/80 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMenu}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <span>{link.label}</span>
                    {link.path === '/notifications' && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Link>
              );
            })}
            <div className="pt-4 mt-2 border-t border-gray-200">
                <button
                    onClick={() => {
                        handleLogout();
                        closeMenu();
                    }}
                    className="w-full text-center px-4 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
           </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
        ></div>
      )}
    </>
  );
}