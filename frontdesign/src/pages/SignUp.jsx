// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios';
// import { BASE_URL } from '../config';

// export default function SignUp() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [errors, setErrors] = useState({});

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const newErrors = {};

//     if (!name.trim()) newErrors.name = 'Name is required';
//     if (!email.trim()) newErrors.email = 'Email is required';
//     if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
//     if (!password) newErrors.password = 'Password is required';
//     if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
//     if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length === 0) {
//       console.log({ name, email, password });
//       // Handle API call here
//         try {
//     await axios.post(`${BASE_URL}/api/auth/signup`, {name ,email, password });
//     alert('Registration successful');
//   } catch (err) {
//   const errorMessage = err.response?.data?.message || "Something went wrong. Please try again.";
//   alert(errorMessage);
// }

//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-[#16355a]">
//         <h2 className="text-3xl font-extrabold mb-6 text-center">Create an Account</h2>

//         <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
//           {/* Name */}
//           <div>
//             <label className="block mb-1 font-medium">Name</label>
//             <input
//               type="text"
//               placeholder="John Doe"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block mb-1 font-medium">Email</label>
//             <input
//               type="email"
//               autoComplete="off"
//               placeholder="you@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
//           </div>

//           {/* Password */}
//           <div>
//             <label className="block mb-1 font-medium">Password</label>
//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label className="block mb-1 font-medium">Confirm Password</label>
//             <input
//               type="password"
//               placeholder="Re-enter your password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.confirmPassword && (
//               <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full bg-[#4457ff] hover:bg-[#3b4ed3] text-white py-2 rounded-lg font-semibold transition"
//           >
//             Sign Up
//           </button>
//         </form>

//         <p className="text-sm mt-4 text-center">
//           Already have an account?{' '}
//           <Link to="/signin" className="text-[#4457ff] font-semibold hover:underline">
//             Sign In
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }




// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios';
// import { BASE_URL } from '../config';

// export default function SignUp() {
//   const [formData, setFormData] = useState({ name: '', email: '', password: '' });
//   const [error, setError] = useState('');
//   // New state to handle the success message
//   const [isSubmitted, setIsSubmitted] = useState(false); 

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       await axios.post(`${BASE_URL}/api/auth/signup`, formData);
//       // Set submitted to true on success
//       setIsSubmitted(true); 
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed');
//     }
//   };
  
//   // If submitted, show the verification message instead of the form
//   if (isSubmitted) {
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50">
//             <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
//                 <h2 className="text-2xl font-semibold text-green-600">Registration Successful!</h2>
//                 <p className="mt-4 text-gray-700">
//                     We've sent a verification link to <strong>{formData.email}</strong>. Please check your inbox (and spam folder) to complete your registration.
//                 </p>
//             </div>
//         </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Name</label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Password</label>
//             <input
//               type="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//           <button
//             type="submit"
//             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Sign Up
//           </button>
//         </form>
//         <p className="mt-4 text-center text-sm text-gray-600">
//           Already have an account?{' '}
//           <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
//             Sign In
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config';
import { User, Mail, Lock, Eye, EyeOff, PartyPopper } from 'lucide-react';

export default function SignUp() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/signup`, formData);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // A more visually appealing success message screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center animate-fade-in">
          <PartyPopper className="mx-auto h-16 w-16 text-green-500" strokeWidth={1.5} />
          <h2 className="mt-6 text-2xl font-bold text-gray-800">Registration Successful!</h2>
          <p className="mt-4 text-gray-600">
            We've sent a verification link to <strong className="text-gray-900">{formData.email}</strong>. Please check your inbox to complete your registration.
          </p>
          <Link to="/signin" className="mt-8 inline-block bg-blue-600 text-white font-semibold py-2 px-8 rounded-lg hover:bg-blue-700 transition-colors">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Create Your Account</h2>
          <p className="mt-2 text-gray-500">Get started with our service today!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}