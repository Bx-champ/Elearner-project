
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { UserPlus, BookOpen, FileText, Users, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    year: 0,
    recentUsers: [],
    totalBooks: 0,
    totalChapters: 0,
    loggedInUsers: 0,
    onlineUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStatsRes = await axios.get(`${BASE_URL}/api/auth/admin/user-stats`);
        const platformStatsRes = await axios.get(`${BASE_URL}/api/auth/admin/platform-stats`);
        setStats({
          ...userStatsRes.data,
          ...platformStatsRes.data,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-28 px-4 md:px-10 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LEFT SIDE – Cards */}
        <div className="md:col-span-2 flex flex-col gap-8">

          {/* User Registration Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6 transition hover:shadow-lg">
            <h2 className="text-2xl font-bold text-[#16355a] flex items-center gap-2 mb-4">
              <UserPlus className="text-blue-600" /> User Registrations
            </h2>
            <ul className="text-lg space-y-3">
              <li>👤 Today: <span className="font-semibold text-blue-800">{stats.today}</span></li>
              <li>📅 This Week: <span className="font-semibold text-blue-800">{stats.week}</span></li>
              <li>📆 This Year: <span className="font-semibold text-blue-800">{stats.year}</span></li>
            </ul>
          </div>

          {/* Platform Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6 transition hover:shadow-lg">
            <h2 className="text-2xl font-bold text-[#16355a] flex items-center gap-2 mb-4">
              <Activity className="text-green-600" /> Platform Activity
            </h2>
            <ul className="text-lg space-y-3">
              <li><BookOpen className="inline mr-2 text-indigo-600" /> Books: <span className="font-semibold">{stats.totalBooks}</span></li>
              <li><FileText className="inline mr-2 text-indigo-600" /> Chapters: <span className="font-semibold">{stats.totalChapters}</span></li>
              <li><Users className="inline mr-2 text-indigo-600" /> Logged In Users: <span className="font-semibold">{stats.loggedInUsers}</span></li>
              <li>⚡ Online Now: <span className="font-semibold text-green-600">{stats.onlineUsers}</span></li>
            </ul>
          </div>

        </div>

        {/* RIGHT SIDE – Recent Registrations */}
        <div className="md:col-span-1 h-full">
          <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col transition hover:shadow-lg">
            <h2 className="text-2xl font-bold text-[#16355a] mb-4">🆕 Recent Registrations</h2>
            <div className="overflow-y-auto flex-1 pr-1 max-h-[600px] scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
              {stats.recentUsers.length === 0 ? (
                <p className="text-gray-500">No recent users.</p>
              ) : (
                <ul className="space-y-4">
                  {stats.recentUsers.map((user, i) => (
                    <li key={i} className="border-b pb-2">
                      <div className="font-semibold text-blue-700">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-400">
                        Registered at: {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
