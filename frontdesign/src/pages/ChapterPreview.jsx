// 📁 src/pages/ChapterPreview.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// ✅ Use the local worker you copied to public/pdf.worker.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export default function ChapterPreview() {
  const { bookId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/auth/book/${bookId}/chapter/${chapterId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Error loading chapter:', err));
  }, [bookId, chapterId]);

  useEffect(() => {
    if (!data || !data.pdfUrl) return;

    const renderPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(data.pdfUrl);
        const pdf = await loadingTask.promise;

        const { fromPage, toPage } = data;

        const pages = [];
        for (let i = fromPage; i <= toPage; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.3 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          await page.render({ canvasContext: context, viewport }).promise;

          pages.push(canvas);
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          pages.forEach((canvas) => containerRef.current.appendChild(canvas));
        }
      } catch (err) {
        console.error('Error rendering PDF:', err);
      }
    };

    renderPDF();
  }, [data]);

  if (!data) return <p className="p-10">Loading chapter...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-2">{data.name}</h2>
      <p className="text-gray-600 mb-4">{data.description}</p>

      <div ref={containerRef} className="space-y-4 bg-white p-4 rounded shadow-lg"></div>
    </div>
  );
}
