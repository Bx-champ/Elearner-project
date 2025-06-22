import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function UserDashboard() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate(); // ⬅️ initialize
  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/books')
      .then(res => setBooks(res.data.books))
      .catch(err => console.error('Failed to load books:', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-24 px-6 md:px-12">
      {/* <h2 className="text-3xl font-bold text-[#16355a] mb-8">📚 Your Books</h2> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map(book => (
          <div
      onClick={() => navigate(`/user/book/${book._id}`)}     
  key={book._id}
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
        className="rounded-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-[0.5deg]"
      />
    </div>

    <h3 className="text-xl font-bold text-[#1f2937] drop-shadow-sm">{book.name}</h3>
    <p className="text-sm text-gray-600">{book.subject} • ₹{book.price}</p>
    <p className="text-sm text-gray-500 line-clamp-3">{book.contents}</p>

    <div className="flex items-center justify-between mt-3">
      {/* <a
        href={book.pdfUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
      >
        <BookOpen className="w-4 h-4" /> View PDF
      </a> */}
    </div>
  </div>
</div>

        ))}
      </div>
    </div>
  );
}
