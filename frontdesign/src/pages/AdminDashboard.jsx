import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      alert('Book deleted successfully');
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete the book');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-6 md:px-12">
      <h2 className="text-3xl font-bold text-[#16355a] mb-6">📚 Admin Book Library</h2>

      {books.length === 0 ? (
        <p className="text-gray-500">No books uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map(book => (
            <div key={book._id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition relative">
              <div 
                onClick={() => navigate(`/admin/book/${book._id}`)} 
                className="cursor-pointer"
              >
                <img 
                  src={book.coverUrl} 
                  alt={book.name} 
                  className="h-48 w-full object-cover rounded-lg mb-3" 
                />
                <h3 className="text-lg font-semibold text-[#2f3e52]">{book.name}</h3>
                <p className="text-sm text-gray-500">{book.subject} • ₹{book.price}</p>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{book.contents}</p>
              </div>

              <div className="flex justify-end gap-3 mt-3">
                <button 
                  onClick={() => handleDelete(book._id)} 
                  className="text-red-600 hover:text-red-800"
                  title="Delete Book"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => alert('Edit coming soon!')} 
                  className="text-green-600 hover:text-green-800"
                  title="Edit Book"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
