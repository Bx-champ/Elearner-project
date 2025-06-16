import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/books')

      .then(res => setBooks(res.data.books))
      .catch(err => console.error('Failed to load books'));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/admin/book/${id}`);
      setBooks(prev => prev.filter(book => book._id !== id));
    } catch (err) {
      alert('Deletion failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-6 md:px-12">
      <h2 className="text-3xl font-bold text-[#16355a] mb-6">📚 Admin Book Library</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map(book => (
          <div key={book._id} className="bg-white rounded-2xl p-5 shadow-lg relative border border-gray-100">
            <img src={book.coverUrl} alt="cover" className="h-48 w-full object-cover rounded-xl mb-4" />
            <h3 className="text-xl font-semibold text-[#2f3e52]">{book.name}</h3>
            <p className="text-sm text-gray-500">{book.subject} • ₹{book.price}</p>
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{book.contents}</p>
            <div className="flex items-center justify-between mt-4">
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" /> View PDF
              </a>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(book._id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
