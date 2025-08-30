// import React, { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import axios from 'axios';
// import { BASE_URL } from '../config';
// import { MailCheck, MailWarning, LoaderCircle } from 'lucide-react';

// export default function EmailVerification() {
//   const { token } = useParams();
//   const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
//   const [message, setMessage] = useState('Verifying your email, please wait...');

//   useEffect(() => {
//     if (token) {
//       axios.get(`${BASE_URL}/api/auth/verify-email/${token}`)
//         .then(res => {
//           setStatus('success');
//           setMessage(res.data.message);
//         })
//         .catch(err => {
//           setStatus('error');
//           setMessage(err.response?.data?.message || 'An error occurred. The link may be invalid or expired.');
//         });
//     } else {
//       setStatus('error');
//       setMessage('No verification token provided.');
//     }
//   }, [token]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
//         {status === 'verifying' && (
//           <>
//             <LoaderCircle className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
//             <h2 className="mt-4 text-2xl font-semibold text-gray-800">Verifying...</h2>
//           </>
//         )}
//         {status === 'success' && (
//           <>
//             <MailCheck className="mx-auto h-12 w-12 text-green-500" />
//             <h2 className="mt-4 text-2xl font-semibold text-gray-800">Success!</h2>
//           </>
//         )}
//         {status === 'error' && (
//           <>
//             <MailWarning className="mx-auto h-12 w-12 text-red-500" />
//             <h2 className="mt-4 text-2xl font-semibold text-gray-800">Verification Failed</h2>
//           </>
//         )}
//         <p className="mt-2 text-gray-600">{message}</p>
//         {status !== 'verifying' && (
//           <Link to="/signin" className="mt-6 inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
//             Go to Sign In
//           </Link>
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState, useRef } from 'react'; // 1. Import useRef
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config';
import { MailCheck, MailWarning, LoaderCircle } from 'lucide-react';

export default function EmailVerification() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('Verifying your email, please wait...');
  
  // 2. Create a ref to track if the effect has already run
  const effectRan = useRef(false);

  useEffect(() => {
    // 3. Only run the API call if the effect has not run before
    if (!effectRan.current) {
      if (token) {
        axios.get(`${BASE_URL}/api/auth/verify-email/${token}`)
          .then(res => {
            setStatus('success');
            setMessage(res.data.message);
          })
          .catch(err => {
            setStatus('error');
            setMessage(err.response?.data?.message || 'An error occurred. The link may be invalid or expired.');
          });
      } else {
        setStatus('error');
        setMessage('No verification token provided.');
      }
    }
    
    // 4. On cleanup, set the ref to true so the effect doesn't run again
    return () => {
      effectRan.current = true;
    };
  }, [token]); // Dependency array remains the same

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <LoaderCircle className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">Verifying...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <MailCheck className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">Success!</h2>
          </>
        )}
        {status === 'error' && (
          <>
            <MailWarning className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">Verification Failed</h2>
          </>
        )}
        <p className="mt-2 text-gray-600">{message}</p>
        {status !== 'verifying' && (
          <Link to="/signin" className="mt-6 inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
            Go to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}