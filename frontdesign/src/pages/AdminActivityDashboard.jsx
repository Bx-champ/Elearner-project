// import React, { useEffect, useState, useMemo, useContext } from 'react';
// import axios from 'axios';
// import { ChevronDown, ChevronUp, CircleDot, Search } from 'lucide-react';
// import { BASE_URL } from '../config';
// import { AuthContext } from '../authContext'; // <-- The missing import is now added
// import { motion, AnimatePresence } from 'framer-motion';

// // A reusable component for stat lines in the expanded view
// const StatLine = ({ label, value }) => (
//     <div className="flex justify-between py-2 border-b border-gray-200">
//         <span className="font-medium text-gray-600">{label}:</span>
//         <span className="font-bold text-gray-800">{value}</span>
//     </div>
// );

// export default function AdminActivityDashboard() {
//     const [allUsers, setAllUsers] = useState([]);
//     const [activeTab, setActiveTab] = useState('all');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [expandedUserId, setExpandedUserId] = useState(null);
//     const [loading, setLoading] = useState(true);

//     const { user } = useContext(AuthContext);
//     const token = user?.token;

//     useEffect(() => {
//         if (!token) {
//             setLoading(false);
//             return;
//         }
//         console.log('Auth token being sent:', token);

//         axios.get(`${BASE_URL}/api/auth/admin/user-dashboard-data`, {
//             headers: { Authorization: `Bearer ${token}` }
            
//         })
//         .then((res) => {
//             setAllUsers(res.data.users || []);
//         })
//         .catch((err) => console.error('Failed to load user dashboard data:', err))
//         .finally(() => setLoading(false));
//     }, [token]);

//     const filteredUsers = useMemo(() => {
//         if (!allUsers) return [];
//         return allUsers
//             .filter(user => activeTab === 'online' ? user.isOnline : true)
//             .filter(user => 
//                 user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 user.email.toLowerCase().includes(searchTerm.toLowerCase())
//             );
//     }, [allUsers, activeTab, searchTerm]);

//     const toggleExpand = (userId) => {
//         setExpandedUserId(prev => (prev === userId ? null : userId));
//     };

//     return (
//         <div className="min-h-screen pt-24 px-4 md:px-8 bg-gray-100">
//             <h1 className="text-3xl font-bold text-gray-800 mb-6">User Activity Dashboard</h1>

//             {/* Controls: Tabs and Search Bar */}
//             <div className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
//                 <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
//                     <button onClick={() => setActiveTab('all')} className={`px-4 py-1 rounded-md text-sm font-semibold transition ${activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>All Users</button>
//                     <button onClick={() => setActiveTab('online')} className={`px-4 py-1 rounded-md text-sm font-semibold transition ${activeTab === 'online' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>Online</button>
//                 </div>
//                 <div className="relative flex-1 w-full md:w-auto">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                     <input 
//                         type="text"
//                         placeholder="Search by name or email..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>
//             </div>

//             {/* User List */}
//             <div className="bg-white shadow-sm rounded-xl overflow-hidden">
//                 {loading ? <p className="p-4 text-center">Loading data...</p> : 
//                 filteredUsers.length > 0 ? (
//                     filteredUsers.map((user) => {
//                         const isExpanded = expandedUserId === user._id;
//                         return (
//                             <div key={user._id} className="border-b last:border-b-0 border-gray-200">
//                                 <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(user._id)}>
//                                     <div className="flex items-center gap-4">
//                                         <CircleDot className={user.isOnline ? 'text-green-500 animate-pulse' : 'text-gray-400'} size={16} />
//                                         <div>
//                                             <p className="font-semibold text-gray-800">{user.name}</p>
//                                             <p className="text-xs text-gray-500">{user.email}</p>
//                                         </div>
//                                     </div>
//                                     {isExpanded ? <ChevronUp className="text-gray-500"/> : <ChevronDown className="text-gray-500"/>}
//                                 </div>

//                                 <AnimatePresence>
//                                 {isExpanded && (
//                                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
//                                         <div className="bg-gray-50 px-6 py-4 text-sm">
//                                             <h4 className="font-bold text-gray-700 mb-2">User Stats</h4>
//                                             <StatLine label="Approved Books" value={user.approvedBooksCount} />
//                                             <StatLine label="Approved Chapters" value={user.approvedChaptersCount} />
//                                             <StatLine label="Assigned Books" value={user.assignedBooksCount} />
//                                             <StatLine label="Assigned Chapters" value={user.assignedChaptersCount} />
//                                         </div>
//                                     </motion.div>
//                                 )}
//                                 </AnimatePresence>
//                             </div>
//                         );
//                     })
//                 ) : (
//                     <p className="p-6 text-center text-gray-500">No users found matching your criteria.</p>
//                 )}
//             </div>
//         </div>
//     );
// }


import React, { useEffect, useState, useMemo, useContext } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, CircleDot, Search } from 'lucide-react';
import { BASE_URL } from '../config';
import { AuthContext } from '../authContext';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const StatLine = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
        <span className="text-sm text-gray-600">{label}:</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
);

export default function AdminUserPanel() {
    const [allUsers, setAllUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'online'
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    const { user } = useContext(AuthContext);
    const token = user?.token;

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        axios.get(`${BASE_URL}/api/auth/admin/user-management-data`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            setAllUsers(res.data.users || []);
        })
        .catch((err) => console.error('Failed to load user data:', err))
        .finally(() => setLoading(false));
    }, [token]);

    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];
        return allUsers
            .filter(user => activeTab === 'online' ? user.isOnline : true)
            .filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
            // This places users where `isOnline` is true before those where it's false.
            if (activeTab === 'all') { // Only apply this sort in the 'All Users' tab
                return b.isOnline - a.isOnline;
            }
            return 0; // No sorting needed in the 'Online' tab
        });

    }, [allUsers, activeTab, searchTerm]);

    const toggleExpand = (userId) => {
        setExpandedUserId(prev => (prev === userId ? null : userId));
    };

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 bg-gray-50">
            {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1> */}

            {/* Controls: Tabs and Search Bar */}
            <div className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center sticky top-20 z-10">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>All Users</button>
                    <button onClick={() => setActiveTab('online')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === 'online' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Online</button>
                </div>
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                {loading ? <p className="p-4 text-center text-gray-500">Loading user data...</p> : 
                filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                        const isExpanded = expandedUserId === u._id;
                        return (
                            <div key={u._id} className="border-b last:border-b-0 border-gray-200">
                                <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(u._id)}>
                                    <div className="flex items-center gap-4">
                                        <CircleDot className={u.isOnline ? 'text-green-500 animate-pulse' : 'text-gray-400'} size={16} />
                                        <div>
                                            <p className="font-semibold text-gray-800">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs text-gray-400 hidden sm:block">
                                            {u.lastActive ? `Last seen ${moment(u.lastActive).fromNow()}`: 'No activity'}
                                        </p>
                                        {isExpanded ? <ChevronUp className="text-gray-500"/> : <ChevronDown className="text-gray-500"/>}
                                    </div>
                                </div>

                                <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4">
                                            <StatLine label="Approved Books" value={u.approvedBooksCount} />
                                            <StatLine label="Approved Chapters" value={u.approvedChaptersCount} />
                                            <StatLine label="Assigned Books (Timed)" value={u.assignedBooksCount} />
                                            <StatLine label="Assigned Chapters (Timed)" value={u.assignedChaptersCount} />
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                ) : (
                    <p className="p-6 text-center text-gray-500">No users found matching your criteria.</p>
                )}
            </div>
        </div>
    );
}