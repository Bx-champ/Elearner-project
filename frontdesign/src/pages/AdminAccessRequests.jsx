import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { BASE_URL } from '../config';

export default function AdminAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/admin/access-requests`);
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to fetch access requests:', err);
      alert('❌ Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setUpdatingId(requestId);
      await axios.put(`${BASE_URL}/api/auth/admin/access-request-status`, {
        requestId,
        status: newStatus,
      });
      fetchRequests(); // Refresh
    } catch (err) {
      console.error(`Error updating request ${requestId}:`, err);
      alert('❌ Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-100">
      <h1 className="text-2xl font-semibold mb-6 text-center text-[#1e293b]">📬 Access Requests</h1>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500">No access requests yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="space-y-1 mb-3 sm:mb-0">
                  <p className="text-[#0f172a] font-semibold">
                    📘 {req.bookId?.name || 'Book not found'}
                  </p>
                  <p className="text-sm text-gray-600">
                    👤 {req.userId?.name} ({req.userId?.email})
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-700">
  🧩 Chapters:
  {req.chapterNames?.map((ch, i) => (
    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
      {ch}
    </span>
  )) || <span>Unknown</span>}
</div>


                  <p className="text-xs text-gray-400">
                    Requested At: {new Date(req.requestedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      req.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : req.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {req.status}
                  </span>

                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(req._id, 'approved')}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm flex items-center gap-1"
                        disabled={updatingId === req._id}
                      >
                        {updatingId === req._id ? (
                          <Loader className="animate-spin w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(req._id, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm flex items-center gap-1"
                        disabled={updatingId === req._id}
                      >
                        {updatingId === req._id ? (
                          <Loader className="animate-spin w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
