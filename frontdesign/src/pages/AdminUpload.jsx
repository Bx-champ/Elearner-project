// import React, { useState } from 'react';
// import axios from 'axios';
// import { CloudUpload, FileText } from 'lucide-react';

// export default function AdminUpload() {
//   const [formData, setFormData] = useState({
//     name: '',
//     price: '',
//     contents: '',
//     subject: '',
//     tags: '',
//   });
//   const [coverPage, setCoverPage] = useState(null);
//   const [pdf, setPdf] = useState(null);
//   const [message, setMessage] = useState('');

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleUpload = async (e) => {
//     e.preventDefault();
//     if (!coverPage || !pdf) return setMessage('Please upload both Cover Page and PDF');

//     const data = new FormData();
//     data.append('cover', coverPage);
//     data.append('pdf', pdf);
//     Object.entries(formData).forEach(([key, value]) => data.append(key, value));

//     try {
//       const res = await axios.post('http://localhost:5000/api/admin/upload', data);
//       setMessage(res.data.message);
//       setFormData({ name: '', price: '', contents: '', subject: '', tags: '' });
//       setCoverPage(null);
//       setPdf(null);
//     } catch (err) {
//       setMessage(err.response?.data?.message || 'Upload failed');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#f4f2ec] pt-20 px-4 md:px-12 pb-10 flex flex-col md:flex-row gap-10">
//       {/* Left Form */}
//       <div className="w-full md:w-1/2 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
//         <h2 className="text-3xl font-bold text-[#16355a] mb-6">📘 Upload Book Details</h2>

//         <form className="space-y-4" onSubmit={handleUpload}>
//           <Input label="Book Name" name="name" value={formData.name} onChange={handleChange} />
//           <Input label="Price (INR)" name="price" value={formData.price} onChange={handleChange} type="number" />
//           <Textarea label="Contents" name="contents" value={formData.contents} onChange={handleChange} />
//           <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} />
//           <Input label="Tags / Category" name="tags" value={formData.tags} onChange={handleChange} />

//           <button
//             type="submit"
//             className="bg-[#4457ff] hover:bg-[#3b4ed3] text-white py-2 px-6 rounded-lg mt-4 transition w-full font-semibold shadow-md"
//           >
//             Upload Book 📤
//           </button>
//           {message && <p className="mt-3 text-center text-green-600">{message}</p>}
//         </form>
//       </div>

//       {/* Right Upload Section */}
//       <div className="w-full md:w-1/2 flex flex-col gap-8">
//         <UploadBox
//           title="Cover Page"
//           file={coverPage}
//           onChange={(file) => setCoverPage(file)}
//           accept="image/*"
//           icon={<CloudUpload className="w-8 h-8 text-blue-500" />}
//         />

//         <UploadBox
//           title="PDF Material"
//           file={pdf}
//           onChange={(file) => setPdf(file)}
//           accept="application/pdf"
//           icon={<FileText className="w-8 h-8 text-red-500" />}
//         />
//       </div>
//     </div>
//   );
// }

// // Reusable Input
// const Input = ({ label, name, value, onChange, type = 'text' }) => (
//   <div>
//     <label className="block mb-1 font-medium text-[#2f3e52]">{label}</label>
//     <input
//       type={type}
//       name={name}
//       value={value}
//       onChange={onChange}
//       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4457ff] outline-none shadow-sm"
//       placeholder={`Enter ${label.toLowerCase()}`}
//     />
//   </div>
// );

// // Reusable Textarea
// const Textarea = ({ label, name, value, onChange }) => (
//   <div>
//     <label className="block mb-1 font-medium text-[#2f3e52]">{label}</label>
//     <textarea
//       name={name}
//       value={value}
//       onChange={onChange}
//       rows={3}
//       placeholder={`Enter ${label.toLowerCase()}`}
//       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4457ff] outline-none shadow-sm"
//     />
//   </div>
// );

// // Upload Box
// const UploadBox = ({ title, file, onChange, accept, icon }) => {
//   return (
//     <div className="relative w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-white hover:shadow-xl transition duration-300 cursor-pointer text-center">
//       <label className="block">
//         <div className="flex flex-col items-center justify-center space-y-2">
//           {icon}
//           <span className="text-gray-600 font-medium">{`Upload ${title}`}</span>
//           <span className="text-xs text-gray-400">(Click or drag & drop)</span>
//         </div>
//         <input
//           type="file"
//           accept={accept}
//           className="absolute inset-0 opacity-0 cursor-pointer"
//           onChange={(e) => onChange(e.target.files[0])}
//         />
//       </label>

//       {file && (
//         <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-2 rounded shadow-inner">
//           {file.type.startsWith('image') ? (
//             <img src={URL.createObjectURL(file)} alt="preview" className="max-h-48 mx-auto rounded" />
//           ) : (
//             <span className="font-semibold">{file.name}</span>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };





import React, { useState } from 'react';
import { CloudUpload } from 'lucide-react';

export default function AdminUpload({ onNext }) {
  const [formData, setFormData] = useState({
    name: '',
    contents: '',
    subject: '',
    tags: '',
  });
  const [coverPage, setCoverPage] = useState(null);
  const [bookPdf, setBookPdf] = useState(null);


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

 const handleNext = (e) => {
  e.preventDefault();
  
  if (!coverPage) return alert("Please upload the cover page");
  if (!bookPdf) return alert("Please upload the complete book PDF");
  if (!formData.name || !formData.contents || !formData.subject) {
    return alert("Please fill all required fields");
  }

  // Pass data to the next phase (Chapter Metadata Phase)
  onNext({
    ...formData,
    coverPage,
    bookPdf
  }, bookPdf); // second arg passed separately too for flexibility
};


  return (
    <div className="min-h-screen bg-[#f4f2ec] pt-20 px-4 md:px-12 pb-10">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-[#16355a] mb-6">📘 Book Info & Cover</h2>

        <form className="space-y-4" onSubmit={handleNext}>
          <Input label="Book Name" name="name" value={formData.name} onChange={handleChange} />
          <Textarea label="Description / Contents" name="contents" value={formData.contents} onChange={handleChange} />
          <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} />
          <Input label="Tags / Category" name="tags" value={formData.tags} onChange={handleChange} />

          <UploadBox
   title="Cover Page"
   file={coverPage}
   onChange={setCoverPage}
   accept="image/*"
/>

<UploadBox
   title="Complete Book PDF"
   file={bookPdf}
   onChange={setBookPdf}
   accept="application/pdf"
/>



          <button
            type="submit"
            className="bg-[#4457ff] hover:bg-[#3b4ed3] text-white py-2 px-6 rounded-lg mt-4 transition w-full font-semibold shadow-md"
          >
            Next: Add Chapters 📄
          </button>
        </form>
      </div>
    </div>
  );
}

const Input = ({ label, name, value, onChange, type = 'text' }) => (
  <div>
    <label className="block mb-1 font-medium text-[#2f3e52]">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4457ff] outline-none shadow-sm"
      placeholder={`Enter ${label.toLowerCase()}`}
    />
  </div>
);

const Textarea = ({ label, name, value, onChange }) => (
  <div>
    <label className="block mb-1 font-medium text-[#2f3e52]">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={3}
      placeholder={`Enter ${label.toLowerCase()}`}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4457ff] outline-none shadow-sm"
    />
  </div>
);

const UploadBox = ({ title, file, onChange, accept }) => (
  <div className="relative w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-white hover:shadow-xl transition duration-300 cursor-pointer text-center">
    <label className="block">
      <div className="flex flex-col items-center justify-center space-y-2">
        <CloudUpload className="w-8 h-8 text-blue-500" />
        <span className="text-gray-600 font-medium">{`Upload ${title}`}</span>
        <span className="text-xs text-gray-400">(Click or drag & drop)</span>
      </div>
      <input
        type="file"
        accept={accept}
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => onChange(e.target.files[0])}
      />
    </label>

    {file && (
      <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-2 rounded shadow-inner">
        <img src={URL.createObjectURL(file)} alt="preview" className="max-h-48 mx-auto rounded" />
      </div>
    )}
  </div>
);
