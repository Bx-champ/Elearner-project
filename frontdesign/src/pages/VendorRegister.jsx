import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    instituteName: '',
    representativeName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSuccess('');
      return;
    }

    // TODO: Connect to backend API for registration
    try {
    await axios.post(`${BASE_URL}/api/auth/vendor/signup`, formData);
    setError('');
    setSuccess("Vendor registration submitted successfully!");
  } catch (err) {
  console.error("Full error:", err); // log full error for debugging
  if (err.response?.data?.message) {
    alert(err.response.data.message);
  } else {
    alert("Something went wrong. Please try again.");
  }
}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-[#16355a]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">Register as Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Fill out the form to create your vendor account</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="instituteName"
            placeholder="Institute Name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="representativeName"
            placeholder="Representative Name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            className="w-full bg-[#4457ff] hover:bg-[#3a4ed1] text-white py-2.5 rounded-lg font-semibold transition-all duration-200 shadow hover:shadow-md"
          >
            Register Vendor
          </button>
        </form>
      </div>
    </div>
  );
}
