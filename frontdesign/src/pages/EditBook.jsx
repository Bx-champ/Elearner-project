import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function EditBook() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(chapters);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setChapters(reordered);
  };

  const handleUpdate = async () => {
    try {
      const data = {
        ...book,
        chapters: chapters.map((ch, idx) => ({ ...ch, order: idx })),
      };
      await axios.put(`http://localhost:5000/api/auth/admin/book/${id}`, data);

      setMessage('✅ Book updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Update failed.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-6 md:px-12 pb-10">
      <h2 className="text-3xl font-bold text-[#16355a] mb-6">✏️ Edit Book</h2>

      {message && <p className="mb-4 text-center font-medium text-[#16355a]">{message}</p>}

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Book Name"
          name="name"
          value={book.name}
          onChange={handleBookChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Subject"
          name="subject"
          value={book.subject}
          onChange={handleBookChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Tags"
          name="tags"
          value={book.tags}
          onChange={handleBookChange}
        />
        <textarea
          className="w-full mb-2 p-2 border rounded"
          placeholder="Contents / Description"
          name="contents"
          rows={3}
          value={book.contents}
          onChange={handleBookChange}
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chapters">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {chapters.map((ch, idx) => (
                <Draggable key={ch._id || idx} draggableId={ch._id || `${idx}`} index={idx}>
                  {(provided) => (
                    <div
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                      className="bg-white p-4 rounded shadow relative border"
                    >
                      <div {...provided.dragHandleProps} className="absolute left-2 top-2 cursor-move">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        className="w-full mb-1 p-2 border rounded"
                        placeholder="Chapter Name"
                        value={ch.name}
                        onChange={(e) => handleChapterChange(idx, 'name', e.target.value)}
                      />
                      <input
                        className="w-full mb-1 p-2 border rounded"
                        placeholder="Short Description"
                        value={ch.description}
                        onChange={(e) => handleChapterChange(idx, 'description', e.target.value)}
                      />
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="Price (INR)"
                        type="number"
                        value={ch.price}
                        onChange={(e) => handleChapterChange(idx, 'price', e.target.value)}
                      />
                      <button
                        onClick={() => handleDeleteChapter(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={handleUpdate}
        className="mt-6 w-full bg-[#4457ff] hover:bg-[#3b4ed3] text-white font-semibold py-2 rounded shadow"
      >
        Save Changes 💾
      </button>
    </div>
  );
}
