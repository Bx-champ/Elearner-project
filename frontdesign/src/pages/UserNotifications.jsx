import React, { useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import { Bell, CheckCircle } from 'lucide-react';
import socket from '../socket';
import { NotificationContext } from '../context/NotificationContext';

export default function UserNotifications() {
  const { user } = useContext(AuthContext);
  const { notifications, setNotifications, markAllAsRead } = useContext(NotificationContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;

    // 1️⃣ Fetch notifications
    axios
      .get('http://localhost:5000/api/auth/user/notifications', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then(res => {
        setNotifications(res.data.notifications);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err);
        setLoading(false);
      });

    // 2️⃣ Register user for socket
    socket.emit('register', user._id);

    // 3️⃣ Listen for new notifications
    socket.on('notification', newNotification => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    // 4️⃣ Cleanup
    return () => {
      socket.off('notification');
    };
  }, [user, setNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f2ec] to-[#e8e6df] pt-24 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="sticky top-[80px] z-10 bg-[#f4f2ec]/80 backdrop-blur shadow-sm rounded-xl px-4 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-[#16355a]" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#16355a]">Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            ✅ Mark all as read
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-gray-500 text-center text-lg mt-10 animate-pulse">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500 text-center text-lg mt-10">You’re all caught up! 🎉</p>
      ) : (
        <div className="grid gap-4">
          {notifications.map((n, i) => (
            <div
              key={i}
              className={`transition duration-300 rounded-xl p-4 border shadow-sm relative group ${
                n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-[#2f3e52]">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead ? (
                  <span className="flex items-center justify-center text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full animate-pulse">
                    🔵 Unread
                  </span>
                ) : (
                  <span className="hidden sm:flex items-center text-green-500 text-xs gap-1">
                    <CheckCircle size={14} /> Read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
