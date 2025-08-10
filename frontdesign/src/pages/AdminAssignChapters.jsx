import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../authContext';
import { User, Book, Check, Clock, Send, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Modal Component ---
const SuccessModal = ({ message, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm"
        >
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Success!</h3>
            <p className="text-gray-600 mt-2 mb-6">{message}</p>
            <button 
                onClick={onClose} 
                className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
                Continue
            </button>
        </motion.div>
    </div>
);


export default function AdminAssignChapters() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [duration, setDuration] = useState('30');
    const [loading, setLoading] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [bookSearchTerm, setBookSearchTerm] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { user } = useContext(AuthContext);
    const token = user?.token;

    useEffect(() => {
        if (!token) return;
        axios.get(`${BASE_URL}/api/auth/admin/all-users`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setUsers(res.data.users))
            .catch(err => console.error('Failed to fetch users:', err));
        
        axios.get(`${BASE_URL}/api/auth/books`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setBooks(res.data.books))
            .catch(err => console.error('Failed to fetch books:', err));
    }, [token]);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    
    const filteredBooks = books.filter(b =>
        b.name.toLowerCase().includes(bookSearchTerm.toLowerCase())
    );

    const handleAssign = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!selectedUser || !selectedBook || selectedChapters.length === 0 || !duration) {
            setErrorMessage('Please complete all steps.');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${BASE_URL}/api/auth/admin/assign-chapters`, {
                userId: selectedUser._id,
                bookId: selectedBook._id,
                chapters: selectedChapters,
                durationDays: parseInt(duration)
            }, { headers: { Authorization: `Bearer ${token}` } });
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error assigning chapters:', err);
            setErrorMessage(err.response?.data?.message || 'Failed to assign chapters.');
        } finally {
            setLoading(false);
        }
    };
    
    const resetSelection = () => {
        setSelectedUser(null);
        setSelectedBook(null);
        setSelectedChapters([]);
        setUserSearchTerm('');
        setBookSearchTerm('');
        setErrorMessage('');
        setShowSuccessModal(false);
    };

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 bg-gray-50">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">Assign Chapters</h1> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* --- Panel 1: Select User --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><User className="mr-2 text-blue-600"/>1. Select User</h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Search users..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                        {filteredUsers.map(u => (
                            <button key={u._id} onClick={() => { setSelectedUser(u); setSelectedBook(null); setSelectedChapters([]); }} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUser?._id === u._id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100'}`}>
                                <p className="font-semibold">{u.name}</p>
                                <p className={`text-xs ${selectedUser?._id === u._id ? 'text-blue-200' : 'text-gray-500'}`}>{u.email}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Panel 2: Select Book --- */}
                <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Book className="mr-2 text-blue-600"/>2. Select Book</h2>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Search books..." value={bookSearchTerm} onChange={e => setBookSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2">
                            {filteredBooks.map(b => (
                                <button key={b._id} onClick={() => { setSelectedBook(b); setSelectedChapters([]); }} className={`w-full text-left p-2 flex items-center gap-3 rounded-lg transition-colors ${selectedBook?._id === b._id ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}>
                                    <img src={b.coverUrl} alt={b.name} className="w-10 h-14 object-cover rounded-md shadow-sm"/>
                                    <p className="text-sm font-semibold">{b.name}</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                {/* --- Panel 3: Select Chapters & Confirm --- */}
                <AnimatePresence>
                {selectedUser && selectedBook && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Check className="mr-2 text-blue-600"/>3. Select Chapters</h2>
                        <p className="text-sm text-gray-500 mb-4 -mt-2">From: <span className="font-bold">{selectedBook.name}</span></p>
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2 border rounded-lg p-4">
                            {selectedBook.chapters.map(ch => (
                                <label key={ch._id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="checkbox" value={ch._id} checked={selectedChapters.includes(ch._id)} onChange={e => {
                                        const checked = e.target.checked;
                                        setSelectedChapters(prev => checked ? [...prev, ch._id] : prev.filter(id => id !== ch._id));
                                    }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    <span className="text-gray-700">{ch.name}</span>
                                </label>
                            ))}
                        </div>
                        
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><Clock className="mr-2"/>Set Duration</h2>
                            <div className="relative max-w-xs">
                                <input type="number" className="w-full pl-4 pr-16 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 30"/>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">days</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 border-t pt-6">
                            <button onClick={handleAssign} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400">
                                <Send size={18} />
                                {loading ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                            {errorMessage && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><AlertCircle size={16}/>{errorMessage}</p>}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

            </div>
            
            <AnimatePresence>
                {showSuccessModal && (
                    <SuccessModal 
                        message={`You have successfully assigned chapters to ${selectedUser?.name}.`}
                        onClose={resetSelection}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}




// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { BASE_URL } from '../config';

// export default function AdminAssignChapters() {
//   const [users, setUsers] = useState([]);
//   const [selectedUserId, setSelectedUserId] = useState('');
//   const [books, setBooks] = useState([]);
//   const [selectedBookId, setSelectedBookId] = useState('');
//   const [selectedChapters, setSelectedChapters] = useState([]);
//   const [duration, setDuration] = useState('');

//   useEffect(() => {
//     axios.get(`${BASE_URL}/api/auth/admin/all-users`)
//       .then(res => setUsers(res.data.users))
//       .catch(err => console.error('Failed to fetch users:', err));
//   }, []);

//   useEffect(() => {
//     axios.get(`${BASE_URL}/api/auth/books`)
//       .then(res => setBooks(res.data.books))
//       .catch(err => console.error('Failed to fetch books:', err));
//   }, []);

//   const handleAssign = () => {
//     if (!selectedUserId || !selectedBookId || selectedChapters.length === 0 || !duration) {
//       alert('Fill all fields');
//       return;
//     }

//     axios.post(`${BASE_URL}/api/auth/admin/assign-chapters`, {
//       userId: selectedUserId,
//       bookId: selectedBookId,
//       chapters: selectedChapters,
//       durationDays: parseInt(duration)
//     })
//     .then(() => alert('✅ Chapters assigned!'))
//     .catch(err => {
//       console.error('Error assigning chapters:', err);
//       alert('❌ Failed to assign');
//     });
//   };

//   const selectedBook = books.find(b => b._id === selectedBookId);

//   return (
//     <div className="p-8 pt-24 bg-[#f4f2ec] min-h-screen">
//       <h2 className="text-2xl font-bold text-[#16355a] mb-6">📖 Assign Chapters to Student</h2>

//       {/* User Select by Email */}
//       <label className="block mb-2 text-sm font-medium text-gray-700">👤 Select User (by Email)</label>
//       <select
//         className="w-full p-2 border mb-4"
//         value={selectedUserId}
//         onChange={e => setSelectedUserId(e.target.value)}
//       >
//         <option value="">-- Select Email --</option>
//         {users.map(user => (
//           <option key={user._id} value={user._id}>{user.email}</option>
//         ))}
//       </select>

//       {/* Book Select */}
//       <label className="block mb-2 text-sm font-medium text-gray-700">📚 Select Book</label>
//       <select
//         className="w-full p-2 border mb-4"
//         value={selectedBookId}
//         onChange={e => {
//           setSelectedBookId(e.target.value);
//           setSelectedChapters([]);
//         }}
//       >
//         <option value="">-- Select Book --</option>
//         {books.map(book => (
//           <option key={book._id} value={book._id}>{book.name}</option>
//         ))}
//       </select>

//       {/* Chapters Select */}
//       {selectedBook && (
//         <>
//           <label className="block mb-2 text-sm font-medium text-gray-700">📄 Select Chapters</label>
//           <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
//             {selectedBook.chapters.map(ch => (
//               <label key={ch._id} className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   value={ch._id}
//                   checked={selectedChapters.includes(ch._id)}
//                   onChange={e => {
//                     const checked = e.target.checked;
//                     setSelectedChapters(prev =>
//                       checked ? [...prev, ch._id] : prev.filter(id => id !== ch._id)
//                     );
//                   }}
//                 />
//                 {ch.name}
//               </label>
//             ))}
//           </div>
//         </>
//       )}

//       {/* Duration Input */}
//       <label className="block mb-2 text-sm font-medium text-gray-700">⏳ Duration (days)</label>
//       <input
//         type="number"
//         className="w-full p-2 border mb-6"
//         value={duration}
//         onChange={e => setDuration(e.target.value)}
//       />

//       <button
//         onClick={handleAssign}
//         className="bg-[#4457ff] text-white px-6 py-2 rounded hover:bg-blue-700 transition"
//       >
//         Assign Chapters
//       </button>
//     </div>
//   );
// }




// import React, { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
// import { BASE_URL } from '../config';
// import { AuthContext } from '../authContext';
// import { User, Book, Check, Clock, Send, AlertCircle, CheckCircle, Search } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- Reusable Modal Component ---
// const SuccessModal = ({ message, onClose }) => (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//         <motion.div 
//             initial={{ opacity: 0, scale: 0.9 }} 
//             animate={{ opacity: 1, scale: 1 }} 
//             className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm"
//         >
//             <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
//             <h3 className="text-xl font-bold text-gray-800">Success!</h3>
//             <p className="text-gray-600 mt-2 mb-6">{message}</p>
//             <button 
//                 onClick={onClose} 
//                 className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
//             >
//                 Continue
//             </button>
//         </motion.div>
//     </div>
// );


// export default function AdminAssignChapters() {
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [books, setBooks] = useState([]);
//     const [selectedBook, setSelectedBook] = useState(null);
//     const [selectedChapters, setSelectedChapters] = useState([]);
//     const [duration, setDuration] = useState('30');
//     const [loading, setLoading] = useState(false);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [showSuccessModal, setShowSuccessModal] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');

//     const { user } = useContext(AuthContext);
//     const token = user?.token;

//     useEffect(() => {
//         if (!token) return;
//         axios.get(`${BASE_URL}/api/auth/admin/all-users`, { headers: { Authorization: `Bearer ${token}` } })
//             .then(res => setUsers(res.data.users))
//             .catch(err => console.error('Failed to fetch users:', err));
        
//         axios.get(`${BASE_URL}/api/auth/books`, { headers: { Authorization: `Bearer ${token}` } })
//             .then(res => setBooks(res.data.books))
//             .catch(err => console.error('Failed to fetch books:', err));
//     }, [token]);

//     const filteredUsers = users.filter(u => 
//         u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//         u.email.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const handleAssign = async (e) => {
//         e.preventDefault();
//         setErrorMessage('');
//         if (!selectedUser || !selectedBook || selectedChapters.length === 0 || !duration) {
//             setErrorMessage('Please select a user, a book, chapters, and a duration.');
//             return;
//         }
//         setLoading(true);
//         try {
//             await axios.post(`${BASE_URL}/api/auth/admin/assign-chapters`, {
//                 userId: selectedUser._id,
//                 bookId: selectedBook._id,
//                 chapters: selectedChapters,
//                 durationDays: parseInt(duration)
//             }, { headers: { Authorization: `Bearer ${token}` } });
//             setShowSuccessModal(true);
//         } catch (err) {
//             console.error('Error assigning chapters:', err);
//             setErrorMessage(err.response?.data?.message || 'Failed to assign chapters.');
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     const resetSelection = () => {
//         setSelectedUser(null);
//         setSelectedBook(null);
//         setSelectedChapters([]);
//         setSearchTerm('');
//         setShowSuccessModal(false);
//     };

//     return (
//         <div className="min-h-screen pt-24 px-4 md:px-8 bg-gray-50">
//             {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">Assign Chapters</h1> */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//                 {/* --- Panel 1: Select User --- */}
//                 <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-1">
//                     <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><User className="mr-2"/>Select a User</h2>
//                     <div className="relative mb-4">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                         <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
//                     </div>
//                     <div className="max-h-96 overflow-y-auto space-y-2">
//                         {filteredUsers.map(u => (
//                             <button key={u._id} onClick={() => setSelectedUser(u)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUser?._id === u._id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
//                                 <p className="font-semibold">{u.name}</p>
//                                 <p className="text-xs">{u.email}</p>
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* --- Panel 2: Select Book & Chapters --- */}
//                 <AnimatePresence>
//                 {selectedUser && (
//                     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2 space-y-6">
//                         <div>
//                             <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Book className="mr-2"/>Select a Book for <span className="text-blue-600 ml-1">{selectedUser.name}</span></h2>
//                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                                 {books.map(b => (
//                                     <button key={b._id} onClick={() => { setSelectedBook(b); setSelectedChapters([]); }} className={`p-2 rounded-lg border-2 transition-all ${selectedBook?._id === b._id ? 'border-blue-600 scale-105' : 'border-transparent hover:border-gray-300'}`}>
//                                         <img src={b.coverUrl} alt={b.name} className="w-full h-auto object-cover rounded-md shadow-md"/>
//                                         <p className="text-xs font-semibold mt-2 text-center">{b.name}</p>
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>

//                         {selectedBook && (
//                         <div className="border-t pt-6">
//                              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Check className="mr-2"/>Select Chapters from <span className="text-blue-600 ml-1">{selectedBook.name}</span></h2>
//                              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 border rounded-lg p-4">
//                                 {selectedBook.chapters.map(ch => (
//                                     <label key={ch._id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
//                                         <input type="checkbox" value={ch._id} checked={selectedChapters.includes(ch._id)} onChange={e => {
//                                             const checked = e.target.checked;
//                                             setSelectedChapters(prev => checked ? [...prev, ch._id] : prev.filter(id => id !== ch._id));
//                                         }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
//                                         <span className="text-gray-700">{ch.name}</span>
//                                     </label>
//                                 ))}
//                             </div>
                            
//                             <div className="mt-6">
//                                 <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Clock className="mr-2"/>Set Duration</h2>
//                                 <div className="relative max-w-xs">
//                                     <input type="number" className="w-full pl-4 pr-16 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 30"/>
//                                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">days</span>
//                                 </div>
//                             </div>
                            
//                             <div className="mt-8">
//                                 <button onClick={handleAssign} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400">
//                                     <Send size={18} />
//                                     {loading ? 'Assigning...' : 'Confirm Assignment'}
//                                 </button>
//                                 {errorMessage && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><AlertCircle size={16}/>{errorMessage}</p>}
//                             </div>
//                         </div>
//                         )}
//                     </motion.div>
//                 )}
//                 </AnimatePresence>

//             </div>
            
//             <AnimatePresence>
//                 {showSuccessModal && (
//                     <SuccessModal 
//                         message={`You have successfully assigned chapters to ${selectedUser?.name}.`}
//                         onClose={resetSelection}
//                     />
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// }


















































