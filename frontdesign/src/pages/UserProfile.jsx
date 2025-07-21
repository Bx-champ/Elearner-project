import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import { UserCircle, Clock, Eye, Lock } from 'lucide-react';

export default function UserProfile() {
  const { user } = useContext(AuthContext);
  const [activity, setActivity] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    if (!user?.token) return;
    axios.get('http://localhost:5000/api/auth/user/activity-summary', {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => {
      setActivity(res.data.summary);
    }).catch(err => console.error('Failed to fetch activity summary', err));
  }, [user]);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    // 🔐 Optional: Implement backend endpoint for password update
    alert("Password update functionality not implemented.");
  };

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 bg-gradient-to-b from-[#f4f4f4] to-[#e8e8e8]">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-8">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <UserCircle size={60} className="text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'Unnamed User'}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <Eye className="mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">Chapters Viewed</p>
            <p className="text-xl font-semibold text-blue-700">{activity?.totalViews || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <Clock className="mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">Time Spent</p>
            <p className="text-xl font-semibold text-blue-700">{activity?.totalTime || 0} min</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <Clock className="mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">Last Active</p>
            <p className="text-sm text-gray-700">{activity?.lastSeen ? new Date(activity.lastSeen).toLocaleString() : '—'}</p>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Lock size={16} />
            {showPasswordForm ? 'Hide' : 'Change Password'}
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Old Password"
                value={passwordData.oldPassword}
                onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
