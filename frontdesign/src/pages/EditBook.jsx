import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Trash2, GripVertical, PlusCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function EditBook() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
    const updated = chapters.filter((_, i) => i !== index);
    setChapters(updated);
  };

  const handleAddChapter = () => {
    const newChapter = { name: '', description: '', price: '', order: chapters.length };
    setChapters([...chapters, newChapter]);
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
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      chapters.forEach(ch => {
        if (ch.file) {
          formData.append('chapterFiles', ch.file);
        }
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
    <div className="min-h-screen bg-[#f4f2ec] pt-20 pb-10 flex">
      
      {/* Left Panel: Book info */}
      <div className="w-full md:w-1/3 max-h-screen sticky top-20 bg-white shadow-md p-5 space-y-3 self-start">
        <h2 className="text-lg font-semibold text-[#2f3e52]">✏️ Edit Book</h2>
        {message && <p className="text-sm text-[#16355a]">{message}</p>}

        <div>
          <p className="text-sm mb-1 font-medium">Current Cover:</p>
          {book.coverUrl && (
            <img src={book.coverUrl} alt="cover" className="h-32 w-full object-cover rounded mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            className="w-full"
          />
        </div>

        <input
          className="w-full p-2 border rounded"
          placeholder="Book Name"
          name="name"
          value={book.name}
          onChange={handleBookChange}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Subject"
          name="subject"
          value={book.subject}
          onChange={handleBookChange}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Tags"
          name="tags"
          value={book.tags}
          onChange={handleBookChange}
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Contents / Description"
          name="contents"
          rows={3}
          value={book.contents}
          onChange={handleBookChange}
        />

        <button
          onClick={handleUpdate}
          className="w-full bg-[#4457ff] hover:bg-[#3b4ed3] text-white font-semibold py-2 rounded shadow"
        >
          Save Changes 💾
        </button>
      </div>

      {/* Right Panel: Chapters */}
      <div className="w-full md:w-2/3 overflow-y-auto max-h-screen px-4">
        <div className="flex justify-between items-center mt-2 mb-4">
          <h3 className="text-lg font-semibold text-[#2f3e52]">Chapters</h3>
          <button
            onClick={handleAddChapter}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <PlusCircle className="w-5 h-5" /> Add Chapter
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {chapters.map((ch, idx) => (
                  <Draggable key={ch._id || `new-${idx}`} draggableId={ch._id || `new-${idx}`} index={idx}>
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        className="bg-white p-5 rounded-lg shadow border border-gray-200 relative hover:shadow-lg transition"
                      >
                        <div {...provided.dragHandleProps} className="absolute left-2 top-2 cursor-grab">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        <button
                          onClick={() => handleDeleteChapter(idx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Chapter Name</label>
                            <input
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={ch.name}
                              placeholder="Enter chapter name"
                              onChange={(e) => handleChapterChange(idx, 'name', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Short Description</label>
                            <input
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={ch.description}
                              placeholder="Enter description"
                              onChange={(e) => handleChapterChange(idx, 'description', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Price (INR)</label>
                            <input
                              type="number"
                              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={ch.price}
                              placeholder="Price"
                              onChange={(e) => handleChapterChange(idx, 'price', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Chapter PDF (optional)</label>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleChapterChange(idx, 'file', e.target.files[0])}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
