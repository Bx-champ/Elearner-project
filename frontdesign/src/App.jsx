import { useContext } from 'react';
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
import AdminUpload from './pages/AdminUpload';
import AdminUploadFlow from './pages/AdminUploadFlow';
import EditBook from './pages/EditBook';
import AdminBookChapters from './pages/AdminBookChapters';
import UserBookChapters from './pages/UserBookChapters';
import ChapterPreview from './pages/ChapterPreview';
import AdminAccessRequests from './pages/AdminAccessRequests';
import AdminAccessManager from './pages/AdminAccessManager';

function App() {
  const { role, user, loading } = useContext(AuthContext);

  console.log("Role from AuthContext:", role);
console.log("User from AuthContext:", user);
console.log("Loading status:", loading);


  if (loading) return <div className="text-center mt-20 text-lg">Loading...</div>;
  return (
    <div className="min-h-screen bg-[#f4f2ec] text-black">
      {role === 'admin' && <AdminNavbar />}
      {role === 'user' && <UserNavbar />}
      {role === 'vendor' && <VendorNavbar />}
      {role === null && <Navbar/>}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/register/vendor" element={<VendorRegister />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/admin/upload" element={<AdminUploadFlow />} />
        <Route path="/admin/edit/:id" element={<EditBook />} />
        <Route path="/admin/book/:id" element={<AdminBookChapters />} />
        <Route path="/user/book/:id" element={<UserBookChapters />} />
        <Route path="/admin/book/:bookId/chapter/:chapterId/preview" element={<ChapterPreview />} />
        <Route path="/admin/access-requests" element={<AdminAccessRequests />} />
        <Route path="/preview/:bookId/:chapterId" element={<ChapterPreview />} />
        <Route path="/admin/access-manager" element={<AdminAccessManager />} />

      </Routes>
    </div>
  );
}

export default App;
