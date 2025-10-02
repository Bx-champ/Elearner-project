
// import '../pdfWorker'; // Ensures the PDF worker is bundled
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import { BASE_URL } from '../config';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Helper to get user info safely from localStorage
const getUserInfo = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    return null;
  }
};

export default function ChapterPreview() {
  const { bookId, chapterId } = useParams();
  const [chapterData, setChapterData] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(getUserInfo());
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  // ✅ --- New state for non-blocking notifications ---
  const [securityNotification, setSecurityNotification] = useState('');

  const containerRef = useRef(null);
  const pdfDocPromiseRef = useRef(null); 

  // --- Effect 1: Enhanced Security Measures ---
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // This function shows a temporary, non-blocking message
    const showNotification = (message) => {
        setSecurityNotification(message);
        setTimeout(() => {
            setSecurityNotification('');
        }, 3000); // Message disappears after 3 seconds
    };

    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'P') ||
        (e.ctrlKey && e.key.toUpperCase() === 'S')
      ) {
        e.preventDefault();
        showNotification('This functionality is disabled.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // ✅ --- FASTER PrintScreen Detection ---
    // The 'keyup' event is reliable for detection. Removing the alert() makes it fast.
    const handleKeyUp = (e) => {
        if (e.key === 'PrintScreen') {
            // Instantly blur the content to ruin the screenshot
            setIsBlurred(true);
            // Show a non-blocking notification instead of a blocking alert
            showNotification('Screenshot attempt detected and blocked.');
        }
    };
    window.addEventListener('keyup', handleKeyUp);

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // --- Effect 2: Fetch Metadata & Create Page Placeholders ---
  useEffect(() => {
    let isMounted = true;
    setError('');
    setIsLayoutReady(false);

    axios.get(`${BASE_URL}/api/auth/book/${bookId}/chapter/${chapterId}`)
      .then(res => {
        if (isMounted) {
          if (!res.data.pdfUrl) {
            throw new Error("PDF URL is missing in the API response.");
          }
          const data = res.data;
          setChapterData(data);
          
          const container = containerRef.current;
          if (container) {
            container.innerHTML = '';
            const pageCount = data.toPage - data.fromPage + 1;
            for (let i = 1; i <= pageCount; i++) {
              const pageWrapper = document.createElement('div');
              pageWrapper.className = 'flex justify-center items-center mb-4 page-anchor bg-gray-200 rounded-md animate-pulse min-h-[500px]';
              pageWrapper.setAttribute('data-page-number', i);
              pageWrapper.innerHTML = `<p class="text-gray-400">Loading page ${i}...</p>`;
              container.appendChild(pageWrapper);
            }
            setIsLayoutReady(true);
          }
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'An unknown error occurred.');
        console.error('A critical error occurred while fetching chapter data:', err);
      });

    return () => { isMounted = false; };
  }, [bookId, chapterId]);


  // --- Effect 3: Progressively Load PDF and Attach Observers ---
  useEffect(() => {
    if (!isLayoutReady || !chapterData) return;

    let isMounted = true;
    const observers = [];
    let loadingTask = null;

    const loadAndObserve = async () => {
      try {
        loadingTask = pdfjsLib.getDocument({
            url: chapterData.pdfUrl,
            rangeChunkSize: 1048576, 
            // rangeChunkSize: 65536,
        });
        
        pdfDocPromiseRef.current = loadingTask.promise;

        const container = containerRef.current;
        if (!container) return;

        const pageElements = container.querySelectorAll('.page-anchor');
        pageElements.forEach(pageElement => {
          const observer = new IntersectionObserver(async (entries, obs) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
              obs.unobserve(entry.target);
              const pageNum = parseInt(entry.target.getAttribute('data-page-number'), 10);
              
              try {
                const pdf = await pdfDocPromiseRef.current;

                ///////////////////////////////////////////////////
                if (isMounted) {
  // Trigger pre-render of first page immediately
  const firstPage = await pdf.getPage(1);
  const tempCanvas = document.createElement('canvas');
  const context = tempCanvas.getContext('2d');
  const viewport = firstPage.getViewport({ scale: 0.5 });
  tempCanvas.height = viewport.height;
  tempCanvas.width = viewport.width;
  await firstPage.render({ canvasContext: context, viewport }).promise;
  // Don't attach to DOM – this just triggers caching/preload
}
//////////////////////////////////////////////////////////////



                const page = await pdf.getPage(pageNum);
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                const lowResViewport = page.getViewport({ scale: 0.5 });
                canvas.height = lowResViewport.height;
                canvas.width = lowResViewport.width;
                canvas.style.maxWidth = "800px";
                canvas.style.width = "100%";
                canvas.style.height = "auto";
                canvas.classList.add('shadow-lg', 'rounded-md', 'blur-sm');
                
                entry.target.innerHTML = ''; 
                entry.target.classList.remove('bg-gray-200', 'animate-pulse', 'min-h-[500px]');
                entry.target.appendChild(canvas);

                await page.render({ canvasContext: context, viewport: lowResViewport }).promise;

                if (isMounted) {
                    const highResViewport = page.getViewport({ scale: 1.5 });
                    canvas.height = highResViewport.height;
                    canvas.width = highResViewport.width;
                    await page.render({ canvasContext: context, viewport: highResViewport }).promise;
                    canvas.classList.remove('blur-sm');
                }

              } catch (renderError) {
                console.error(`Failed to render page ${pageNum}:`, renderError);
                entry.target.innerHTML = `<p class="text-red-500">Error rendering page ${pageNum}.</p>`;
              }
            }
          }, { rootMargin: '400px' });

          observer.observe(pageElement);
          observers.push(observer);
        });

      } catch (err) {
        if (isMounted) setError(err.message || 'An unknown error occurred during PDF setup.');
        console.error('A critical error occurred during PDF setup:', err);
      }
    };

    loadAndObserve();

    return () => {
      isMounted = false;
      if (loadingTask) loadingTask.destroy();
      observers.forEach(obs => obs.disconnect());
    };
  }, [isLayoutReady, chapterData]);


