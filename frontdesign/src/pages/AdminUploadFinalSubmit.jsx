
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function AdminUploadFinalSubmit({ bookData, chapterData }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const cancelTokenSource = useRef(null); // 🔁 Store cancel token

  const handleSubmit = async () => {
    try {
      setUploading(true);
      setMessage('Uploading book data...');

      const formData = new FormData();
      formData.append('name', bookData.name);
      formData.append('contents', bookData.contents);
      formData.append('subject', bookData.subject);
      formData.append('tags', bookData.tags);
      formData.append('cover', bookData.coverPage);
      formData.append('pdf', bookData.bookPdf);

      const chaptersMeta = chapterData.chapters.map((ch, index) => ({
        name: ch.name,
        description: ch.description,
        fromPage: ch.fromPage,
        toPage: ch.toPage,
        price: ch.price,
        order: index,
      }));
      formData.append('chaptersMeta', JSON.stringify(chaptersMeta));

      // 🔁 Create cancel token
      cancelTokenSource.current = axios.CancelToken.source();

      const res = await axios.post(`${BASE_URL}/api/admin/save-book`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        cancelToken: cancelTokenSource.current.token,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setMessage(`Uploading... ${percent}%`);
        },
      });

      setMessage('✅ Book uploaded successfully!');
      console.log('Uploaded book:', res.data.book);
    } catch (err) {
      if (axios.isCancel(err)) {
        setMessage('⚠️ Upload cancelled by user.');
      } else {
        console.error('Upload failed:', err);
        setMessage('❌ Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Upload cancelled by user.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-4 md:px-12 pb-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-[#16355a] mb-6">📤 Final Review & Upload</h2>

        <div className="space-y-2">
          <p><strong>Book:</strong> {bookData.name}</p>
          <p><strong>Subject:</strong> {bookData.subject}</p>
          <p><strong>Total Price:</strong> ₹{chapterData.price}</p>
        </div>

        <div className="mt-4 space-y-2">
          {chapterData.chapters.map((ch, idx) => (
            <div key={idx} className="p-2 border rounded">
              <p><strong>{idx + 1}. {ch.name}</strong> — Pages {ch.fromPage} to {ch.toPage} • ₹{ch.price}</p>
              <p className="text-sm text-gray-500">{ch.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className={`w-full py-2 px-6 rounded-lg shadow-md font-semibold transition ${
              uploading ? 'bg-gray-400' : 'bg-[#4457ff] hover:bg-[#3b4ed3]'
            } text-white`}
          >
            {uploading ? 'Uploading...' : 'Upload Book 🚀'}
          </button>

          {uploading && (
            <button
              onClick={handleCancelUpload}
              className="w-full py-2 px-6 rounded-lg shadow-md font-semibold bg-red-500 hover:bg-red-600 text-white transition"
            >
              Stop Upload ❌
            </button>
          )}
        </div>

        {message && <p className="mt-4 text-center text-[#16355a] font-medium">{message}</p>}
      </div>
    </div>
  );
}
