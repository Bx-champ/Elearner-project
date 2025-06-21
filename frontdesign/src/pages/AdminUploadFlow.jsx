import React, { useState } from 'react';
import AdminUpload from './AdminUpload';
import ChapterUploader from './ChapterUploader';
import AdminUploadFinalSubmit from './AdminUploadFinalSubmit';

export default function AdminUploadFlow() {
  const [phase, setPhase] = useState('book');
  const [bookData, setBookData] = useState(null);
  const [chapterData, setChapterData] = useState(null);

  return (
    <>
      {phase === 'book' && (
        <AdminUpload
          onNext={(data) => {
            setBookData(data);
            setPhase('chapters');
          }}
        />
      )}

      {phase === 'chapters' && (
        <ChapterUploader
          onDone={(data) => {
            setChapterData(data);
            setPhase('final');
          }}
        />
      )}

      {phase === 'final' && (
        <AdminUploadFinalSubmit
          bookData={bookData}
          chapterData={chapterData}
        />
      )}
    </>
  );
}
