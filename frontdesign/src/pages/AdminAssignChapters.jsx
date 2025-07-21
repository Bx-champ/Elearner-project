import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function AdminAssignChapters() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    axios.get(`${BASE_URL}/api/auth/admin/all-users`)
      .then(res => setUsers(res.data.users))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/auth/books`)
      .then(res => setBooks(res.data.books))
      .catch(err => console.error('Failed to fetch books:', err));
  }, []);

  const handleAssign = () => {
    if (!selectedUserId || !selectedBookId || selectedChapters.length === 0 || !duration) {
      alert('Fill all fields');
      return;
    }

    axios.post(`${BASE_URL}/api/auth/admin/assign-chapters`, {
      userId: selectedUserId,
      bookId: selectedBookId,
      chapters: selectedChapters,
      durationDays: parseInt(duration)
    })
    .then(() => alert('✅ Chapters assigned!'))
    .catch(err => {
      console.error('Error assigning chapters:', err);
      alert('❌ Failed to assign');
    });
  };

  const selectedBook = books.find(b => b._id === selectedBookId);

  return (
    <div className="p-8 pt-24 bg-[#f4f2ec] min-h-screen">
      <h2 className="text-2xl font-bold text-[#16355a] mb-6">📖 Assign Chapters to Student</h2>

      {/* User Select by Email */}
      <label className="block mb-2 text-sm font-medium text-gray-700">👤 Select User (by Email)</label>
      <select
        className="w-full p-2 border mb-4"
        value={selectedUserId}
        onChange={e => setSelectedUserId(e.target.value)}
      >
        <option value="">-- Select Email --</option>
        {users.map(user => (
          <option key={user._id} value={user._id}>{user.email}</option>
        ))}
      </select>

      {/* Book Select */}
      <label className="block mb-2 text-sm font-medium text-gray-700">📚 Select Book</label>
      <select
        className="w-full p-2 border mb-4"
        value={selectedBookId}
        onChange={e => {
          setSelectedBookId(e.target.value);
          setSelectedChapters([]);
        }}
      >
        <option value="">-- Select Book --</option>
        {books.map(book => (
          <option key={book._id} value={book._id}>{book.name}</option>
        ))}
      </select>

      {/* Chapters Select */}
      {selectedBook && (
        <>
          <label className="block mb-2 text-sm font-medium text-gray-700">📄 Select Chapters</label>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedBook.chapters.map(ch => (
              <label key={ch._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={ch._id}
                  checked={selectedChapters.includes(ch._id)}
                  onChange={e => {
                    const checked = e.target.checked;
                    setSelectedChapters(prev =>
                      checked ? [...prev, ch._id] : prev.filter(id => id !== ch._id)
                    );
                  }}
                />
                {ch.name}
              </label>
            ))}
          </div>
        </>
      )}

      {/* Duration Input */}
      <label className="block mb-2 text-sm font-medium text-gray-700">⏳ Duration (days)</label>
      <input
        type="number"
        className="w-full p-2 border mb-6"
        value={duration}
        onChange={e => setDuration(e.target.value)}
      />

      <button
        onClick={handleAssign}
        className="bg-[#4457ff] text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Assign Chapters
      </button>
    </div>
  );
}
