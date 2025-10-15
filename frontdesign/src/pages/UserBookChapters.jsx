// import React, { useEffect, useState, useContext } from 'react';
// // import axios from 'axios';
// import { useAxios } from '../axiosInstance';

// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { ChevronDown, ChevronUp } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { AuthContext } from '../authContext';
// import { BASE_URL } from '../config';

// export default function UserBookChapters() {
//   const axios = useAxios();

//   const { id } = useParams(); // bookId
//   const { user } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [book, setBook] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeChapter, setActiveChapter] = useState(null);
//   const [selectedChapters, setSelectedChapters] = useState([]);
//   const [approvedChapters, setApprovedChapters] = useState({});

//   // Fetch book
//   useEffect(() => {
//     axios
//       .get(`${BASE_URL}/api/auth/book/${id}`)
//       .then((res) => {
//         setBook(res.data.book);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error('Failed to load book', err);
//         alert('Failed to load book');
//       });
//   }, [id]);

//   // Fetch approved chapters
//   useEffect(() => {
//   if (!user?.token) return;
//   axios
//     .get(`${BASE_URL}/api/auth/user/chapter-access/${id}`, {
//       headers: { Authorization: `Bearer ${user.token}` },
//     })
//     .then((res) => {
//       const map = {};
//       res.data.accessInfo.forEach(({ chapterId, expiresAt }) => {
//         map[chapterId] = expiresAt || true;
//       });
//       setApprovedChapters(map);
//     })
//     .catch((err) => {
//       console.error('Error fetching approved chapters', err);
//     });
// }, [id, user]);


//   const handleCheckboxToggle = (chapterId) => {
//     setSelectedChapters((prev) =>
//       prev.includes(chapterId)
//         ? prev.filter((id) => id !== chapterId)
//         : [...prev, chapterId]
//     );
//   };

//   const handleRequestAccess = async () => {
//     if (selectedChapters.length === 0) {
//       alert('Please select at least one chapter.');
//       return;
//     }
//     if (!user || !user.token) {
//       alert('Please log in to request access');
//       return;
//     }
//     try {
//       await axios.post(
//         `${BASE_URL}/api/auth/request-access`,
//         {
//           bookId: book._id,
//           chapterIds: selectedChapters,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${user.token}`,
//           },
//         }
//       );

//       alert('✅ Request sent to admin');
//       setSelectedChapters([]);
//     } catch (err) {
//       console.error('Access request failed:', err);
//       alert(err.response?.data?.message || '❌ Failed to send request');
//     }
//   };

//   if (loading) return <p className="text-center mt-10">Loading...</p>;
//   if (!book) return <p className="text-center mt-10">Book not found</p>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-[100px] pb-10 px-4 sm:px-6 md:px-8 flex flex-col md:flex-row gap-6 relative">
//       {activeChapter !== null && (
//         <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-10 pointer-events-none"></div>
//       )}

//       {/* Left: Book Info */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full md:w-1/3 bg-white rounded-2xl shadow-xl p-4 sticky md:top-20 self-start z-20"
//       >
//         {/* <div className="overflow-hidden rounded-xl">
//           <motion.img
//             src={book.coverUrl || 'https://via.placeholder.com/600x400?text=No+Cover'}
//             alt={book.name}
//             className="w-full h-48 object-cover rounded-xl"
//             whileHover={{ scale: 1.05 }}
//             transition={{ duration: 0.3 }}
//           />
//         </div> */}
//           <div className="rounded-xl bg-gray-100 flex items-center justify-center aspect-[3/4] overflow-hidden">
//   <motion.img
//     src={book.coverUrl || 'https://via.placeholder.com/600x400?text=No+Cover'}
//     alt={book.name}
//     className="w-full h-full object-contain p-2"
//     whileHover={{ scale: 1.02 }}
//     transition={{ duration: 0.3 }}
//   />
// </div>






//         <h2 className="text-xl sm:text-2xl font-bold text-[#16355a] mt-3 mb-1">{book.name}</h2>
//         <p className="text-sm text-gray-600 mb-1">{book.subject}</p>
//         <p className="text-sm text-gray-500 mb-1">Tags: {book.tags || 'N/A'}</p>
//         {/* <p className="text-sm text-gray-400 mb-2">Total Price: ₹{book.price}</p> */}
//         <p className="text-xs text-gray-500">{book.contents}</p>

