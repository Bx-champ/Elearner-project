import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../config';

export default function UserDashboard() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BASE_URL}/api/auth/books`)
      .then(res => setBooks(res.data.books))
      .catch(err => console.error('Failed to load books:', err));
  }, []);

 const filteredBooks = books.filter(book => {
  const term = searchTerm.toLowerCase();
  const matchesName = book.name?.toLowerCase().includes(term);
  const matchesTags = Array.isArray(book.tags) && book.tags.some(tag => tag.toLowerCase().includes(term));
  const matchesSubject = book.subject?.toLowerCase().includes(term);
  const matchesChapters = Array.isArray(book.chapters) && book.chapters.some(ch =>
    ch.name?.toLowerCase().includes(term)
  );

  return matchesName || matchesTags || matchesSubject || matchesChapters;
});


  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-24 px-6 md:px-12">
      {/* 🔍 Search Bar */}
      <div className="mb-6 max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search by book name, tags, subject, or chapter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8">
        {filteredBooks.map(book => (
          <div
            key={book._id}
            onClick={() => navigate(`/user/book/${book._id}`)}
            className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/40 shadow-md hover:shadow-2xl transition-transform duration-300 hover:scale-[1.03]"
          >
            {/* Background Image Blur */}
            <div className="absolute inset-0 z-0">
              <img
                src={book.coverUrl}
                alt={book.name}
                className="w-full h-full object-cover opacity-20 blur-sm scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff66] to-[#ffffff22] mix-blend-overlay" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 space-y-2">
              <div className="overflow-hidden rounded-xl">
                <img
                  src={book.coverUrl}
                  alt={book.name}
                  className="rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <h3 className="text-xl font-bold text-[#1f2937] drop-shadow-sm">{book.name}</h3>
              <p className="text-sm text-grey-600">{book.subject}</p>
              {/* Description removed */}
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <p className="text-center text-gray-500 mt-10 text-lg">No matching books found.</p>
      )}
    </div>
  );
}


// import React, { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { BASE_URL } from '../config';
// import { AuthContext } from '../authContext'; // For protected requests
// import { Eye, BookOpen, Search } from 'lucide-react';

// export default function UserDashboard() {
//   const [books, setBooks] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const { user } = useContext(AuthContext);
//   const token = user?.token;

//   useEffect(() => {
//     if (!token) return;
//     axios.get(`${BASE_URL}/api/auth/books`, { headers: { Authorization: `Bearer ${token}` } })
//       .then(res => setBooks(res.data.books))
//       .catch(err => console.error('Failed to load books:', err))
//       .finally(() => setLoading(false));
//   }, [token]);

//   const filteredBooks = books.filter(book => {
//     if (!searchTerm) return true;
//     const term = searchTerm.toLowerCase();
//     const matchesName = book.name?.toLowerCase().includes(term);
//     const matchesTags = Array.isArray(book.tags) && book.tags.some(tag => tag.toLowerCase().includes(term));
//     const matchesSubject = book.subject?.toLowerCase().includes(term);
//     return matchesName || matchesTags || matchesSubject;
//   });

//   return (
//     <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
//       <div className="max-w-7xl mx-auto">
        
//         {/* Header and Search Bar */}
//         <div className="text-center mb-10">
//             <h1 className="text-4xl font-bold text-gray-800">Explore Our Library</h1>
//             <p className="mt-2 text-gray-500">Find your next favorite book to read.</p>
//             <div className="mt-6 max-w-xl mx-auto relative">
//                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
//                 <input
//                     type="text"
//                     placeholder="Search by name, subject, or tag..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-12 pr-4 py-3 rounded-full shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                 />
//             </div>
//         </div>

//         {/* Book Grid */}
//         {loading ? <p className="text-center text-gray-500">Loading books...</p> :
//         filteredBooks.length > 0 ? (
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
//             {filteredBooks.map(book => (
//               <div 
//                   key={book._id} 
//                   className="group relative rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
//                   onClick={() => navigate(`/user/book/${book._id}`)}
//               >
//                   <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover rounded-xl aspect-[2/3]"/>
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl"></div>
//                   <div className="absolute bottom-0 left-0 p-4">
//                       <h3 className="font-bold text-white text-sm truncate">{book.name}</h3>
//                       {/* Added Price Display */}
//                       <p className="text-xs text-gray-300">{book.subject} • ₹{book.price}</p>
//                   </div>
//                   <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
//                       <Eye size={32} />
//                       <p className="font-semibold mt-2 text-sm">View Details</p>
//                   </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-20 bg-white rounded-xl shadow-sm">
//               <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-lg font-medium text-gray-900">No matching books found</h3>
//               <p className="mt-1 text-sm text-gray-500">Try adjusting your search term.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }