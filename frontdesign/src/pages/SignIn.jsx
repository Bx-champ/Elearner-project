// import { useState, useContext, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Mail, Lock } from 'lucide-react';
// import axios from 'axios';
// import { AuthContext } from '../authContext';
// import socket from '../socket';
// import { BASE_URL } from '../config';

// export default function SignIn() {
//   const { login } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [errors, setErrors] = useState({});

//   // 🔐 Prevent back to protected pages after logout
//   useEffect(() => {
//     localStorage.removeItem('user'); // forcefully clear session
//     localStorage.removeItem('role');

//     // Prevent back navigation
//     window.history.pushState(null, '', window.location.href);
//     window.onpopstate = () => {
//       window.history.go(1); // disallow going back to previous session
//     };

//     return () => {
//       window.onpopstate = null; // clean up after login
//     };
//   }, []);

//   const validate = () => {
//     const newErrors = {};
//     if (!email) newErrors.email = 'Email is required';
//     else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
//     if (!password) newErrors.password = 'Password is required';
//     else if (password.length < 6) newErrors.password = 'Minimum 6 characters required';
//     return newErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const formErrors = validate();
//     setErrors(formErrors);
//     if (Object.keys(formErrors).length > 0) return;

//     try {
//       const res = await axios.post(`${BASE_URL}/api/auth/signin`, { email, password });
//       const { token, user, role } = res.data;

//       const userWithToken = { ...user, token };
//       localStorage.setItem('user', JSON.stringify(userWithToken));
//       localStorage.setItem('role', role);
//       login(userWithToken, role);
//       socket.emit('register', user._id);

//       // 🧹 Clear popstate blocker after successful login
//       window.onpopstate = null;

//       // 🧭 Redirect & replace history so back doesn't go to sign-in
//       if (role === 'admin') {
//         navigate('/admin/dashboard', { replace: true });
//       } else if (role === 'vendor') {
//         navigate('/vendor/dashboard', { replace: true });
//       } else {
//         navigate('/dashboard', { replace: true });
//       }

//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-4">
//       <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-[#16355a]">
//         <div className="text-center mb-6">
//           <h1 className="text-4xl font-extrabold text-[#16355a]">Welcome Back</h1>
//           <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
//         </div>

//         <form className="space-y-6" onSubmit={handleSubmit}>
//           <div className="relative">
//             <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
//             <input
//               type="email"
//               placeholder="you@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>}
//           </div>

//           <div className="relative">
//             <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.password && <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>}
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-[#4457ff] hover:bg-[#3a4ed1] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow hover:shadow-md"
//           >
//             Sign In
//           </button>
//         </form>

//         <p className="text-sm mt-6 text-center text-gray-600">
//           Don’t have an account?{' '}
//           <Link to="/signup" className="text-[#4457ff] font-semibold hover:underline">
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }



// import { useState, useContext, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Mail, Lock } from 'lucide-react';
// import axios from 'axios';
// import { AuthContext } from '../authContext';
// import socket from '../socket';
// import { BASE_URL } from '../config';

// export default function SignIn() {
//   const { login } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false); // To disable button on submit

//   // This effect is for clearing state on component mount, which is good practice.
//   useEffect(() => {
//     // Optional: Clear previous user data if you want a clean slate on the sign-in page
//     localStorage.removeItem('user');
//     localStorage.removeItem('role');
//   }, []);

//   const validate = () => {
//     const newErrors = {};
//     if (!email) newErrors.email = 'Email is required';
//     else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
//     if (!password) newErrors.password = 'Password is required';
//     return newErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true); // Disable button
//     const formErrors = validate();
//     if (Object.keys(formErrors).length > 0) {
//       setErrors(formErrors);
//       setLoading(false); // Re-enable button
//       return;
//     }
//     setErrors({}); // Clear previous errors

//     try {
//       const res = await axios.post(`${BASE_URL}/api/auth/signin`, { email, password });
      
//       // ===== THE FIX IS HERE =====
//       // The backend now sends the token INSIDE the user object.
//       // We just need to grab the user object and the role.
//       const { user, role } = res.data;

//       // The `login` function from your context will handle saving everything correctly.
//       login(user, role);
//       
//       // Connect to socket with user ID
//       socket.emit('register', user._id);

//       // Redirect based on role
//       if (role === 'admin') {
//         navigate('/admin/dashboard', { replace: true });
//       } else if (role === 'vendor') {
//         navigate('/vendor/dashboard', { replace: true });
//       } else {
//         navigate('/dashboard', { replace: true });
//       }

//     } catch (err) {
//       console.error("Login error:", err);
//       const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
//       setErrors({ api: errorMessage }); // Display server error to the user
//     } finally {
//       setLoading(false); // Re-enable button after request finishes
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-4">
//       <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-[#16355a]">
//         <div className="text-center mb-6">
//           <h1 className="text-4xl font-extrabold text-[#16355a]">Welcome Back</h1>
//           <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
//         </div>

//         <form className="space-y-6" onSubmit={handleSubmit}>
//           <div className="relative">
//             <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
//             <input
//               type="email"
//               placeholder="you@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>}
//           </div>

//           <div className="relative">
//             <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
//                 errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
//               }`}
//             />
//             {errors.password && <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>}
//           </div>
          
//           {/* Display API/server errors here */}
//           {errors.api && <p className="text-red-500 text-sm text-center">{errors.api}</p>}

//           <button
//             type="submit"
//             disabled={loading} // Disable button while loading
//             className="w-full bg-[#4457ff] hover:bg-[#3a4ed1] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Signing In...' : 'Sign In'}
//           </button>
//         </form>

//         <p className="text-sm mt-6 text-center text-gray-600">
//           Don’t have an account?{' '}
//           <Link to="/signup" className="text-[#4457ff] font-semibold hover:underline">
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }






import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // 1. Import useSearchParams
import { Mail, Lock } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../authContext';
import socket from '../socket';
import { BASE_URL } from '../config';

export default function SignIn() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // 2. Get URL query params

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(''); // 3. State for the success message
  const [loading, setLoading] = useState(false);

  // 4. useEffect to check for the 'verified' parameter in the URL
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
        setSuccessMessage('Email successfully verified! You can now log in.');
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setLoading(false);
      return;
    }
    setErrors({});

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signin`, { email, password });
      const { user, role } = res.data;

      login(user, role);
      socket.emit('register', user._id);

      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
        window.history.go(1);
      };

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setErrors({ api: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-[#16355a]">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-[#16355a]">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* 5. Conditionally render the success message */}
        {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4 text-center" role="alert">
                <span className="block sm:inline">{successMessage}</span>
            </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#4457ff]'
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>}
          </div>
          
          {errors.api && <p className="text-red-500 text-sm text-center">{errors.api}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4457ff] hover:bg-[#3a4ed1] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm mt-6 text-center text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-[#4457ff] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
