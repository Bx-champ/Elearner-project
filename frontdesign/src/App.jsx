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

function App() {
  const { role } = useContext(AuthContext);
  console.log(role);

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

      </Routes>
    </div>
  );
}

export default App;
