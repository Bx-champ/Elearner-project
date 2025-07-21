// src/axiosInstance.js
import axios from 'axios';
import { AuthContext } from './authContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from './config';

export const useAxios = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
  });

  // Add token to every request
  axiosInstance.interceptors.request.use((config) => {
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  });

  // Handle 401: Invalid token or logged in elsewhere
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn('🔐 Token expired or invalid. Logging out...');
        logout();
        navigate('/signin');
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
