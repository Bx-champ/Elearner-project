// 📁 src/pages/EditBook.jsx

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Trash2, GripVertical, PlusCircle, Plus, Trash } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../config';

export default function EditBook() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const rightPanelRef = useRef();

  useEffect(() => {
    axios.get(`${BASE_URL}/api/auth/book/${id}`)
      .then(res => {
        setBook({
          name: res.data.book.name,
          subject: res.data.book.subject,
          tags: res.data.book.tags,
          contents: res.data.book.contents,
          coverUrl: res.data.book.coverUrl,
        });
        setChapters(res.data.book.chapters.map(ch => ({
          ...ch,
          subchapters: ch.subchapters || []
        })));
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

  const handleSubChapterChange = (chapterIndex, subIndex, field, value) => {
    const updated = [...chapters];
    updated[chapterIndex].subchapters[subIndex][field] = value;
    setChapters(updated);
  };

  const addSubChapter = (chapterIndex) => {
    const updated = [...chapters];
    updated[chapterIndex].subchapters.push({ name: '', fromPage: '', toPage: '' });
    setChapters(updated);
  };

  const removeSubChapter = (chapterIndex, subIndex) => {
    const updated = [...chapters];
    updated[chapterIndex].subchapters.splice(subIndex, 1);
    setChapters(updated);
  };

  const handleDeleteChapter = (index) => {
    if (!window.confirm('Delete this chapter?')) return;
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleAddChapter = () => {
    const newChapter = {
      name: '', description: '', price: '', order: chapters.length,
      fromPage: '', toPage: '', subchapters: []
    };
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
          fromPage: ch.fromPage,
          toPage: ch.toPage,
          subchapters: ch.subchapters,
          uploadedFileName: ch.file ? ch.file.name : '',
        }))
      ));
      if (coverFile) formData.append('cover', coverFile);
      chapters.forEach(ch => {
        if (ch.file) formData.append('chapterFiles', ch.file);
      });

      await axios.put(`${BASE_URL}/api/auth/admin/book/${id}`, formData, {
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
    <div className="min-h-screen bg-[#f4f2ec] pt-20 pb-10 flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-1/3 max-h-screen md:sticky md:top-20 bg-white shadow-md p-5 space-y-3 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Cover</label>
          {book.coverUrl && (
            <motion.img src={book.coverUrl} alt="cover" className="w-full h-52 object-cover rounded mb-2" whileHover={{ scale: 1.05 }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Book Name</label>
          <input className="w-full p-2 border rounded" name="name" value={book.name} onChange={handleBookChange} />
        </div>

        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input className="w-full p-2 border rounded" name="subject" value={book.subject} onChange={handleBookChange} />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags</label>
          <input className="w-full p-2 border rounded" name="tags" value={book.tags} onChange={handleBookChange} />
        </div>

        <div>
          <label className="block text-sm font-medium">Contents / Description</label>
          <textarea className="w-full p-2 border rounded" name="contents" rows={3} value={book.contents} onChange={handleBookChange} />
        </div>

        <button onClick={handleUpdate} className="w-full bg-[#4457ff] hover:bg-[#3b4ed3] text-white font-semibold py-2 rounded shadow">
          Save Changes 💾
        </button>
      </div>

      {/* Right Panel */}
      <div ref={rightPanelRef} className="w-full md:w-2/3 px-4 overflow-y-auto max-h-screen">
        <div className="sticky top-0 z-10 bg-[#f4f2ec] py-3 flex justify-between items-center border-b border-gray-300">
          <h3 className="text-xl font-semibold text-[#2f3e52]">📘 Chapters</h3>
          <button onClick={handleAddChapter} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
            <PlusCircle size={18} /> Add Chapter
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-5">
                {chapters.map((ch, idx) => (
                  <Draggable key={ch._id || `new-${idx}`} draggableId={ch._id || `new-${idx}`} index={idx}>
                    {(provided) => (
                      <motion.div
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        className="bg-white rounded-lg shadow p-5 relative"
                      >
                        <div className="absolute top-2 left-2" {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <button onClick={() => handleDeleteChapter(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="text-sm font-medium">Chapter Name</label>
                            <input className="p-2 border rounded w-full" value={ch.name} onChange={(e) => handleChapterChange(idx, 'name', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <input className="p-2 border rounded w-full" value={ch.description} onChange={(e) => handleChapterChange(idx, 'description', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Price (INR)</label>
                            <input type="number" className="p-2 border rounded w-full" value={ch.price} onChange={(e) => handleChapterChange(idx, 'price', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">From Page</label>
                            <input type="number" className="p-2 border rounded w-full" value={ch.fromPage || ''} onChange={(e) => handleChapterChange(idx, 'fromPage', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm font-medium">To Page</label>
                            <input type="number" className="p-2 border rounded w-full" value={ch.toPage || ''} onChange={(e) => handleChapterChange(idx, 'toPage', e.target.value)} />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-sm font-medium">Current PDF</label><br />
                          {ch.pdfUrl ? (
                            <a href={ch.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">View PDF</a>
                          ) : (
                            <span className="text-xs text-gray-400">No PDF</span>
                          )}
                          <input type="file" accept="application/pdf" onChange={(e) => handleChapterChange(idx, 'file', e.target.files[0])} className="mt-1 text-xs" />
                        </div>

                        {/* Subchapters */}
                        <div className="mt-5">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-[#2f3e52]">📑 Subchapters</p>
                            <button onClick={() => addSubChapter(idx)} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                              <Plus size={16} /> Add
                            </button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {ch.subchapters.map((sub, subIdx) => (
                              <div key={subIdx} className="flex flex-col sm:flex-row gap-2">
                                <input className="w-full sm:w-1/3 p-2 border rounded text-sm" placeholder="Subchapter Name" value={sub.name} onChange={(e) => handleSubChapterChange(idx, subIdx, 'name', e.target.value)} />
                                <input type="number" className="w-full sm:w-1/4 p-2 border rounded text-sm" placeholder="From" value={sub.fromPage} onChange={(e) => handleSubChapterChange(idx, subIdx, 'fromPage', e.target.value)} />
                                <input type="number" className="w-full sm:w-1/4 p-2 border rounded text-sm" placeholder="To" value={sub.toPage} onChange={(e) => handleSubChapterChange(idx, subIdx, 'toPage', e.target.value)} />
                                <button onClick={() => removeSubChapter(idx, subIdx)} className="text-red-500 hover:text-red-700">
                                  <Trash size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Success/Error Message */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
              <p className={`text-lg font-semibold ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
              <button onClick={() => setMessage('')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
