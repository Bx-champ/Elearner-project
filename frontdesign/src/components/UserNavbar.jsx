import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext';
import { Menu, X } from 'lucide-react';
import axios from 'axios';
import socket from '../socket';


// const socket = io('http://localhost:5000', {
//   withCredentials: true
// }); // update to your backend server if needed

export default function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Fetch unread count once on load
  useEffect(() => {
    const fetchUnread = async () => {
      if (!user?.token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/auth/user/notifications', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchUnread();

    if (user?._id) {
      socket.emit('register', user._id); // 👈 Register user to socket room
    }

    // Listen for new notifications in real-time
    socket.on('notification', () => {
      setUnreadCount(prev => prev + 1); // Increment count on push
    });

    return () => {
      socket.off('notification');
    };
  }, [user]);

  const navLinks = [
    { path: '/dashboard', label: 'dashboard' },
    { path: '/profile', label: 'profile' },
    { path: '/myfiles', label: 'my files' },
    {
      path: '/notifications',
      label: (
        <span className="relative">
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-ping-slow">
              {unreadCount}
            </span>
          )}
        </span>
      )
    },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5">
        <div className="flex justify-between items-center md:flex">
          <div className="text-2xl font-bold basis-1/4 md:basis-1/8 lg:basis-1/4 flex-shrink">
            USER
          </div>

          <div className="md:hidden">
            <button onClick={toggleMenu}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          <div className="hidden md:flex basis-1/2 md:basis-6/8 lg:basis-1/2 justify-evenly gap-10 text-xl px-6">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={typeof link.label === 'string' ? link.label : link.path}
                  to={link.path}
                  className={`relative group cursor-pointer ${
                    isActive ? 'text-[#4457ff] font-semibold' : ''
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
                      isActive ? 'w-full bg-[#4457ff]' : 'w-0 bg-black group-hover:w-full'
                    }`}
                  ></span>
                </Link>
              );
            })}
          </div>

          <div className="basis-1/4 md:basis-1/8 lg:basis-1/4 flex justify-end hidden md:flex">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="flex flex-col mt-4 gap-4 md:hidden text-xl relative z-50 animate-slide-down">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={typeof link.label === 'string' ? link.label : link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`relative group cursor-pointer ${
                    isActive ? 'text-[#4457ff] font-semibold' : ''
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
                      isActive ? 'w-full bg-[#4457ff]' : 'w-0 bg-black group-hover:w-full'
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

      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed top-0 left-0 w-full h-full backdrop-blur-md bg-black/10 z-40"
        ></div>
      )}
    </>
  );
}
