import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminActivityDashboard() {
  const [report, setReport] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/admin/student-activity-report')
      .then((res) => setReport(res.data.report))
      .catch((err) => console.error('Failed to load activity report:', err));
  }, []);

  // Utility: convert seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="min-h-screen pt-20 px-6 bg-[#f4f2ec]">
      <h2 className="text-2xl font-bold text-[#16355a] mb-6">📊 Student Activity Dashboard</h2>

      <div className="overflow-x-auto shadow rounded bg-white">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-3">👤 Name</th>
              <th className="p-3">📧 Email</th>
              {/* <th className="p-3">📄 Pages Viewed</th> */}
              <th className="p-3">⏱️ Total Time Spent</th>
              <th className="p-3">🕒 Last Session Time</th>
              <th className="p-3">🕓 Last Active</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r, i) => {
              const now = new Date();
              const lastSeen = new Date(r.lastSeen);
              const secondsSinceLastActive = Math.floor((now - lastSeen) / 1000);

              return (
                <tr key={i} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  {/* <td className="p-3">{r.totalViews}</td> */}
                  <td className="p-3">{formatTime(r.totalTime)}</td>
                  <td className="p-3">{formatTime(Math.min(secondsSinceLastActive, r.totalTime))}</td>
                  <td className="p-3">{lastSeen.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {report.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">No activity data yet.</p>
        )}
      </div>
    </div>
  );
}
