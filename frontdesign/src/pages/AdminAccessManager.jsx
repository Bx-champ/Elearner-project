import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';

export default function AdminAccessManager() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.token) return;

    axios.get('http://localhost:5000/api/auth/admin/access-management', {
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

  const revokeAccess = async (accessId, chapterId) => {
  try {
    await axios.delete(`http://localhost:5000/api/auth/admin/revoke-access/${accessId}/${chapterId}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    setData(prev =>
      prev.map(user => ({
        ...user,
        chapters: user.chapters.filter(ch => ch.accessId !== accessId || ch.chapterId !== chapterId)
      }))
    );
  } catch (err) {
    alert("❌ Failed to revoke access");
    console.error(err);
  }
};


  const filteredUsers = data.filter(u =>
    u.user.name.toLowerCase().includes(search.toLowerCase()) ||
    u.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!user?.token) {
    return <div className="p-6 text-red-600">❌ Admin token missing. Please log in.</div>;
  }

return (
  <div className="p-4 md:p-6 min-h-screen bg-gray-50">
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
      <div className="space-y-6">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500">🙁 No users found with access.</p>
        ) : (
          filteredUsers.map(({ user, chapters }) => (
            <div
              key={user._id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="mb-2">
                <h2 className="text-base md:text-lg font-semibold text-gray-800 break-all">
                  👤 {user.name}{' '}
                  <span className="text-sm text-gray-500 block md:inline">({user.email})</span>
                </h2>
              </div>

              {chapters.length === 0 ? (
                <p className="text-sm text-gray-400">No chapters with access</p>
              ) : (
                <ul className="space-y-3 mt-3">
                  {chapters.map((ch) => (
                    <li
                      key={`${ch.accessId}-${ch.chapterId}`}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center border p-3 rounded-md hover:shadow-sm transition"
                    >
                      <div className="text-sm text-gray-700 mb-2 sm:mb-0 break-words">
                        <strong className="text-blue-600">{ch.bookName}</strong> — {ch.chapterName}
                      </div>
                      <button
                        onClick={() => revokeAccess(ch.accessId, ch.chapterId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition self-start sm:self-auto"
                      >
                        🗑 Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    )}
  </div>
);

}
