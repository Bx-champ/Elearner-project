// src/context/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import socket from '../socket';
import { AuthContext } from '../authContext';
import { BASE_URL } from '../config';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    // Fetch initial notifications
    axios.get(`${BASE_URL}/api/auth/user/notifications`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    .then(res => setNotifications(res.data.notifications || []))
    .catch(err => console.error('Notification fetch error:', err));

    // Register socket and listen for new notifications
    socket.emit('register', user._id);
    socket.on('notification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      socket.off('notification');
    };
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await axios.put(`${BASE_URL}/api/auth/user/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
