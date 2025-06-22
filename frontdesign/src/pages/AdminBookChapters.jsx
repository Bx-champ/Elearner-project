import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminBookChapters() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/auth/book/${id}`)
      .then(res => {
        setBook(res.data.book);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load book', err);
        alert('Failed to load book');
      });
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!book) return <p className="text-center mt-10">Book not found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-20 pb-10 px-4 sm:px-6 md:px-8 flex flex-col md:flex-row gap-6 relative">

      {activeChapter !== null && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-10 pointer-events-none"></div>
      )}

      {/* LEFT: Book Info */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:w-1/3 bg-white rounded-2xl shadow-xl p-4 sticky md:top-20 self-start z-20"
      >
        <div className="overflow-hidden rounded-xl">
          <motion.img 
            src={book.coverUrl || 'https://via.placeholder.com/600x400?text=No+Cover'}
            alt={book.name}
            className="w-full h-48 object-cover rounded-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Cover'; }}
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#16355a] mt-3 mb-1">{book.name}</h2>
        <p className="text-sm text-gray-600 mb-1">{book.subject}</p>
        <p className="text-sm text-gray-500 mb-1">Tags: {book.tags || 'N/A'}</p>
        <p className="text-sm text-gray-400 mb-2">Price: ₹{book.price}</p>
        <p className="text-xs text-gray-500">{book.contents}</p>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link 
            to="/admin"
            className="inline-block text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to dashboard
          </Link>

          {/* <Link
            to={`/admin/edit/${book._id}`}
            className="inline-flex bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full px-4 py-1 shadow items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit Book
          </Link> */}
        </div>
      </motion.div>

      {/* RIGHT: Chapters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:w-2/3 space-y-4 z-20"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h3 className="text-lg sm:text-xl font-semibold text-[#16355a]">📑 Chapters</h3>

          <Link
            to={`/admin/edit/${book._id}`}
            className="inline-flex bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full px-4 py-1 shadow items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit Book
          </Link>
        </div>

        {book.chapters.length === 0 ? (
          <p className="text-gray-500">No chapters found.</p>
        ) : (
          book.chapters
            .sort((a, b) => a.order - b.order)
            .map((ch, idx) => (
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

                  <div className="flex flex-wrap gap-2 justify-end">
                    {ch.pdfUrl ? (
                      <a 
                        href={ch.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs border border-blue-600 rounded-full px-3 py-1"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No PDF</span>
                    )}
                    <button
                      onClick={() => setActiveChapter(activeChapter === idx ? null : idx)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {activeChapter === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
            ))
        )}
      </motion.div>
    </div>
  );
}
