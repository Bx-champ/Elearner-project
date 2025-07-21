import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext';
import { NotificationContext } from '../context/NotificationContext';
import { Menu, X } from 'lucide-react';

export default function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);

  const [menuOpen, setMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'Profile' },
    { path: '/myfiles', label: 'My Files' },
    {
      path: '/notifications',
      label: (
        <span className="relative">
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5 shadow-md">
        <div className="flex justify-between items-center">
          {/* Logo or Brand */}
          <div className="text-2xl font-bold">USER</div>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 items-center text-lg">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative group ${
                    isActive ? 'text-[#4457ff] font-semibold' : ''
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
                      isActive
                        ? 'w-full bg-[#4457ff]'
                        : 'w-0 bg-black group-hover:w-full'
                    }`}
                  ></span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="ml-6 px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="flex flex-col mt-4 gap-4 md:hidden text-lg animate-slide-down">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`relative group ${
                    isActive ? 'text-[#4457ff] font-semibold' : ''
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
                      isActive
                        ? 'w-full bg-[#4457ff]'
                        : 'w-0 bg-black group-hover:w-full'
                    }`}
                  ></span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Backdrop overlay for mobile menu */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed top-0 left-0 w-full h-full backdrop-blur-sm bg-black/20 z-40"
        ></div>
      )}
    </>
  );
}
