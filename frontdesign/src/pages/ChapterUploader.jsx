import React, { useState } from 'react';
import { FileText, GripVertical, CheckCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

export default function ChapterUploader({ onDone }) {
  const [chapters, setChapters] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const handleFiles = (files) => {
    const newChapters = Array.from(files).map((file) => ({
      id: uuidv4(),
      file,
      name: file.name.replace(/\.pdf$/i, ''),
      description: '',
      price: '',
    }));
    const updated = [...chapters, ...newChapters];
    setChapters(updated);
    updateTotalPrice(updated);
  };

  const handleChange = (id, field, value) => {
    const updated = chapters.map(ch =>
      ch.id === id ? { ...ch, [field]: value } : ch
    );
    setChapters(updated);
    if (field === 'price') updateTotalPrice(updated);
  };

  const updateTotalPrice = (chList) => {
    const price = chList.reduce((sum, ch) => sum + (parseFloat(ch.price) || 0), 0);
    setTotalPrice(price);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChapters(items);

    console.log('🟢 New chapter order:', items.map((ch, i) => `${i + 1}: ${ch.name}`));
  };

  const handleComplete = () => {
    if (chapters.length === 0) return alert("Please add at least one chapter");
    for (let ch of chapters) {
      if (!ch.name || !ch.price) {
        return alert("All chapters must have name and price");
      }
    }
    onDone({ chapters, totalPrice });
  };

  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-4 md:px-12 pb-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-[#16355a] mb-4">📄 Upload Chapters</h2>

        <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg mb-6 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition">
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            id="chapter-upload"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label htmlFor="chapter-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-red-500" />
            <span className="text-gray-600 font-medium">Click or drag to upload chapter PDFs</span>
          </label>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4 max-h-[600px] overflow-auto"
              >
                {chapters.map((ch, index) => (
                  <Draggable key={ch.id} draggableId={ch.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="p-4 bg-white border rounded-lg shadow-sm relative"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-3 left-3 cursor-move"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="font-semibold mb-2 pl-6">{index + 1}. {ch.file.name}</p>
                        <input
                          type="text"
                          placeholder="Chapter Name"
                          value={ch.name}
                          onChange={(e) => handleChange(ch.id, 'name', e.target.value)}
                          className="w-full mb-2 px-3 py-1 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Short Description"
                          value={ch.description}
                          onChange={(e) => handleChange(ch.id, 'description', e.target.value)}
                          className="w-full mb-2 px-3 py-1 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Price (INR)"
                          value={ch.price}
                          onChange={(e) => handleChange(ch.id, 'price', e.target.value)}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-6 text-lg font-semibold text-[#16355a]">Total Price: ₹{totalPrice}</div>

        <button
          onClick={handleComplete}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg shadow transition w-full font-semibold flex justify-center items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" /> Complete & Return
        </button>
      </div>
    </div>
  );
}
