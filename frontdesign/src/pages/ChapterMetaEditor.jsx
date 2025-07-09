import React, { useState } from 'react';
import { GripVertical, PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

export default function ChapterMetaEditor({ bookPdf, onDone }) {
  const [offset, setOffset] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    fromPage: '',
    toPage: '',
    price: ''
  });

  const handleAddChapter = () => {
    const { name, description, fromPage, toPage, price } = form;

    if (!name || !fromPage || !toPage || !price) return alert("All fields except description are required.");
    if (isNaN(fromPage) || isNaN(toPage) || isNaN(price)) return alert("Page numbers and price must be valid numbers.");
    if (Number(fromPage) > Number(toPage)) return alert("Start page must be less than or equal to end page.");

    const newChapter = {
      id: uuidv4(),
      name,
      description,
      fromPage: Number(fromPage) + offset,
      toPage: Number(toPage) + offset,
      price: Number(price),
      offset,
      actualFromPage: Number(fromPage) + offset,
      actualToPage: Number(toPage) + offset
    };

    setChapters([...chapters, newChapter]);
    setForm({ name: '', description: '', fromPage: '', toPage: '', price: '' });
  };

  const handleDelete = (id) => {
    setChapters(chapters.filter(ch => ch.id !== id));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(chapters);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setChapters(items);
  };

  const handleSubmit = () => {
    if (chapters.length === 0) return alert("Please add at least one chapter.");
    const totalPrice = chapters.reduce((sum, ch) => sum + Number(ch.price || 0), 0);
    onDone({ offset, chapters, price: totalPrice });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const totalPrice = chapters.reduce((sum, ch) => sum + Number(ch.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-4 md:px-12 pb-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-[#16355a] mb-6">📑 Define Chapters & Page Ranges</h2>

        {/* Offset Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Number Offset (e.g., 4 if actual chapters start after preface/index)
          </label>
          <input
            type="number"
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            placeholder="Enter offset"
            className="border px-3 py-2 rounded w-full max-w-sm"
          />
        </div>

        {/* Chapter Form Inputs */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Chapter Name"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Description (optional)"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="number"
            value={form.fromPage}
            onChange={(e) => handleChange('fromPage', e.target.value)}
            placeholder="Start Page (printed)"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="number"
            value={form.toPage}
            onChange={(e) => handleChange('toPage', e.target.value)}
            placeholder="End Page (printed)"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="Chapter Price (₹)"
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <button
          onClick={handleAddChapter}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg shadow font-semibold flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" /> Add Chapter
        </button>

        {/* Chapter List */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4 max-h-[400px] overflow-auto">
                {chapters.map((ch, index) => (
                  <Draggable key={ch.id} draggableId={ch.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="p-4 bg-white border rounded shadow-sm relative"
                      >
                        <div {...provided.dragHandleProps} className="absolute top-3 left-3 cursor-move">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="pl-6">
                          <p className="font-semibold">{index + 1}. {ch.name}</p>
                          <p className="text-sm text-gray-500">
                            Entered: {ch.fromPage - offset}–{ch.toPage - offset} | Actual: {ch.actualFromPage}–{ch.actualToPage} | ₹{ch.price}
                          </p>
                          {ch.description && <p className="text-xs text-gray-400">{ch.description}</p>}
                        </div>
                        <button onClick={() => handleDelete(ch.id)} className="absolute top-3 right-3 text-red-600">
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

        {/* Total Book Price */}
        <div className="text-right font-semibold text-lg text-green-700 mt-4">
          Total Book Price: ₹{totalPrice}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg shadow font-semibold flex items-center gap-2 w-full justify-center"
        >
          <CheckCircle className="w-5 h-5" /> Complete & Submit
        </button>
      </div>
    </div>
  );
}
