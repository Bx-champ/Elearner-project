import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Trash2, GripVertical, PlusCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditBook() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const rightPanelRef = useRef();

  useEffect(() => {
    axios.get(`http://localhost:5000/api/auth/book/${id}`)
      .then(res => {
        setBook({
          name: res.data.book.name,
          subject: res.data.book.subject,
          tags: res.data.book.tags,
          contents: res.data.book.contents,
          coverUrl: res.data.book.coverUrl,
        });
        setChapters(res.data.book.chapters);
        setLoading(false);
      })
      .catch(() => alert('Failed to load book data'));
  }, [id]);

  const handleBookChange = (e) => {
    setBook({ ...book, [e.target.name]: e.target.value });
  };

  const handleChapterChange = (index, field, value) => {
    const updated = [...chapters];
    updated[index][field] = value;
    setChapters(updated);
  };

  const handleDeleteChapter = (index) => {
    if (!window.confirm('Delete this chapter?')) return;
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleAddChapter = () => {
    const newChapter = { name: '', description: '', price: '', order: chapters.length };
    setChapters([...chapters, newChapter]);
    setTimeout(() => {
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight;
      }
    }, 100);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(chapters);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setChapters(reordered);
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('name', book.name);
      formData.append('subject', book.subject);
      formData.append('tags', book.tags);
      formData.append('contents', book.contents);
      formData.append('chapters', JSON.stringify(
        chapters.map((ch, idx) => ({
          _id: ch._id,
          name: ch.name,
          description: ch.description,
          price: ch.price,
          order: idx,
          pdfUrl: ch.pdfUrl,
          uploadedFileName: ch.file ? ch.file.name : ''
        }))
      ));
      if (coverFile) formData.append('cover', coverFile);
      chapters.forEach(ch => {
        if (ch.file) formData.append('chapterFiles', ch.file);
      });

      await axios.put(`http://localhost:5000/api/auth/admin/book/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('✅ Book updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Update failed.');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f2ec] pt-20 pb-10 flex flex-col md:flex-row">

      {/* Left Panel */}
      <div className="w-full md:w-1/3 max-h-screen md:sticky md:top-20 bg-white shadow-md p-5 space-y-3 md:self-start overflow-y-auto">
        {/* <h2 className="text-lg font-semibold text-[#2f3e52]">✏️ Edit Book</h2> */}

        <div>
          <p className="text-sm mb-1 font-medium">Current Cover:</p>
          {book.coverUrl && (
            <div className="overflow-hidden rounded mb-2">
              <motion.img
                src={book.coverUrl}
                alt="cover"
                className="h-62 w-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            className="w-full"
          />
        </div>

        <input className="w-full p-2 border rounded" placeholder="Book Name" name="name" value={book.name} onChange={handleBookChange} />
        <input className="w-full p-2 border rounded" placeholder="Subject" name="subject" value={book.subject} onChange={handleBookChange} />
        <input className="w-full p-2 border rounded" placeholder="Tags" name="tags" value={book.tags} onChange={handleBookChange} />
        <textarea className="w-full p-2 border rounded" placeholder="Contents / Description" name="contents" rows={3} value={book.contents} onChange={handleBookChange} />

        <button
          onClick={handleUpdate}
          className="w-full bg-[#4457ff] hover:bg-[#3b4ed3] text-white font-semibold py-2 rounded shadow"
        >
          Save Changes 💾
        </button>
      </div>

      {/* Right Panel */}
      <div ref={rightPanelRef} className="w-full md:w-2/3 overflow-y-auto max-h-screen px-2 sm:px-4">
        <div className="sticky top-0 z-10 bg-[#f4f2ec] py-2 flex flex-col sm:flex-row justify-between items-center border-b border-gray-300 mb-2 gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#2f3e52]">Chapters</h3>
          <button
            onClick={handleAddChapter}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded shadow text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Add Chapter
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                <AnimatePresence>
                  {chapters.map((ch, idx) => (
                    <Draggable key={ch._id || `new-${idx}`} draggableId={ch._id || `new-${idx}`} index={idx}>
                      {(provided) => (
                        <motion.div
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-white p-6 pt-8 rounded-lg shadow border border-gray-200 relative hover:shadow-lg transition flex flex-col sm:flex-row gap-4"
                        >
                          <div className="absolute top-2 left-2 flex items-center space-x-2">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>

                          <div className="absolute top-2 right-2 flex items-center">
                            <button
                              onClick={() => handleDeleteChapter(idx)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="w-full sm:w-2/3 space-y-2">
                            <input
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                              value={ch.name}
                              placeholder="Chapter Name"
                              onChange={(e) => handleChapterChange(idx, 'name', e.target.value)}
                            />
                            <input
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                              value={ch.description}
                              placeholder="Description"
                              onChange={(e) => handleChapterChange(idx, 'description', e.target.value)}
                            />
                            <input
                              type="number"
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                              value={ch.price}
                              placeholder="Price (INR)"
                              onChange={(e) => handleChapterChange(idx, 'price', e.target.value)}
                            />
                          </div>

                          <div className="w-full sm:w-1/3 border border-dashed border-gray-300 rounded-lg p-2 bg-gray-50 flex flex-col justify-between">
                            <div className="text-xs text-gray-600 mb-1">Current PDF:</div>
                            {ch.pdfUrl ? (
                              <a href={ch.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline break-words">
                                View PDF
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs italic">No PDF</span>
                            )}
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleChapterChange(idx, 'file', e.target.files[0])}
                              className="text-xs mt-1"
                            />
                          </div>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Popup modal */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg shadow-lg p-6 max-w-sm w-full text-center"
            >
              <p className={`text-lg font-semibold ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
              <button
                onClick={() => setMessage('')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
