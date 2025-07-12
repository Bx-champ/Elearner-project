import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Pencil } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/books');
      setBooks(res.data.books);
    } catch (err) {
      console.error('Failed to load books', err);
      alert('Failed to load books');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/admin/book/${id}`);
      setBooks(prev => prev.filter(book => book._id !== id));
      alert('✅ Book deleted successfully');
    } catch (err) {
      console.error('Delete failed', err);
      alert('❌ Failed to delete the book');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-6 md:px-12">
      <h2 className="text-3xl font-bold text-[#16355a] mb-6">📚 Admin Book Library</h2>

      {books.length === 0 ? (
        <p className="text-gray-500">No books uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

          {books.map(book => (
            <div
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
              <div 
                onClick={() => navigate(`/admin/book/${book._id}`)} 
                className="relative z-10 space-y-2 cursor-pointer"
              >
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={book.coverUrl}
                    alt={book.name}
                    className="rounded-xl transition-transform duration-500 group-hover:scale-105 "
                  />
                </div>

                <h3 className="text-xl font-bold text-[#1f2937] drop-shadow-sm">{book.name}</h3>
                <p className="text-sm text-gray-600">{book.subject} • ₹{book.price}</p>
                <p className="text-sm text-gray-500 line-clamp-3">{book.contents}</p>
              </div>

              <div className="relative z-10 flex justify-end gap-3 mt-3">
                <button 
                  onClick={() => handleDelete(book._id)} 
                  className="text-red-600 hover:text-red-800 transition"
                  title="Delete Book"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <Link 
                  to={`/admin/edit/${book._id}`} 
                  className="text-green-600 hover:text-green-800 transition"
                  title="Edit Book"
                >
                  <Pencil className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

