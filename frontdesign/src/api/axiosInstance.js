// import axios from 'axios';
// import { BASE_URL } from '../config';

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
// });

// // This is the interceptor. It runs before every response is handled.
// axiosInstance.interceptors.response.use(
//   // If the response is successful, just return it.
//   (response) => response,
//   // If there's an error...
//   (error) => {
//     // Check if the error is a 401 Unauthorized response
//     if (error.response && error.response.status === 401) {
//       // Clear the user's token from storage
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
      
//       // Redirect to the sign-in page
//       // This ensures the user never gets stuck on a broken page
//       window.location.href = '/signin';
//     }
//     // For all other errors, just pass them along.
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
