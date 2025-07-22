import '../pdfWorker';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import { BASE_URL } from '../config';
import * as pdfjsLib from 'pdfjs-dist';

const user = JSON.parse(localStorage.getItem('user'));

export default function ChapterPreview() {
  const { bookId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const zoomWrapperRef = useRef(null);

  const [lastPageViewed, setLastPageViewed] = useState(null);
  const [lastTimeStamp, setLastTimeStamp] = useState(Date.now());
  const viewedPagesRef = useRef(new Set());

  const [springStyle, api] = useSpring(() => ({ scale: 1 }));

  // 🔒 Security
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    const handleCopy = (e) => {
      e.preventDefault();
      alert('Copying is disabled!');
    };

   const handlePrintScreen = (e) => {
  if (e.key === 'PrintScreen') {
    alert('Screenshot detected. Logging out...');
    localStorage.removeItem('user');
    window.location.href = '/signin'; // or your actual login route
  }
};


    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handlePrintScreen);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handlePrintScreen);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  // 🔍 Pinch & Wheel Zoom
  useGesture(
    {
      onPinch: ({ offset: [d], event }) => {
        event.preventDefault();
        const newScale = Math.min(Math.max(d / 200 + 1, 0.5), 3);
        api.start({ scale: newScale });
      },
      onWheel: ({ event }) => {
        if (event.ctrlKey) {
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.1 : 0.1;
          api.start((prev) => {
            const newScale = Math.min(Math.max(prev.scale.get() + delta, 0.5), 3);
            return { scale: newScale };
          });
        }
      }
    },
    {
      target: zoomWrapperRef,
      eventOptions: { passive: false },
      pinch: { scaleBounds: { min: 0.5, max: 3 }, rubberband: true },
      wheel: { axis: 'y' }
    }
  );

  useEffect(() => {
    axios.get(`${BASE_URL}/api/auth/book/${bookId}/chapter/${chapterId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Error loading chapter:', err));
  }, [bookId, chapterId]);

  useEffect(() => {
    return () => {
      if (lastPageViewed !== null) {
        const duration = Math.floor((Date.now() - lastTimeStamp) / 1000);
        sendActivityLog(lastPageViewed, duration);
      }
    };
  }, [lastPageViewed, lastTimeStamp]);

  useEffect(() => {
    if (!data?.pdfUrl) return;

    const renderPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(data.pdfUrl);
        const pdf = await loadingTask.promise;
        const { fromPage, toPage } = data;

        const container = containerRef.current;
        if (!container) return;

        // ✅ Prevent duplicate pages
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const pageWidth = 600;
        const availableWidth = wrapperRef.current?.offsetWidth || 800;
        const scaleBase = availableWidth / pageWidth;
        const scale = scaleBase * zoomLevel;
        const dpiScale = window.devicePixelRatio || 1;

        for (let i = fromPage; i <= toPage; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width * dpiScale;
          canvas.height = viewport.height * dpiScale;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const context = canvas.getContext('2d');
          context.setTransform(dpiScale, 0, 0, dpiScale, 0, 0);
          await page.render({ canvasContext: context, viewport }).promise;

          const wrapper = document.createElement('div');
          wrapper.className = 'flex justify-center mb-4 page-anchor';
          wrapper.setAttribute('data-page', i);
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
        }

        setupObserver();
      } catch (err) {
        console.error('Render error:', err);
      }
    };

    renderPDF();
  }, [data, zoomLevel]);

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
          }
        });
      },
      { threshold: 0.5 }
    );

    const anchors = containerRef.current?.querySelectorAll('.page-anchor');
    anchors?.forEach((el) => observer.observe(el));
  };

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

  const sendActivityLog = async (pageNum, duration) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      if (!token) return;

      await axios.post(
        `${BASE_URL}/api/auth/activity-log`,
        { bookId, chapterId, pageNum, duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('❌ Log error:', err);
    }
  };

  if (!data) return <p className="p-10">Loading...</p>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f4f2ec] to-[#e8e6df] pt-20 px-2 md:px-6">

      {/* 🔐 Watermark */}
      {user && (
        <div className="fixed top-24 left-4 z-50 opacity-10 text-xs md:text-sm text-black pointer-events-none select-none">
          {user.email || user.name} | {new Date().toLocaleString()}
        </div>
      )}

      {/* 📑 Subchapter Dropdown */}
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

      {/* 🔍 Zoom Controls */}
      <div className="fixed top-24 right-6 z-50 flex flex-col items-end gap-2 bg-white p-3 rounded shadow">
        <div className="flex gap-2">
          <button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))} className="bg-gray-200 px-2 py-1 rounded">➕ Zoom</button>
          <button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} className="bg-gray-200 px-2 py-1 rounded">➖ Zoom</button>
          <button onClick={() => setZoomLevel(1.0)} className="bg-gray-200 px-2 py-1 rounded">🔄 Reset</button>
        </div>
      </div>

      {/* 📄 PDF Viewer */}
      <div ref={wrapperRef} className="w-full h-full overflow-auto pb-10">
        <div className="px-2 md:px-6">
          <h2 className="text-2xl font-bold text-[#16355a] mb-2">{data.name}</h2>
          <p className="text-sm text-gray-600 mb-6">{data.description}</p>

          <animated.div
            ref={zoomWrapperRef}
            style={{
              ...springStyle,
              transformOrigin: 'center top',
              display: 'inline-block',
              overflow: 'visible'
            }}
            className="min-w-full overflow-auto"
          >
            <div
              ref={containerRef}
              className="min-w-fit"
              style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            />
          </animated.div>
        </div>
      </div>
    </div>
  );
}
