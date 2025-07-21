import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BASE_URL } from '../config';

export default function AdminAccessManager() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.token) return;

    axios.get(`${BASE_URL}/api/auth/admin/access-management`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      }
    })
    .then(res => {
      setData(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to load access data", err);
      setLoading(false);
    });
  }, [user]);

  const toggleExpand = (userId) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  const revokeAccess = async (accessId, chapterId, type, userId, bookId) => {
    try {
      if (type === 'approved') {
        await axios.delete(`${BASE_URL}/api/auth/admin/revoke-access/${accessId}/${chapterId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else if (type === 'expiry') {
        await axios.delete(`${BASE_URL}/api/auth/admin/revoke-expiry-access/${userId}/${bookId}/${chapterId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }

      // Update UI
      setData(prev =>
        prev.map(user => ({
          ...user,
          chapters: user.chapters.filter(
            ch => !(ch.accessId === accessId && ch.chapterId === chapterId && ch.type === type)
          )
        }))
      );
    } catch (err) {
      alert("❌ Failed to revoke access");
      console.error(err);
    }
  };

  const getTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
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

  const filteredUsers = data.filter(u =>
    u.user.name.toLowerCase().includes(search.toLowerCase()) ||
    u.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!user?.token) {
    return <div className="p-6 text-red-600">❌ Admin token missing. Please log in.</div>;
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#f4f2ec] relative">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        🔐 Admin Access Manager
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-400"
        />
      </div>

      {loading ? (
        <div className="text-blue-500 text-base md:text-lg">⏳ Loading user access info...</div>
      ) : (
        <div className="space-y-4 relative z-10">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500">🙁 No users found with access.</p>
          ) : (
            filteredUsers.map(({ user, chapters }) => {
              const isOpen = expanded.has(user._id);

              return (
                <div
                  key={user._id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
                    expanded.size > 0 && !isOpen ? 'blur-sm pointer-events-none opacity-60' : ''
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => toggleExpand(user._id)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-100 focus:outline-none"
                  >
                    <div className="text-left">
                      <h2 className="text-base md:text-lg font-semibold text-gray-800 break-all">
                        👤 {user.name}{' '}
                        <span className="text-sm text-gray-500 block md:inline">({user.email})</span>
                      </h2>
                    </div>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {/* Dropdown */}
                  {isOpen && (
                    <ul className="space-y-3 px-4 pb-4">
                      {chapters.length === 0 ? (
                        <p className="text-sm text-gray-400">No chapters with access</p>
                      ) : (
                        chapters.map((ch) => (
                          <li
                            key={`${ch.accessId || `${user._id}-${ch.chapterId}`}-${ch.chapterId}`}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center border p-3 rounded-md hover:shadow-sm transition bg-gray-50"
                          >
                            <div className="text-sm text-gray-700 mb-2 sm:mb-0 break-words">
                              <strong className="text-blue-600">{ch.bookName}</strong> — {ch.chapterName}
                              {ch.expiresAt && (
                                <span className="block text-xs text-red-500 mt-1">
                                  {getTimeLeft(ch.expiresAt)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => revokeAccess(ch.accessId, ch.chapterId, ch.type, user._id, ch.bookId)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium transition self-start sm:self-auto"
                            >
                              🗑 Revoke
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
