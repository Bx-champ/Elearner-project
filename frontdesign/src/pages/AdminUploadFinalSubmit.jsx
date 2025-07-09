import React, { useState } from 'react';
import axios from 'axios';

export default function AdminUploadFinalSubmit({ bookData, chapterData }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      setUploading(true);
      setMessage('Uploading book data...');

      const formData = new FormData();

      // ✅ Add book fields
      formData.append('name', bookData.name);
      formData.append('contents', bookData.contents);
      formData.append('subject', bookData.subject);
      formData.append('tags', bookData.tags);

      // ✅ Add cover and book PDF
      formData.append('cover', bookData.coverPage);
      formData.append('pdf', bookData.bookPdf);

      // ✅ Include chapter price and other metadata
      const chaptersMeta = chapterData.chapters.map((ch, index) => ({
        name: ch.name,
        description: ch.description,
        fromPage: ch.fromPage,
        toPage: ch.toPage,
        price: ch.price, // ✅ Needed for total book price
        order: index,
      }));

      formData.append('chaptersMeta', JSON.stringify(chaptersMeta));

      // ✅ Submit to backend
      const res = await axios.post('http://localhost:5000/api/admin/save-book', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ Book uploaded successfully!');
      console.log('Uploaded book:', res.data.book);
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
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

        <button
          onClick={handleSubmit}
          disabled={uploading}
          className={`mt-6 ${
            uploading ? 'bg-gray-400' : 'bg-[#4457ff] hover:bg-[#3b4ed3]'
          } text-white py-2 px-6 rounded-lg shadow-md w-full font-semibold transition`}
        >
          {uploading ? 'Uploading...' : 'Upload Book 🚀'}
        </button>

        {message && <p className="mt-4 text-center text-[#16355a] font-medium">{message}</p>}
      </div>
    </div>
  );
}
