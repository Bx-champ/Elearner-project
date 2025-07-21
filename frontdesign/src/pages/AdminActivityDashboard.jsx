import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, CircleDot } from 'lucide-react';
import { BASE_URL } from '../config';

export default function AdminActivityDashboard() {
  const [report, setReport] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/auth/admin/student-activity-report`)
      .then((res) => setReport(res.data.report || []))
      .catch((err) => console.error('Failed to load activity report:', err));
  }, []);

  const toggleExpand = (userId) => {
    setExpandedUserId(prev => (prev === userId ? null : userId));
  };

  return (
    <div className="min-h-screen pt-20 px-6 bg-[#f4f2ec]">
      <h2 className="text-2xl font-bold text-[#16355a] mb-6">🟢 Student Activity Overview</h2>

      <div className="bg-white shadow rounded overflow-hidden">
        {report.map((r) => {
          const userId = r.userId || r._id; // Ensure unique key
          const lastSeen = r.lastSeen ? new Date(r.lastSeen) : null;
          const isExpanded = expandedUserId === userId;

          return (
            <div key={userId} className="border-b">
              {/* User Summary Row */}
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleExpand(userId)}
              >
                <div className="flex items-center gap-3">
                  <CircleDot className={r.isOnline ? 'text-green-500' : 'text-gray-400'} size={14} />
                  <span className="font-medium text-[#16355a]">{r.name || 'Unnamed User'}</span>
                </div>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-gray-50 px-6 py-4 text-sm text-[#2f3e52]">
                  <p><strong>📧 Email:</strong> {r.email || 'N/A'}</p>
                  <p><strong>📚 Books Assigned:</strong> {r.booksAssigned ?? 0}</p>
                  <p><strong>📄 Chapters Assigned:</strong> {r.chaptersAssigned ?? 0}</p>
                  <p><strong>🕓 Last Seen:</strong> {lastSeen ? lastSeen.toLocaleString() : 'Unknown'}</p>
                </div>
              )}
            </div>
          );
        })}

        {report.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">No student activity yet.</p>
        )}
      </div>
    </div>
  );
}
