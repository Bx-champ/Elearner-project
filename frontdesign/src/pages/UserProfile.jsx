import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import { UserCircle, Lock, Library, Hourglass, CheckCircle, Settings, ChevronDown, BookOpen, BarChart2, FileCheck } from 'lucide-react';
import { BASE_URL } from '../config';
import moment from 'moment';
import { Link } from 'react-router-dom';

// --- Reusable Components ---
const NavLink = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full text-left gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${ isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-100 hover:text-blue-700' }`}>
    {icon}<span>{label}</span>
  </button>
);

const MobileNavLink = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
      {icon}<span className="text-[10px] font-medium">{label}</span>
    </button>
);

const InfoCard = ({ children, className = '' }) => (
    <div className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all duration-300 ${className}`}>
        {children}
    </div>
);

const StatCard = ({ icon, value, label }) => (
    <div className="text-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        {icon}
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
    </div>
);

const EmptyState = ({icon, title, message, ctaLink, ctaText}) => (
    <InfoCard className="text-center flex flex-col items-center py-10">
        <div className="bg-gray-100 p-4 rounded-full mb-4">{icon}</div>
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm mb-5">{message}</p>
        {ctaLink && ctaText && (
            <Link to={ctaLink} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {ctaText}
            </Link>
        )}
    </InfoCard>
);


// --- Main Profile Component ---
export default function UserProfile() {
  const { user, updateUser } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('overview');
  const [openBookId, setOpenBookId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedBooks, setApprovedBooks] = useState([]);
  const [assignedBooks, setAssignedBooks] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);
  const [newName, setNewName] = useState(user?.name || '');
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState({ text: '', isError: false, type: '' });

  const token = user?.token;
  const totalApprovedChapters = approvedBooks.reduce((total, book) => total + (book.chapters?.length || 0), 0);
  const handleToggleBook = (bookId) => { setOpenBookId(prevOpenBookId => (prevOpenBookId === bookId ? null : bookId)); };

  useEffect(() => {
    setNewName(user?.name || '');
    if (!token) return;
    const fetchData = async () => {
      try {
        const [pendingRes, approvedRes, assignedRes, activityRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/user/pending-requests`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/api/auth/user/chapter-access/all`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/api/auth/user/assigned-books`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/api/auth/user/last-activity`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setPendingRequests(pendingRes.data.pending || []);
        setApprovedBooks(approvedRes.data.books || []);
        setAssignedBooks(assignedRes.data.books || []);
        setLastActivity(activityRes.data.data);
      } catch (err) { console.error('Failed to fetch profile data', err); }
    };
    fetchData();
  }, [token, user]);

  const handleNameChange = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false, type: '' });
    if (!newName || newName.trim() === user.name) {
        setMessage({ text: 'Please enter a new name.', isError: true, type: 'name' });
        return;
    }
    try {
        const res = await axios.put(`${BASE_URL}/api/auth/user/update-details`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
        updateUser(res.data.user);
        setMessage({ text: res.data.message, isError: false, type: 'name' });
    } catch (err) {
        setMessage({ text: err.response?.data?.message || 'An error occurred.', isError: true, type: 'name' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false, type: '' });
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setMessage({ text: 'Please fill out both password fields.', isError: true, type: 'password' });
      return;
    }
    try {
      const res = await axios.put(`${BASE_URL}/api/auth/user/change-password`, passwordData, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ text: res.data.message, isError: false, type: 'password' });
      setPasswordData({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'An error occurred.', isError: true, type: 'password' });
    }
  };
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white p-4">
        <div className="flex flex-col items-center text-center p-4 border-b mb-6">
            <UserCircle size={64} className="text-blue-500 mb-3" />
            <h2 className="text-lg font-bold text-gray-800 truncate w-full">{user?.name}</h2>
            <p className="text-xs text-gray-500 truncate w-full">{user?.email}</p>
        </div>
        <nav className="flex flex-col gap-2">
            <NavLink label="Overview" icon={<BarChart2 size={18}/>} isActive={activeSection === 'overview'} onClick={() => setActiveSection('overview')} />
            <NavLink label="Pending Requests" icon={<Hourglass size={18}/>} isActive={activeSection === 'pending'} onClick={() => setActiveSection('pending')} />
            <NavLink label="Approved Access" icon={<CheckCircle size={18}/>} isActive={activeSection === 'approved'} onClick={() => setActiveSection('approved')} />
            <NavLink label="Assigned Access" icon={<Library size={18}/>} isActive={activeSection === 'assigned'} onClick={() => setActiveSection('assigned')} />
            <NavLink label="Account Settings" icon={<Settings size={18}/>} isActive={activeSection === 'settings'} onClick={() => setActiveSection('settings')} />
        </nav>
    </div>
  );
  
  const renderContent = () => {
    if (activeSection === 'overview') {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Hourglass size={32} className="text-yellow-500 mx-auto"/>} value={pendingRequests.length} label="Pending Requests"/>
            <StatCard icon={<CheckCircle size={32} className="text-green-500 mx-auto"/>} value={approvedBooks.length} label="Approved Books"/>
            <StatCard icon={<FileCheck size={32} className="text-cyan-500 mx-auto"/>} value={totalApprovedChapters} label="Approved Chapters"/>
            <StatCard icon={<Library size={32} className="text-purple-500 mx-auto"/>} value={assignedBooks.length} label="Assigned Books"/>
          </div>
          {lastActivity ? (
            <InfoCard>
              <h3 className="font-bold text-gray-800 mb-2">Continue Reading</h3>
              <div className="border-l-4 border-blue-500 pl-4"><p className="font-semibold">{lastActivity.bookName}</p><p className="text-gray-600">{lastActivity.chapterName}</p><p className="text-xs text-gray-400 mt-1">Last accessed {moment(lastActivity.lastActive).fromNow()}</p></div>
            </InfoCard>
          ) : (
            <EmptyState icon={<BookOpen size={32} className="text-gray-400"/>} title="Start Your Journey" message="You haven't read any chapters yet. Dive into your library!" ctaLink="/dashboard" ctaText="Browse Books"/>
          )}
        </div>
      );
    }
    if (activeSection === 'pending') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Requests</h2>
          {pendingRequests.length > 0 ? pendingRequests.map((req, idx) => (
            <InfoCard key={idx}><p className="font-bold text-gray-800">Book Request: {req.bookName}</p><p className="text-sm text-gray-500">Requested {moment(req.requestedAt).format('LLL')}</p></InfoCard>
          )) : <EmptyState icon={<Hourglass size={32} className="text-gray-400"/>} title="No Pending Requests" message="You're all caught up!"/>}
        </div>
      );
    }
    if (activeSection === 'approved') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Approved Access</h2>
          {approvedBooks.length > 0 ? approvedBooks.map((book) => {
            const isOpen = openBookId === book._id;
            return (
              <div key={book._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                <button onClick={() => handleToggleBook(book._id)} className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50">
                  <div><p className="font-bold text-gray-800">{book.name}</p><p className="text-sm text-gray-500">{book.chapters.length} chapter(s) approved</p></div>
                  <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 border-t"><ul className="list-disc list-inside text-gray-600 text-sm pl-2 space-y-2">{book.chapters.map(chapter => <li key={chapter._id}>{chapter.name}</li>)}</ul></div>
                )}
              </div>
            )
          }) : <EmptyState icon={<CheckCircle size={32} className="text-gray-400"/>} title="No Approved Books" message="Once an admin approves your request, your books will appear here." ctaLink="/browse-books" ctaText="Request Access"/>}
        </div>
      );
    }
    if (activeSection === 'assigned') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Assigned Access</h2>
          {assignedBooks.length > 0 ? assignedBooks.map((book) => (
            <InfoCard key={book._id}><p className="font-bold text-gray-800">{book.name}</p><div className="mt-2 space-y-2">{book.chapters.map(ch => (<div key={ch._id} className="text-sm border-l-2 border-purple-300 pl-3"><span className="text-gray-700">{ch.name}</span><p className="text-red-600 font-medium text-xs">Expires {moment(ch.expiresAt).fromNow()}</p></div>))}</div></InfoCard>
          )) : <EmptyState icon={<Library size={32} className="text-gray-400"/>} title="No Assigned Books" message="Books assigned by an admin with a time limit will show up here."/>}
        </div>
      );
    }
    if (activeSection === 'settings') {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Settings</h2>
          <InfoCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h3>
            <form onSubmit={handleNameChange} className="space-y-4 max-w-sm">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input type="text" id="name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Name</button>
              {message.type === 'name' && <p className={`mt-2 text-sm font-medium ${message.isError ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
            </form>
          </InfoCard>
          <InfoCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
              <input type="password" placeholder="Current Password" value={passwordData.oldPassword} onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Update Password</button>
              {message.type === 'password' && <p className={`mt-2 text-sm font-medium ${message.isError ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
            </form>
          </InfoCard>
        </div>
      );
    }
    return null; // Should not happen
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24 md:pb-0"> 
        <div className="flex max-w-7xl mx-auto">
            <aside className="w-64 flex-shrink-0 hidden md:block">
                <div className="sticky top-20"><SidebarContent /></div>
            </aside>
            <main className="flex-1 p-4 md:p-8">
                <div className="md:hidden flex items-center gap-4 bg-white p-4 rounded-xl shadow-md mb-4">
                    <UserCircle size={48} className="text-blue-500 flex-shrink-0" />
                    <div><h2 className="text-xl font-bold text-gray-800">{user?.name}</h2><p className="text-sm text-gray-500">{user?.email}</p></div>
                </div>
                {renderContent()}
            </main>
        </div>
        <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-gray-200 shadow-t-md z-40">
            <div className="flex justify-around items-center h-full">
                <MobileNavLink label="Overview" icon={<BarChart2 size={22}/>} isActive={activeSection === 'overview'} onClick={() => setActiveSection('overview')} />
                <MobileNavLink label="Approved" icon={<CheckCircle size={22}/>} isActive={activeSection === 'approved'} onClick={() => setActiveSection('approved')} />
                <MobileNavLink label="Assigned" icon={<Library size={22}/>} isActive={activeSection === 'assigned'} onClick={() => setActiveSection('assigned')} />
                <MobileNavLink label="Settings" icon={<Settings size={22}/>} isActive={activeSection === 'settings'} onClick={() => setActiveSection('settings')} />
            </div>
        </div>
    </div>
  );
}