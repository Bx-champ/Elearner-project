import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../authContext';



// import { AuthContext } from '../context/AuthContext';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();          // Clears localStorage and updates state
    navigate('/');     // Redirect to home or login
  };

  const navLinks = [
    { path: '/admin/dashboard', label: 'dashboard' },
    { path: '/admin/upload', label: 'upload PDFs' },
    { label: 'logout', action: handleLogout },
  ];

  return (
    <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5">
      <div className="flex justify-center gap-10 text-xl">
        {navLinks.map((link, idx) => {
          const isActive = link.path && currentPath === link.path;
          const baseClass = `relative group cursor-pointer ${
            isActive ? 'text-[#4457ff] font-semibold' : ''
          }`;

          return link.label === 'logout' ? (
            <button
              key={idx}
              onClick={link.action}
              className={`${baseClass} bg-transparent border-none outline-none`}
            >
              logout
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
            </button>
          ) : (
            <Link key={link.path} to={link.path} className={baseClass}>
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
    </div>
  );
}