// =========================================================
  // ===== ADD THIS NEW useEffect HOOK to ChapterPreview.jsx =====
  // =========================================================
  // --- Effect 4: User Activity Logging ---
  useEffect(() => {
    // Only run this logic if the PDF layout is ready and the user is logged in
    if (!isLayoutReady || !user?.token) return;

    // A simple way to keep track of the page currently in view
    let lastViewedPage = 1;
    const pageElements = containerRef.current?.querySelectorAll('.page-anchor');
    const observers = [];

    // Set up an observer for each page to see which one is on screen
    pageElements?.forEach(pageElement => {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          lastViewedPage = parseInt(entries[0].target.getAttribute('data-page-number'), 10);
        }
      }, { threshold: 0.5 }); // Triggers when 50% of the page is visible

      observer.observe(pageElement);
      observers.push(observer);
    });

    // This interval will send an "activity ping" to the backend every 15 seconds
    const activityInterval = setInterval(() => {
      console.log(`Logging activity for page: ${lastViewedPage}`); // For debugging
      axios.post(
        `${BASE_URL}/api/auth/activity-log`,
        {
          bookId,
          chapterId,
          pageNum: lastViewedPage,
          duration: 15, // We log that the user was active for these 15 seconds
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      ).catch(err => {
        // We log errors silently so we don't interrupt the user
        console.error("Activity log ping failed:", err);
      });
    }, 15000); // 15000 milliseconds = 15 seconds

    // This is a crucial cleanup function. It stops the interval and observers
    // when the user navigates away from the page to prevent memory leaks.
    return () => {
      clearInterval(activityInterval);
      observers.forEach(obs => obs.disconnect());
    };

  }, [isLayoutReady, user, bookId, chapterId]); // Dependencies for this effect






  // --- Helper function to scroll to a specific page ---
  const scrollToPage = (pageNum) => {
    const target = containerRef.current?.querySelector(`[data-page-number="${pageNum}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 pt-16 select-none">
      
      {/* Dynamic Watermark Layer */}
      {user && (
        <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
          <p className="text-[10vw] font-bold text-gray-500 opacity-10 transform -rotate-12 whitespace-nowrap">
            {user.email || user.name}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-20 shadow-sm">
        <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
          <div>
            {chapterData ? (
              <>
               <h1 className="text-xl md:text-2xl font-bold text-gray-800 break-words max-w-full">
  {chapterData.name}
</h1>
<p className="text-xs md:text-sm text-gray-600 break-words max-w-full">
  {chapterData.description}
</p>

              </>
            ) : (
               <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
               </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Fixed Subchapter Dropdown */}
      {chapterData?.subchapters?.length > 0 && (
          <div className="fixed top-24 right-4 z-30">
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                className="bg-white border px-4 py-2 rounded-full shadow-lg text-sm hover:bg-gray-50 transition"
              >
                📑 Subchapters
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-xl max-h-80 overflow-y-auto w-64">
                  {chapterData.subchapters.map((sub, i) => (
                    <button 
                      key={i} 
                      onClick={() => scrollToPage(sub.fromPage)} 
                      className="block px-4 py-3 text-sm w-full text-left hover:bg-blue-50 transition"
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
      )}

      {/* ✅ --- Non-blocking Security Notification --- */}
      {securityNotification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg z-50">
            {securityNotification}
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full p-4 relative">
        {error && <div className="text-center text-red-500">Error: {error}</div>}
        
        {/* PDF Viewer with Blur Effect */}
        <div
          ref={containerRef}
          className={`flex flex-col items-center gap-4 transition-all duration-300 ${isBlurred ? 'blur-xl' : 'blur-none'}`}
        />

        {/* Transparent Security Overlay */}
        <div className="absolute inset-0 z-20"></div>
      </main>
    </div>
  );
}
