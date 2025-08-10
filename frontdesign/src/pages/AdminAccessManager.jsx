// import React, { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
// import { AuthContext } from '../authContext';
// import { ChevronDown, ChevronUp } from 'lucide-react';
// import { BASE_URL } from '../config';

// export default function AdminAccessManager() {
//   const [data, setData] = useState([]);
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [expanded, setExpanded] = useState(new Set());
//   const { user } = useContext(AuthContext);

//   useEffect(() => {
//     if (!user?.token) return;

//     axios.get(`${BASE_URL}/api/auth/admin/access-management`, {
//       headers: {
//         Authorization: `Bearer ${user.token}`,
//       }
//     })
//     .then(res => {
//       setData(res.data);
//       setLoading(false);
//     })
//     .catch(err => {
//       console.error("Failed to load access data", err);
//       setLoading(false);
//     });
//   }, [user]);

//   const toggleExpand = (userId) => {
//     setExpanded(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(userId)) newSet.delete(userId);
//       else newSet.add(userId);
//       return newSet;
//     });
//   };

//   const revokeAccess = async (accessId, chapterId, type, userId, bookId) => {
//     try {
//       if (type === 'approved') {
//         await axios.delete(`${BASE_URL}/api/auth/admin/revoke-access/${accessId}/${chapterId}`, {
//           headers: { Authorization: `Bearer ${user.token}` }
//         });
//       } else if (type === 'expiry') {
//         await axios.delete(`${BASE_URL}/api/auth/admin/revoke-expiry-access/${userId}/${bookId}/${chapterId}`, {
//           headers: { Authorization: `Bearer ${user.token}` }
//         });
//       }

//       // Update UI
//       setData(prev =>
//         prev.map(user => ({
//           ...user,
//           chapters: user.chapters.filter(
//             ch => !(ch.accessId === accessId && ch.chapterId === chapterId && ch.type === type)
//           )
//         }))
//       );
//     } catch (err) {
//       alert("❌ Failed to revoke access");
//       console.error(err);
//     }
//   };

//   const getTimeLeft = (expiresAt) => {
//     if (!expiresAt) return null;
//     const now = new Date();
//     const expiry = new Date(expiresAt);
//     const diff = expiry - now;
//     if (diff <= 0) return '⛔ Expired';

//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const days = Math.floor(hours / 24);

//     if (days > 0) return `⏳ ${days} day(s) left`;
//     return `⏳ ${hours}h ${minutes}m left`;
//   };

//   const filteredUsers = data.filter(u =>
//     u.user.name.toLowerCase().includes(search.toLowerCase()) ||
//     u.user.email.toLowerCase().includes(search.toLowerCase())
//   );

//   if (!user?.token) {
//     return <div className="p-6 text-red-600">❌ Admin token missing. Please log in.</div>;
//   }

//   return (
//     <div className="p-4 md:p-6 min-h-screen bg-[#f4f2ec] relative">
//       <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
//         🔐 Admin Access Manager
//       </h1>

//       <div className="mb-6">
//         <input
//           type="text"
//           placeholder="🔍 Search by name or email"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-400"
//         />
//       </div>

//       {loading ? (
//         <div className="text-blue-500 text-base md:text-lg">⏳ Loading user access info...</div>
//       ) : (
//         <div className="space-y-4 relative z-10">
//           {filteredUsers.length === 0 ? (
//             <p className="text-gray-500">🙁 No users found with access.</p>
//           ) : (
//             filteredUsers.map(({ user, chapters }) => {
//               const isOpen = expanded.has(user._id);

//               return (
//                 <div
//                   key={user._id}
//                   className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
//                     expanded.size > 0 && !isOpen ? 'blur-sm pointer-events-none opacity-60' : ''
//                   }`}
//                 >
//                   {/* Header */}
//                   <button
//                     onClick={() => toggleExpand(user._id)}
//                     className="w-full flex justify-between items-center p-4 hover:bg-gray-100 focus:outline-none"
//                   >
//                     <div className="text-left">
//                       <h2 className="text-base md:text-lg font-semibold text-gray-800 break-all">
//                         👤 {user.name}{' '}
//                         <span className="text-sm text-gray-500 block md:inline">({user.email})</span>
//                       </h2>
//                     </div>
//                     {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//                   </button>

