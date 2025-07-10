// 📁 src/pages/ChapterPreview.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export default function ChapterPreview() {
  const { bookId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'double'
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
          const viewport = page.getViewport({ scale: 1.4 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          await page.render({ canvasContext: context, viewport }).promise;

          pages.push(canvas);
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          if (viewMode === 'double') {
            for (let i = 0; i < pages.length; i += 2) {
              const row = document.createElement('div');
              row.className = 'flex flex-col md:flex-row gap-4 justify-center items-start mb-4';
              row.appendChild(pages[i]);
              if (pages[i + 1]) row.appendChild(pages[i + 1]);
              containerRef.current.appendChild(row);
            }
          } else {
            pages.forEach((canvas) => {
              const wrapper = document.createElement('div');
              wrapper.className = 'flex justify-center mb-4';
              wrapper.appendChild(canvas);
              containerRef.current.appendChild(wrapper);
            });
          }
        }
      } catch (err) {
        console.error('Error rendering PDF:', err);
      }
    };

    renderPDF();
  }, [data, viewMode]);

  if (!data) return <p className="p-10">Loading chapter...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-28 px-4 py-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#16355a]">{data.name}</h2>
            <p className="text-sm text-gray-600">{data.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                viewMode === 'single'
                  ? 'bg-[#4457ff] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setViewMode('single')}
            >
              📄 Single Page
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                viewMode === 'double'
                  ? 'bg-[#4457ff] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setViewMode('double')}
            >
              📄📄 Two Pages
            </button>
          </div>
        </div>

        <div ref={containerRef} className="w-full overflow-auto pb-10"></div>
      </div>
    </div>
  );
}
