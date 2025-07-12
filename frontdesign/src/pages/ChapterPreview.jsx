import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export default function ChapterPreview() {
  const { bookId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState('single');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lastPageViewed, setLastPageViewed] = useState(null);
  const [lastTimeStamp, setLastTimeStamp] = useState(Date.now());
  const viewedPagesRef = useRef(new Set());

  // Mobile check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch chapter
  useEffect(() => {
    axios.get(`http://localhost:5000/api/auth/book/${bookId}/chapter/${chapterId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Error loading chapter:', err));
  }, [bookId, chapterId]);

  // Cleanup (last viewed page)
  useEffect(() => {
    return () => {
      if (lastPageViewed !== null) {
        const duration = Math.floor((Date.now() - lastTimeStamp) / 1000);
        sendActivityLog(lastPageViewed, duration);
      }
    };
  }, [lastPageViewed, lastTimeStamp]);

  // PDF render
  useEffect(() => {
    if (!data?.pdfUrl) return;

    const renderPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(data.pdfUrl);
        const pdf = await loadingTask.promise;
        const { fromPage, toPage } = data;

        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';
        const availableWidth = wrapperRef.current?.offsetWidth || 800;
        const gap = 32;
        const pageWidth = 600;

        const scale = isMobile || viewMode === 'single'
          ? availableWidth / pageWidth
          : (availableWidth - gap) / (2 * pageWidth);

        const pages = [];

        for (let i = fromPage; i <= toPage; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          await page.render({ canvasContext: context, viewport }).promise;

          pages.push({ pageNum: i, canvas });
        }

        // Render logic
        if (!isMobile && viewMode === 'double') {
          for (let i = 0; i < pages.length; i += 2) {
            const row = document.createElement('div');
            row.className = 'flex justify-center items-start gap-4 mb-4';

            const left = document.createElement('div');
            left.className = 'page-anchor';
            left.setAttribute('data-page', pages[i].pageNum);
            left.appendChild(pages[i].canvas);
            row.appendChild(left);

            if (pages[i + 1]) {
              const right = document.createElement('div');
              right.className = 'page-anchor';
              right.setAttribute('data-page', pages[i + 1].pageNum);
              right.appendChild(pages[i + 1].canvas);
              row.appendChild(right);
            }

            container.appendChild(row);
          }
        } else {
          pages.forEach(({ pageNum, canvas }) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex justify-center mb-4 page-anchor';
            wrapper.setAttribute('data-page', pageNum);
            wrapper.appendChild(canvas);
            container.appendChild(wrapper);
          });
        }

        setupObserver();

      } catch (err) {
        console.error('Render error:', err);
      }
    };

    renderPDF();
  }, [data, viewMode, isMobile]);

  // Observer setup
  const setupObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page'));

          if (entry.isIntersecting) {
            const duration = lastPageViewed !== null ? Math.floor((now - lastTimeStamp) / 1000) : 0;
            if (lastPageViewed !== null) {
              sendActivityLog(lastPageViewed, duration);
            }

            setLastPageViewed(pageNum);
            setLastTimeStamp(now);
            viewedPagesRef.current.add(pageNum);

            console.log(`👁️ Page viewed: ${pageNum}`);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5, // 👈 more lenient visibility
      }
    );

    const anchors = containerRef.current?.querySelectorAll('.page-anchor');
    anchors?.forEach((el) => observer.observe(el));
    console.log(`✅ Observing ${anchors?.length || 0} pages`);
  };

  // Subchapter scroll
  const scrollToPage = (pageNum) => {
    const now = Date.now();
    if (lastPageViewed !== null) {
      const duration = Math.floor((now - lastTimeStamp) / 1000);
      sendActivityLog(lastPageViewed, duration);
    }

    const target = containerRef.current?.querySelector(`.page-anchor[data-page="${pageNum}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowDropdown(false);
      setLastPageViewed(pageNum);
      setLastTimeStamp(now);
    }
  };

  // Activity log
  const sendActivityLog = async (pageNum, duration) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      if (!token) return console.warn('⚠️ No token for log');

      await axios.post(
        'http://localhost:5000/api/auth/activity-log',
        { bookId, chapterId, pageNum, duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✅ Logged page ${pageNum} (${duration}s)`);
    } catch (err) {
      console.error('❌ Log error:', err);
    }
  };

  if (!data) return <p className="p-10">Loading...</p>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-20 px-2 md:px-6">
      {/* Subchapter dropdown */}
      {data.subchapters?.length > 0 && (
        <div className="fixed top-24 left-4 z-50">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-white border px-4 py-2 rounded-full shadow"
          >
            📑 Subchapters
          </button>
          {showDropdown && (
            <div className="absolute mt-2 bg-white border rounded shadow max-h-80 overflow-y-auto w-56">
              {data.subchapters.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => scrollToPage(Number(sub.fromPage))}
                  className="block px-4 py-2 text-sm w-full text-left hover:bg-blue-100"
                >
                  🔹 {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View toggle */}
      {!isMobile && (
        <div className="fixed top-24 right-6 z-50 bg-white rounded-full shadow px-3 py-2 flex gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              viewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('single')}
          >
            📄 Single
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              viewMode === 'double' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('double')}
          >
            📄📄 Double
          </button>
        </div>
      )}

      {/* PDF */}
      <div ref={wrapperRef} className="max-w-7xl mx-auto pt-4">
        <div className="px-2 md:px-6">
          <h2 className="text-2xl font-bold text-[#16355a] mb-2">{data.name}</h2>
          <p className="text-sm text-gray-600 mb-6">{data.description}</p>
          <div ref={containerRef} className="w-full overflow-x-hidden pb-10" />
        </div>
      </div>
    </div>
  );
}
