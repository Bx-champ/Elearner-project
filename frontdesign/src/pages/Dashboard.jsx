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
              <p className="text-sm text-gray-600">{book.subject} • ₹{book.price}</p>
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
