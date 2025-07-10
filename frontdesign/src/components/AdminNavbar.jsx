import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../authContext';
import { Menu, X } from 'lucide-react';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { path: '/admin/dashboard', label: 'Home' },
    { path: '/admin/upload', label: 'Upload' },
    { path: '/admin/access-requests', label: 'Requests' },
    { path: '/admin/access-manager', label: 'Manager' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5 shadow-sm">
        <div className="flex justify-between items-center">
          {/* Left: Logo */}
          <div className="text-xl font-bold basis-1/4 flex items-center">📚 Admin</div>

          {/* Center: Nav Links (Desktop only) */}
          <div className="hidden md:flex basis-1/2 justify-evenly gap-6 text-md">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative group cursor-pointer ${
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
          </div>

          {/* Right: Logout Button (Desktop) & Menu (Mobile) */}
          <div className="basis-1/4 flex justify-end items-center gap-4">
            <div className="hidden md:block">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
              >
                Logout
              </button>
            </div>
            <div className="md:hidden">
              <button onClick={toggleMenu}>
                {menuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="flex flex-col mt-4 gap-4 md:hidden text-lg relative z-50 animate-slide-down">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`relative group cursor-pointer px-2 ${
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

      {/* Mobile Backdrop Blur Overlay */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed top-0 left-0 w-full h-full backdrop-blur-md bg-black/10 z-40"
        ></div>
      )}
    </>
  );
}
