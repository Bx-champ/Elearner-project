import { useContext , useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from './config'; 
import { useLocation } from 'react-router-dom'; // 🔸 import this
import './App.css';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthContext } from './authContext';
import VendorRegister from './pages/VendorRegister';
import VendorDashboard from './pages/VendorDashboard';
import VendorNavbar from './components/VendorNavbar';
import UserNavbar from './components/UserNavbar';
import AdminUploadFlow from './pages/AdminUploadFlow';
import EditBook from './pages/EditBook';
import AdminBookChapters from './pages/AdminBookChapters';
import UserBookChapters from './pages/UserBookChapters';
import ChapterPreview from './pages/ChapterPreview';
import AdminAccessRequests from './pages/AdminAccessRequests';
import AdminAccessManager from './pages/AdminAccessManager';
import AdminActivityDashboard from './pages/AdminActivityDashboard';
import MyFiles from './pages/MyFiles';
import AdminAssignChapters from './pages/AdminAssignChapters';
import UserNotifications from './pages/UserNotifications';
import AdminNotifications from './pages/AdminNotifications';
import UserProfile from './pages/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminStats from './pages/AdminStats';

function App() {
  const { role, user, loading } = useContext(AuthContext);
  const location = useLocation(); // 🔸 Get current path

   const token = user?.token;

  // This effect handles logging the user out on the backend when they close the browser/tab
   useEffect(() => {
    const handleTabClose = () => {
      if (token) {
        // --- FIX: Correctly format the data for sendBeacon ---
        const data = new Blob([JSON.stringify({ token: token })], { type: 'application/json' });
        navigator.sendBeacon(`${BASE_URL}/api/auth/logout`, data);
      }
    };

    window.addEventListener('beforeunload', handleTabClose);

    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [token]);

  // Show default Navbar on public pages, even if role exists
  const isPublicPage = ["/", "/signin", "/signup", "/about", "/contact", "/register/vendor"].includes(location.pathname);

  // Debug logs
  const DEBUG = false;
  if (DEBUG) {
    console.log("Location:", location.pathname);
    console.log("Role:", role);
  }

  if (loading) {
    return <div className="text-center mt-20 text-lg">⏳ Checking session...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f2ec] text-black">
      {/* Navbar Handling */}
      {isPublicPage ? (
        <Navbar />
      ) : role === 'admin' ? (
        <AdminNavbar />
      ) : role === 'user' ? (
        <UserNavbar />
      ) : role === 'vendor' ? (
        <VendorNavbar />
      ) : (
        <Navbar />
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/register/vendor" element={<VendorRegister />} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute><AdminUploadFlow /></ProtectedRoute>} />
        <Route path="/admin/edit/:id" element={<ProtectedRoute><EditBook /></ProtectedRoute>} />
        <Route path="/admin/book/:id" element={<ProtectedRoute><AdminBookChapters /></ProtectedRoute>} />
        <Route path="/user/book/:id" element={<ProtectedRoute><UserBookChapters /></ProtectedRoute>} />
        <Route path="/admin/book/:bookId/chapter/:chapterId/preview" element={<ProtectedRoute><ChapterPreview /></ProtectedRoute>} />
        <Route path="/preview/:bookId/:chapterId" element={<ProtectedRoute><ChapterPreview /></ProtectedRoute>} />
        <Route path="/admin/access-requests" element={<ProtectedRoute><AdminAccessRequests /></ProtectedRoute>} />
        <Route path="/admin/access-manager" element={<ProtectedRoute><AdminAccessManager /></ProtectedRoute>} />
        <Route path="/admin/activity-report" element={<ProtectedRoute><AdminActivityDashboard /></ProtectedRoute>} />
        <Route path="/admin/assign-chapters" element={<ProtectedRoute><AdminAssignChapters /></ProtectedRoute>} />
        <Route path="/myfiles" element={<ProtectedRoute><MyFiles /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
