import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'home' },
    { path: '/about', label: 'about us' },
    { path: '/contact', label: 'contact us' },
    { path: '/signin', label: 'sign in' },
    { path: '/signup', label: 'sign up' },
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5">
        <div className="flex justify-between items-center md:flex">
          {/* Logo */}
          <div className="text-2xl font-bold basis-1/4 md:basis-1/8 lg:basis-1/4 flex-shrink">LOGO</div>

          {/* Hamburger Icon for Mobile */}
          <div className="md:hidden">
            <button onClick={toggleMenu}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Nav Links - Desktop */}
         <div className="hidden md:flex basis-1/2 md:basis-6/8 lg:basis-1/2 flex-shrink-0 justify-evenly gap-10 lg:gap-6 md:gap-2 sm:gap-2 text-xl px-6">

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
                  <span>{link.label}</span>
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

          {/* Vendor Register Button - Desktop only */}
          <div className="basis-1/4 md:basis-1/8 lg:basis-1/4 flex justify-end hidden md:flex">
            <Link
              to="/register/vendor"
              onClick={closeMenu}
              className="px-4 py-2 text-center bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
            >
              Register as Vendor
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="flex flex-col mt-4 gap-4 md:hidden text-xl relative z-50 animate-slide-down">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`relative group cursor-pointer ${
                    isActive ? 'text-[#4457ff] font-semibold' : ''
                  }`}
                >
                  <span>{link.label}</span>
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

            {/* Vendor Register Button - Mobile */}
            <Link
              to="/register/vendor"
              onClick={closeMenu}
              className="px-4 py-2 text-center bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
            >
              Register as Vendor
            </Link>
          </div>
        )}
      </div>

      {/* Glass Blur Overlay */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed top-0 left-0 w-full h-full backdrop-blur-md bg-black/10 z-40"
        ></div>
      )}
    </>
  );
}