//         <Link
//           to="/dashboard"
//           className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm"
//         >
//           ← Back to books
//         </Link>

//         {selectedChapters.length > 0 && (
//           <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
//             ✅ {selectedChapters.length} chapter
//             {selectedChapters.length > 1 ? 's' : ''} selected
//           </div>
//         )}
//       </motion.div>

//       {/* Right: Chapters */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full md:w-2/3 space-y-4 z-20"
//       >
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg sm:text-xl font-semibold text-[#16355a]">📑 Chapters</h3>
//           <button
//             onClick={handleRequestAccess}
//             className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition text-sm"
//           >
//             🚀 Request Access
//           </button>
//         </div>

//         {book.chapters.length === 0 ? (
//           <p className="text-gray-500">No chapters found.</p>
//         ) : (
//           book.chapters
//             .sort((a, b) => a.order - b.order)
//             .map((ch, idx) => {
//               const hasAccess = !!approvedChapters[ch._id];

//               return (
//                 <motion.div
//                   key={ch._id || idx}
//                   className={`bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition transform ${
//                     activeChapter !== null && activeChapter !== idx ? 'opacity-30' : ''
//                   }`}
//                   whileHover={{ scale: 1.02 }}
//                 >
//                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
//                     <div>
//                       <h4 className="font-semibold text-[#2f3e52]">{ch.name}</h4>
//                       <p className="text-sm text-gray-400">Price: ₹{ch.price}</p>
//                     </div>

//                     <div className="flex flex-wrap gap-3 justify-end items-center">
//                       {hasAccess ? (
//                         <Link
//                           to={`/preview/${book._id}/${ch._id}`}
//                           className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
//                         >
//                           ✅ View PDF
//                         </Link>
//                       ) : (
//                         <label className="flex items-center gap-2 text-sm text-gray-700">
//                           <input
//                             type="checkbox"
//                             checked={selectedChapters.includes(ch._id)}
//                             onChange={() => handleCheckboxToggle(ch._id)}
//                             className="accent-blue-600"
//                           />
//                           Request Access
//                         </label>
//                       )}

//                       <button
//                         onClick={() => setActiveChapter(activeChapter === idx ? null : idx)}
//                         className="text-gray-600 hover:text-gray-900"
//                       >
//                         {activeChapter === idx ? (
//                           <ChevronUp className="w-5 h-5" />
//                         ) : (
//                           <ChevronDown className="w-5 h-5" />
//                         )}
//                       </button>
//                     </div>
//                   </div>

//                   <AnimatePresence>
//                     {activeChapter === idx && (
//                       <motion.div
//                         initial={{ height: 0, opacity: 0 }}
//                         animate={{ height: 'auto', opacity: 1 }}
//                         exit={{ height: 0, opacity: 0 }}
//                         transition={{ duration: 0.3 }}
//                         className="overflow-hidden mt-2 border-t pt-2 text-sm text-gray-500"
//                       >
//                         <p>{ch.description}</p>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </motion.div>
//               );
//             })
//         )}
//       </motion.div>
//     </div>
//   );
// }





// import React, { useEffect, useState, useContext } from 'react';
// import { useAxios } from '../axiosInstance';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { ChevronDown, ChevronUp } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { AuthContext } from '../authContext';
// import { BASE_URL } from '../config';

// export default function UserBookChapters() {
//   const axios = useAxios();
//   const { id } = useParams(); // bookId
//   const { user } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [book, setBook] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeChapter, setActiveChapter] = useState(null);
//   const [selectedChapters, setSelectedChapters] = useState([]);
//   const [approvedChapters, setApprovedChapters] = useState({});
//   const [pendingChapters, setPendingChapters] = useState([]);
//   const [rejectedChapters, setRejectedChapters] = useState([]);

//   // 🔹 Fetch book
//   useEffect(() => {
//     axios
//       .get(`${BASE_URL}/api/auth/book/${id}`)
//       .then((res) => {
//         setBook(res.data.book);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error('Failed to load book', err);
//         alert('Failed to load book');
//       });
//   }, [id]);

//   // 🔹 Fetch approved chapter access
//   useEffect(() => {
//     if (!user?.token) return;
//     axios
//       .get(`${BASE_URL}/api/auth/user/chapter-access/${id}`, {
//         headers: { Authorization: `Bearer ${user.token}` },
//       })
//       .then((res) => {
//         const map = {};
//         res.data.accessInfo.forEach(({ chapterId, expiresAt }) => {
//           map[chapterId] = expiresAt || true;
//         });
//         setApprovedChapters(map);
//       })
//       .catch((err) => {
//         console.error('Error fetching approved chapters', err);
//       });
//   }, [id, user]);

//   // 🔹 Fetch user’s pending/rejected requests
//   useEffect(() => {
//     if (!user?.token) return;
//     axios
//       .get(`${BASE_URL}/api/auth/user/access-requests/${id}`, {
//         headers: { Authorization: `Bearer ${user.token}` },
//       })
//       .then((res) => {
//         const pending = [];
//         const rejected = [];

//         res.data.requests.forEach((req) => {
//           if (req.status === 'pending') pending.push(...req.chapters);
//           if (req.status === 'rejected') rejected.push(...req.chapters);
//         });

//         setPendingChapters(pending);
//         setRejectedChapters(rejected);
//       })
//       .catch((err) => {
//         console.error('Error fetching access requests', err);
//       });
//   }, [id, user]);

//   // 🔹 Handle checkbox toggle
//   const handleCheckboxToggle = (chapterId) => {
//     // Prevent selecting already pending or approved chapters
//     if (approvedChapters[chapterId] || pendingChapters.includes(chapterId)) return;

//     setSelectedChapters((prev) =>
//       prev.includes(chapterId)
//         ? prev.filter((id) => id !== chapterId)
//         : [...prev, chapterId]
//     );
//   };

//   // 🔹 Handle request submit
//   const handleRequestAccess = async () => {
//     if (selectedChapters.length === 0) {
//       alert('Please select at least one chapter.');
//       return;
//     }
//     if (!user || !user.token) {
//       alert('Please log in to request access');
//       return;
//     }

//     try {
//       await axios.post(
//         `${BASE_URL}/api/auth/request-access`,
//         { bookId: book._id, chapterIds: selectedChapters },
//         { headers: { Authorization: `Bearer ${user.token}` } }
//       );

//       alert('✅ Request sent to admin');
//       // Mark those chapters as pending
//       setPendingChapters((prev) => [...prev, ...selectedChapters]);
//       setSelectedChapters([]);
//     } catch (err) {
//       console.error('Access request failed:', err);
//       alert(err.response?.data?.message || '❌ Failed to send request');
//     }
//   };

//   if (loading) return <p className="text-center mt-10">Loading...</p>;
//   if (!book) return <p className="text-center mt-10">Book not found</p>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-[100px] pb-10 px-4 sm:px-6 md:px-8 flex flex-col md:flex-row gap-6 relative">
//       {/* Overlay for chapter details */}
//       {activeChapter !== null && (
//         <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-10 pointer-events-none"></div>
//       )}

//       {/* Left: Book Info */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full md:w-1/3 bg-white rounded-2xl shadow-xl p-4 sticky md:top-20 self-start z-20"
//       >
//         <div className="rounded-xl bg-gray-100 flex items-center justify-center aspect-[3/4] overflow-hidden">
//           <motion.img
//             src={book.coverUrl || 'https://via.placeholder.com/600x400?text=No+Cover'}
//             alt={book.name}
//             className="w-full h-full object-contain p-2"
//             whileHover={{ scale: 1.02 }}
//             transition={{ duration: 0.3 }}
//           />
//         </div>

//         <h2 className="text-xl sm:text-2xl font-bold text-[#16355a] mt-3 mb-1">{book.name}</h2>
//         <p className="text-sm text-gray-600 mb-1">{book.subject}</p>
//         <p className="text-sm text-gray-500 mb-1">Tags: {book.tags || 'N/A'}</p>
//         <p className="text-xs text-gray-500">{book.contents}</p>

//         <Link to="/dashboard" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm">
//           ← Back to books
//         </Link>

//         {selectedChapters.length > 0 && (
//           <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
//             ✅ {selectedChapters.length} chapter
//             {selectedChapters.length > 1 ? 's' : ''} selected
//           </div>
//         )}
//       </motion.div>

//       {/* Right: Chapters */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full md:w-2/3 space-y-4 z-20"
//       >
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg sm:text-xl font-semibold text-[#16355a]">📑 Chapters</h3>
//           <button
//             onClick={handleRequestAccess}
//             className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition text-sm"
//           >
//             🚀 Request Access
//           </button>
//         </div>

//         {book.chapters.length === 0 ? (
//           <p className="text-gray-500">No chapters found.</p>
//         ) : (
//           book.chapters
//             .sort((a, b) => a.order - b.order)
//             .map((ch, idx) => {
//               const hasAccess = !!approvedChapters[ch._id];
//               const isPending = pendingChapters.includes(ch._id);
//               const isRejected = rejectedChapters.includes(ch._id);

//               return (
//                 <motion.div
//                   key={ch._id || idx}
//                   className={`bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition transform ${
//                     activeChapter !== null && activeChapter !== idx ? 'opacity-30' : ''
//                   }`}
//                   whileHover={{ scale: 1.02 }}
//                 >
//                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
//                     <div>
//                       <h4 className="font-semibold text-[#2f3e52]">{ch.name}</h4>
//                       <p className="text-sm text-gray-400">Price: ₹{ch.price}</p>
//                     </div>

//                     <div className="flex flex-wrap gap-3 justify-end items-center">
//                       {hasAccess ? (
//                         <Link
//                           to={`/preview/${book._id}/${ch._id}`}
//                           className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
//                         >
//                           ✅ View PDF
//                         </Link>
//                       ) : isPending ? (
//                         <span className="text-yellow-600 font-semibold text-sm">⏳ Pending</span>
//                       ) : (
//                         <label className="flex items-center gap-2 text-sm text-gray-700">
//                           <input
//                             type="checkbox"
//                             checked={selectedChapters.includes(ch._id)}
//                             onChange={() => handleCheckboxToggle(ch._id)}
//                             className="accent-blue-600"
//                             disabled={approvedChapters[ch._id] || pendingChapters.includes(ch._id)}
//                           />
//                           {isRejected ? '🔁 Request Again' : 'Request Access'}
//                         </label>
//                       )}

//                       <button
//                         onClick={() => setActiveChapter(activeChapter === idx ? null : idx)}
//                         className="text-gray-600 hover:text-gray-900"
//                       >
//                         {activeChapter === idx ? (
//                           <ChevronUp className="w-5 h-5" />
//                         ) : (
//                           <ChevronDown className="w-5 h-5" />
//                         )}
//                       </button>
//                     </div>
//                   </div>

//                   <AnimatePresence>
//                     {activeChapter === idx && (
//                       <motion.div
//                         initial={{ height: 0, opacity: 0 }}
//                         animate={{ height: 'auto', opacity: 1 }}
//                         exit={{ height: 0, opacity: 0 }}
//                         transition={{ duration: 0.3 }}
//                         className="overflow-hidden mt-2 border-t pt-2 text-sm text-gray-500"
//                       >
//                         <p>{ch.description}</p>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </motion.div>
//               );
//             })
//         )}
//       </motion.div>
//     </div>
//   );
// }





import React, { useEffect, useState, useContext } from 'react';
import { useAxios } from '../axiosInstance';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../authContext';
import { BASE_URL } from '../config';

export default function UserBookChapters() {
  const axios = useAxios();
  const { id } = useParams(); // bookId
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [approvedChapters, setApprovedChapters] = useState({});
  const [pendingChapters, setPendingChapters] = useState([]);
  const [rejectedChapters, setRejectedChapters] = useState([]);

  // 🔹 Fetch book details
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/auth/book/${id}`)
      .then((res) => {
        setBook(res.data.book);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load book', err);
        alert('Failed to load book');
      });
  }, [id]);

  // 🔹 Helper: Fetch approved chapters
  const fetchApprovedChapters = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/user/chapter-access/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const map = {};
      res.data.accessInfo.forEach(({ chapterId, expiresAt }) => {
        map[chapterId] = expiresAt || true;
      });
      setApprovedChapters(map);
    } catch (err) {
      console.error('Error fetching approved chapters', err);
    }
  };

  // 🔹 Fetch approved chapters on mount & every 15s
  useEffect(() => {
    fetchApprovedChapters();
    const interval = setInterval(fetchApprovedChapters, 15000);
    return () => clearInterval(interval);
  }, [id, user]);

  // 🔹 Fetch user’s pending/rejected requests
  const fetchAccessRequests = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/user/access-requests/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const pending = [];
      const rejected = [];

      res.data.requests.forEach((req) => {
        if (req.status === 'pending') pending.push(...req.chapters);
        if (req.status === 'rejected') rejected.push(...req.chapters);
      });

      setPendingChapters(pending);
      setRejectedChapters(rejected);
    } catch (err) {
      console.error('Error fetching access requests', err);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
  }, [id, user]);

  // 🔹 Handle checkbox toggle
  const handleCheckboxToggle = (chapterId) => {
    // Prevent selecting already pending or approved chapters
    if (approvedChapters[chapterId] || pendingChapters.includes(chapterId)) return;

    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // 🔹 Handle request submit
  const handleRequestAccess = async () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter.');
      return;
    }
    if (!user || !user.token) {
      alert('Please log in to request access');
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/auth/request-access`,
        { bookId: book._id, chapterIds: selectedChapters },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert('✅ Request sent to admin');
      // Update UI immediately
      setPendingChapters((prev) => [...prev, ...selectedChapters]);
      setSelectedChapters([]);

      // Refresh both approved + pending states
      fetchApprovedChapters();
      fetchAccessRequests();
    } catch (err) {
      console.error('Access request failed:', err);
      alert(err.response?.data?.message || '❌ Failed to send request');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!book) return <p className="text-center mt-10">Book not found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-[100px] pb-10 px-4 sm:px-6 md:px-8 flex flex-col md:flex-row gap-6 relative">
      {/* Overlay for chapter details */}
      {activeChapter !== null && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-10 pointer-events-none"></div>
      )}

      {/* Left: Book Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:w-1/3 bg-white rounded-2xl shadow-xl p-4 sticky md:top-20 self-start z-20"
      >
        <div className="rounded-xl bg-gray-100 flex items-center justify-center aspect-[3/4] overflow-hidden">
          <motion.img
            src={book.coverUrl || 'https://via.placeholder.com/600x400?text=No+Cover'}
            alt={book.name}
            className="w-full h-full object-contain p-2"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#16355a] mt-3 mb-1">{book.name}</h2>
        <p className="text-sm text-gray-600 mb-1">{book.subject}</p>
        <p className="text-sm text-gray-500 mb-1">Tags: {book.tags || 'N/A'}</p>
        <p className="text-xs text-gray-500">{book.contents}</p>

        <Link to="/dashboard" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm">
          ← Back to books
        </Link>

        {selectedChapters.length > 0 && (
          <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
            ✅ {selectedChapters.length} chapter
            {selectedChapters.length > 1 ? 's' : ''} selected
          </div>
        )}
      </motion.div>

      {/* Right: Chapters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:w-2/3 space-y-4 z-20"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold text-[#16355a]">📑 Chapters</h3>
          <button
            onClick={handleRequestAccess}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition text-sm"
          >
            🚀 Request Access
          </button>
        </div>

        {book.chapters.length === 0 ? (
          <p className="text-gray-500">No chapters found.</p>
        ) : (
          book.chapters
            .sort((a, b) => a.order - b.order)
            .map((ch, idx) => {
              const hasAccess = !!approvedChapters[ch._id];
              const isPending = pendingChapters.includes(ch._id);
              const isRejected = rejectedChapters.includes(ch._id);

              return (
                <motion.div
                  key={ch._id || idx}
                  className={`bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition transform ${
                    activeChapter !== null && activeChapter !== idx ? 'opacity-30' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="font-semibold text-[#2f3e52]">{ch.name}</h4>
                      <p className="text-sm text-gray-400">Price: ₹{ch.price}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end items-center">
                      {hasAccess ? (
                        <Link
                          to={`/preview/${book._id}/${ch._id}`}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                        >
                          ✅ View PDF
                        </Link>
                      ) : isPending ? (
                        <span className="text-yellow-600 font-semibold text-sm">⏳ Pending</span>
                      ) : (
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedChapters.includes(ch._id)}
                            onChange={() => handleCheckboxToggle(ch._id)}
                            className="accent-blue-600"
                            disabled={approvedChapters[ch._id] || pendingChapters.includes(ch._id)}
                          />
                          {isRejected ? '🔁 Request Again' : 'Request Access'}
                        </label>
                      )}

                      <button
                        onClick={() => setActiveChapter(activeChapter === idx ? null : idx)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {activeChapter === idx ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeChapter === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mt-2 border-t pt-2 text-sm text-gray-500"
                      >
                        <p>{ch.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
        )}
      </motion.div>
    </div>
  );
}
