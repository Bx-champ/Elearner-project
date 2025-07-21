import React, { useEffect, useState, useContext } from 'react';
import socket from '../socket';
import axios from 'axios';
import { Bell, CheckCircle } from 'lucide-react';
import { AuthContext } from '../authContext';

export default function AdminNotifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    // Fetch admin notifications
    axios.get('http://localhost:5000/api/auth/admin/notifications', {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setNotifications(res.data.notifications));

    // Register socket
    socket.emit('register', user._id);

    // Listen for admin notifications
    const handleAdminNotification = (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    };

    socket.on('adminNotification', handleAdminNotification);

    return () => {
      socket.off('adminNotification', handleAdminNotification);
    };
  }, [user]);

  return (
    <div className="pt-24 px-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#16355a] flex gap-2 items-center">
          <Bell /> Admin Notifications
        </h2>
      </div>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p>No admin notifications yet.</p>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
              <p>{n.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
