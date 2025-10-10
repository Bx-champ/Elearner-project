// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { ChevronDown, ChevronUp } from 'lucide-react';
// import { BASE_URL } from '../config';

// export default function MyFiles() {
//   const [books, setBooks] = useState([]);
//   const [expandedBooks, setExpandedBooks] = useState(new Set());

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem('user'));
//     const token = user?.token;
//     if (!token) return;

//     const fetchData = async () => {
//       try {
//         const [assignedRes, approvedRes] = await Promise.all([
//           axios.get(`${BASE_URL}/api/auth/user/assigned-books`, {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           axios.get(`${BASE_URL}/api/auth/user/chapter-access/all`, {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);

//         const assignedBooks = assignedRes.data.books || [];
//         const approvedBooks = approvedRes.data.books || [];

//         const mergedMap = {};

//         // Insert approved (non-expiry)
//         approvedBooks.forEach(book => {
//           if (!mergedMap[book._id]) mergedMap[book._id] = { ...book, chapters: [] };
//           book.chapters.forEach(ch => {
//             mergedMap[book._id].chapters.push({ ...ch });
//           });
//         });

//         // Insert assigned (with expiry), override if needed
//         assignedBooks.forEach(book => {
//           if (!mergedMap[book._id]) mergedMap[book._id] = { ...book, chapters: [] };
//           book.chapters.forEach(ch => {
//             const existing = mergedMap[book._id].chapters.find(c => c._id === ch._id);
//             if (existing) Object.assign(existing, ch);
//             else mergedMap[book._id].chapters.push({ ...ch });
//           });
//         });

//         setBooks(Object.values(mergedMap));
//       } catch (err) {
//         console.error('Error fetching chapter access:', err);
//       }
//     };

//     fetchData();
//   }, []);

//   const toggleExpand = (bookId) => {
//     setExpandedBooks((prev) => {
//       const newSet = new Set(prev);
//       newSet.has(bookId) ? newSet.delete(bookId) : newSet.add(bookId);
//       return newSet;
//     });
//   };

//   const getTimeLeft = (expiresAt) => {
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

//   return (
//     <div className="pt-24 px-4 min-h-screen bg-[#f4f2ec]">
//       {/* <h2 className="text-2xl font-bold text-[#16355a] mb-6">📚 My Assigned Books</h2> */}

//       {books.length === 0 ? (
//         <p className="text-gray-500">No books assigned yet.</p>
//       ) : (
//         books.map((book) => {
//           const isExpanded = expandedBooks.has(book._id);
//           return (
//             <div key={book._id} className="bg-white shadow rounded-lg mb-6">
//               {/* Book Header */}
//               <button
//                 className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none"
//                 onClick={() => toggleExpand(book._id)}
//               >
//                 <div className="flex gap-4 items-center">
//                   {book.coverUrl && (
//                     <img
//                       src={book.coverUrl}
//                       alt={book.name}
//                       className="w-16 h-24 object-cover rounded"
//                     />
//                   )}
//                   <div>
//                     <h3 className="text-xl font-semibold text-[#16355a]">{book.name}</h3>
//                     <p className="text-sm text-gray-500">{book.chapters.length} chapter(s)</p>
//                   </div>
//                 </div>
//                 <div className="text-gray-600">
//                   {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//                 </div>
//               </button>

//               {/* Chapters Dropdown */}
//               {isExpanded && (
//                 <div className="px-4 pb-4">
//                   {book.chapters.map((ch, idx) => (
//                     <div
//                       key={idx}
//                       className="flex justify-between items-center border-t py-3"
//                     >
//                       <div>
//                         <h4 className="font-medium text-[#4457ff]">{ch.name}</h4>
//                         <p className="text-sm text-gray-600">{ch.description}</p>
//                         {ch.expiresAt && (
//                           <p className="text-xs text-red-500">{getTimeLeft(ch.expiresAt)}</p>
//                         )}
//                       </div>
//                       <Link
//                         to={`/preview/${book._id}/${ch._id}`}
//                         className="text-sm text-white bg-[#4457ff] px-4 py-1 rounded hover:bg-blue-700 transition"
//                       >
//                         Preview
//                       </Link>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           );
//         })
//       )}
//     </div>
//   );
// }



import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BASE_URL } from '../config';

export default function MyFiles() {
  const [books, setBooks] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (!token) {
      setError('Unauthorized access. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [assignedRes, approvedRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/user/assigned-books`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/auth/user/chapter-access/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const assignedBooks = assignedRes.data.books || [];
        const approvedBooks = approvedRes.data.books || [];

        const mergedMap = {};

        // Insert approved (permanent access)
        approvedBooks.forEach((book) => {
          if (!mergedMap[book._id]) mergedMap[book._id] = { ...book, chapters: [] };
          book.chapters.forEach((ch) => {
            mergedMap[book._id].chapters.push({ ...ch });
          });
        });

        // Insert assigned (with expiry) - override approved if exists
        assignedBooks.forEach((book) => {
          if (!mergedMap[book._id]) mergedMap[book._id] = { ...book, chapters: [] };
          book.chapters.forEach((ch) => {
            const existing = mergedMap[book._id].chapters.find((c) => c._id === ch._id);
            if (existing) Object.assign(existing, ch);
            else mergedMap[book._id].chapters.push({ ...ch });
          });
        });

        // Filter out expired chapters and remove books with no chapters
        const now = new Date();
        const filteredBooks = Object.values(mergedMap)
          .map((book) => {
            const validChapters = book.chapters.filter((ch) => {
              if (!ch.expiresAt) return true; // permanent
              return new Date(ch.expiresAt) > now; // still active
            });
            return { ...book, chapters: validChapters };
          })
          .filter((book) => book.chapters.length > 0); // only books with valid chapters

        setBooks(filteredBooks);
      } catch (err) {
        console.error('Error fetching chapter access:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load your files.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleExpand = (bookId) => {
    setExpandedBooks((prev) => {
      const newSet = new Set(prev);
      newSet.has(bookId) ? newSet.delete(bookId) : newSet.add(bookId);
      return newSet;
    });
  };

  const getTimeLeft = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    if (diff <= 0) return '⛔ Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `⏳ ${days} day(s) left`;
    return `⏳ ${hours}h ${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="pt-24 text-center text-gray-500">
        Loading your files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 text-center text-red-500 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 min-h-screen bg-[#f4f2ec]">
      {books.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No books available.</p>
      ) : (
        books.map((book) => {
          const isExpanded = expandedBooks.has(book._id);
          return (
            <div key={book._id} className="bg-white shadow rounded-lg mb-6">
              {/* Book Header */}
              <button
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none"
                onClick={() => toggleExpand(book._id)}
              >
                <div className="flex gap-4 items-center">
                  {book.coverUrl && (
                    <img
                      src={book.coverUrl}
                      alt={book.name}
                      className="w-16 h-24 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-[#16355a]">
                      {book.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {book.chapters.length} chapter(s)
                    </p>
                  </div>
                </div>
                <div className="text-gray-600">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Chapters Dropdown */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {book.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-t py-3"
                    >
                      <div>
                        <h4 className="font-medium text-[#4457ff]">{ch.name}</h4>
                        <p className="text-sm text-gray-600">{ch.description}</p>
                        {ch.expiresAt && (
                          <p className="text-xs text-red-500">{getTimeLeft(ch.expiresAt)}</p>
                        )}
                      </div>
                      <Link
                        to={`/preview/${book._id}/${ch._id}`}
                        className="text-sm text-white bg-[#4457ff] px-4 py-1 rounded hover:bg-blue-700 transition"
                      >
                        Preview
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
