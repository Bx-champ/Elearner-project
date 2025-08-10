// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useContext, useState, useEffect } from 'react';
// import { AuthContext } from '../authContext';
// import { Menu, X } from 'lucide-react';

// import axios from 'axios';
// import { BASE_URL } from '../config';

// export default function AdminNavbar() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { user, logout } = useContext(AuthContext);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [pendingCount, setPendingCount] = useState(0);

//   const currentPath = location.pathname;

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   const toggleMenu = () => setMenuOpen(!menuOpen);
//   const closeMenu = () => setMenuOpen(false);

//   const navLinks = [
//     { path: '/admin/dashboard', label: 'Home' },
//     { path: '/admin/upload', label: 'Upload' },
//     { path: '/admin/access-requests', label: 'Requests' },
//     { path: '/admin/access-manager', label: 'Manager' },
//     { path: '/admin/activity-report', label: 'Activity' },
//     { path: '/admin/assign-chapters', label: 'Assign' },
//     { path: '/admin/notifications', label: 'notification' },
//     { path: '/admin/stats', label: 'stats' },
//   ];

//   // 🧠 Fetch request count
//   useEffect(() => {
//     const fetchPending = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/api/auth/admin/access-requests`, {
//           headers: { Authorization: `Bearer ${user?.token}` },
//         });
//         const pending = res.data.requests?.filter((r) => r.status === 'pending') || [];
//         setPendingCount(pending.length);
//       } catch (err) {
//         console.error('❌ Failed to fetch access requests:', err);
//       }
//     };

//     fetchPending();
//     const interval = setInterval(fetchPending, 20000); // auto-refresh every 20s
//     return () => clearInterval(interval);
//   }, [user]);

//   return (
//     <>
//       <div className="fixed top-0 left-0 w-full bg-[#f4f2ec] text-[#16355a] z-50 p-5 shadow-sm">
//         <div className="flex justify-between items-center">
//           {/* Left: Logo */}
//           <div className="text-xl font-bold basis-1/4 flex items-center">Admin</div>

//           {/* Center: Nav Links (Desktop) */}
//           <div className="hidden md:flex basis-1/2 justify-evenly gap-6 text-md relative">
//             {navLinks.map((link) => {
//               const isActive = currentPath === link.path;
//               const isRequestLink = link.path === '/admin/access-requests';

//               return (
//                 <Link
//                   key={link.path}
//                   to={link.path}
//                   className={`relative group cursor-pointer ${isActive ? 'text-[#4457ff] font-semibold' : ''}`}
//                 >
//                   {link.label}

//                   {/* ✅ Underline hover effect */}
//                   <span
//                     className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
//                       isActive ? 'w-full bg-[#4457ff]' : 'w-0 bg-black group-hover:w-full'
//                     }`}
//                   ></span>

//                   {/* ✅ Notification dot */}
//                   {isRequestLink && pendingCount > 0 && (
//                     <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full shadow animate-pulse">
//                       {pendingCount}
//                     </span>
//                   )}
//                 </Link>
//               );
//             })}
//           </div>

//           {/* Right: Logout & Menu */}
//           <div className="basis-1/4 flex justify-end items-center gap-4">
//             <div className="hidden md:block">
//               <button
//                 onClick={handleLogout}
//                 className="px-4 py-2 bg-[#4457ff] text-white rounded hover:bg-blue-700 transition"
//               >
//                 Logout
//               </button>
//             </div>
//             <div className="md:hidden">
//               <button onClick={toggleMenu}>
//                 {menuOpen ? <X size={28} /> : <Menu size={28} />}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {menuOpen && (
//           <div className="flex flex-col mt-4 gap-4 md:hidden text-lg relative z-50 animate-slide-down">
//             {navLinks.map((link) => {
//               const isActive = currentPath === link.path;
//               const isRequestLink = link.path === '/admin/access-requests';

//               return (
//                 <div className="relative" key={link.path}>
//                   <Link
//                     to={link.path}
//                     onClick={closeMenu}
//                     className={`relative group cursor-pointer px-2 ${
//                       isActive ? 'text-[#4457ff] font-semibold' : ''
//                     }`}
//                   >
//                     {link.label}
//                     <span
//                       className={`absolute left-0 -bottom-1 h-[2px] transition-all duration-300 ${
//                         isActive ? 'w-full bg-[#4457ff]' : 'w-0 bg-black group-hover:w-full'
//                       }`}
//                     ></span>
//                   </Link>

//                   {/* ✅ Mobile dot */}
//                   {isRequestLink && pendingCount > 0 && (
//                     <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-semibold px-1.5 rounded-full animate-pulse">
//                       {pendingCount}
//                     </span>
//                   )}
//                 </div>
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

//       {/* Mobile Blur Backdrop */}
//       {menuOpen && (
//         <div
//           onClick={closeMenu}
//           className="fixed top-0 left-0 w-full h-full backdrop-blur-md bg-black/10 z-40"
//         ></div>
//       )}
//     </>
//   );
// }



import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../authContext';
import { Menu, X, Bell } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config';
import logoImage from '../assets/logo3.png'; // Make sure this path is correct
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // All navigation links in one array
  const navLinks = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/upload', label: 'Upload' },
    { path: '/admin/access-requests', label: 'Requests' },
    { path: '/admin/access-manager', label: 'Manager' },
    { path: '/admin/activity-report', label: 'Activity' },
    { path: '/admin/assign-chapters', label: 'Assign' },
    { path: '/admin/stats', label: 'Stats' },
  ];

  useEffect(() => {
    if (!user?.token) return;
    const fetchPending = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/admin/access-requests`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const pending = res.data.requests?.filter((r) => r.status === 'pending') || [];
        setPendingCount(pending.length);
      } catch (err) {
        console.error('Failed to fetch access requests:', err);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 20000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg z-50 shadow-sm border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link to="/admin/dashboard" onClick={closeMenu}>
                        <img src={logoImage} alt="Logo" className="h-12 w-auto" />
                    </Link>
                </div>

                {/* Desktop Nav - All links in a row */}
                <div className="hidden md:flex items-center gap-4">
                    {navLinks.map((link) => (
                        <Link key={link.path} to={link.path} className={`relative px-2 py-1 rounded-md text-sm font-semibold transition-colors duration-300 ${ currentPath === link.path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600' }`}>
                            {link.label}
                            {link.path === '/admin/access-requests' && pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right side: Notifications and Logout */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/admin/notifications" className="relative text-gray-600 hover:text-blue-600">
                        <Bell size={22}/>
                    </Link>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-transform duration-300 transform hover:scale-105">
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/80 overflow-hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map((link) => {
                        const isRequestLink = link.path === '/admin/access-requests';
                        return (
                            <Link key={link.path} to={link.path} onClick={closeMenu} className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPath === link.path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <span>{link.label}</span>
                                {isRequestLink && pendingCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                    <div className="pt-4 mt-2 border-t border-gray-200">
                        <Link to="/admin/notifications" onClick={closeMenu} className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                            <span>Notifications</span>
                        </Link>
                        <button onClick={() => { handleLogout(); closeMenu(); }} className="mt-2 w-full text-center px-4 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition">
                            Logout
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    </>
  );
}