//                   {/* Dropdown */}
//                   {isOpen && (
//                     <ul className="space-y-3 px-4 pb-4">
//                       {chapters.length === 0 ? (
//                         <p className="text-sm text-gray-400">No chapters with access</p>
//                       ) : (
//                         chapters.map((ch) => (
//                           <li
//                             key={`${ch.accessId || `${user._id}-${ch.chapterId}`}-${ch.chapterId}`}
//                             className="flex flex-col sm:flex-row sm:justify-between sm:items-center border p-3 rounded-md hover:shadow-sm transition bg-gray-50"
//                           >
//                             <div className="text-sm text-gray-700 mb-2 sm:mb-0 break-words">
//                               <strong className="text-blue-600">{ch.bookName}</strong> — {ch.chapterName}
//                               {ch.expiresAt && (
//                                 <span className="block text-xs text-red-500 mt-1">
//                                   {getTimeLeft(ch.expiresAt)}
//                                 </span>
//                               )}
//                             </div>
//                             <button
//                               onClick={() => revokeAccess(ch.accessId, ch.chapterId, ch.type, user._id, ch.bookId)}
//                               className="text-red-600 hover:text-red-800 text-sm font-medium transition self-start sm:self-auto"
//                             >
//                               🗑 Revoke
//                             </button>
//                           </li>
//                         ))
//                       )}
//                     </ul>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import { ChevronDown, ChevronUp, Search, User, Book, Clock, Check, Trash2, AlertTriangle } from 'lucide-react';
import { BASE_URL } from '../config';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Confirmation Modal ---
const ConfirmationModal = ({ onConfirm, onCancel, message }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center"
        >
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Are you sure?</h3>
            <p className="text-gray-600 mt-2 mb-6">{message}</p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={onCancel} 
                    className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm} 
                    className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Confirm Revoke
                </button>
            </div>
        </motion.div>
    </div>
);


export default function AdminAccessManager() {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [modalInfo, setModalInfo] = useState(null); // To manage confirmation modal
    const { user } = useContext(AuthContext);
    const token = user?.token;

    useEffect(() => {
        if (!token) return;
        axios.get(`${BASE_URL}/api/auth/admin/access-management`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setData(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Failed to load access data", err);
            setLoading(false);
        });
    }, [token]);

    const toggleExpand = (userId) => {
        setExpandedUserId(prev => (prev === userId ? null : userId));
    };

    const handleRevokeClick = (chapter) => {
        setModalInfo({
            message: `This will permanently remove access to "${chapter.chapterName}" for ${chapter.user.name}. This action cannot be undone.`,
            onConfirm: () => confirmRevokeAccess(chapter)
        });
    };

    const confirmRevokeAccess = async (ch) => {
        try {
            if (ch.type === 'approved') {
                await axios.delete(`${BASE_URL}/api/auth/admin/revoke-access/${ch.accessId}/${ch.chapterId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (ch.type === 'expiry') {
                await axios.delete(`${BASE_URL}/api/auth/admin/revoke-expiry-access/${ch.user._id}/${ch.bookId}/${ch.chapterId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Optimistically update UI
            setData(prev => prev.map(u => ({
                ...u,
                chapters: u.chapters.filter(c => c.chapterId !== ch.chapterId || c.bookId !== ch.bookId)
            })).filter(u => u.chapters.length > 0));

        } catch (err) {
            alert("Failed to revoke access. Please check the console.");
            console.error(err);
        } finally {
            setModalInfo(null); // Close modal
        }
    };

    const filteredUsers = data.filter(u =>
        u.user.name.toLowerCase().includes(search.toLowerCase()) ||
        u.user.email.toLowerCase().includes(search.toLowerCase())
    );

    // Group chapters by book for display
    const groupChaptersByBook = (chapters) => {
        return chapters.reduce((acc, ch) => {
            if (!acc[ch.bookId]) {
                acc[ch.bookId] = { bookName: ch.bookName, chapters: [] };
            }
            acc[ch.bookId].chapters.push(ch);
            return acc;
        }, {});
    };

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Manager</h1>
            <p className="text-gray-500 mb-6">View and revoke chapter access for all users.</p>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by user name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? <div className="text-center text-gray-500">Loading user access info...</div> :
            <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500">No users found with active chapter access.</p>
                    </div>
                ) : (
                    filteredUsers.map(({ user, chapters }) => {
                        const isOpen = expandedUserId === user._id;
                        const groupedChapters = groupChaptersByBook(chapters);

                        return (
                            <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg">
                                <button onClick={() => toggleExpand(user._id)} className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <User className="text-blue-600" size={24} />
                                        <div>
                                            <h2 className="font-semibold text-gray-800">{user.name}</h2>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{chapters.length} Chapter(s)</span>
                                       {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                {isOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="px-5 pb-5 pt-4 border-t space-y-4">
                                            {Object.values(groupedChapters).map(group => (
                                                <div key={group.bookName}>
                                                    <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-2"><Book size={16} /> {group.bookName}</h3>
                                                    <ul className="space-y-2 pl-4">
                                                        {group.chapters.map(ch => (
                                                            <li key={ch.chapterId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                                                <div>
                                                                    <p className="text-sm text-gray-800">{ch.chapterName}</p>
                                                                    {ch.type === 'approved' ? (
                                                                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1"><Check size={12}/> Permanent</span>
                                                                    ) : (
                                                                        <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1"><Clock size={12}/> Expires {moment(ch.expiresAt).fromNow()}</span>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => handleRevokeClick(ch)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>
            }
            
            <AnimatePresence>
                {modalInfo && <ConfirmationModal onConfirm={modalInfo.onConfirm} onCancel={() => setModalInfo(null)} message={modalInfo.message} />}
            </AnimatePresence>
        </div>
    );
}
