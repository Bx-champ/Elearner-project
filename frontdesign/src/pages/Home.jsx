import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center px-6 md:px-16 bg-[#f4f2ec] text-[#16355a] overflow-hidden">
      {/* Left Section */}
      <div className="w-full md:basis-1/2 space-y-6">
        <div className="text-4xl md:text-6xl font-extrabold leading-tight">
          E-Learning
        </div>
        <p className="text-base md:text-lg text-gray-600 ">
          Empower your education with interactive online content. Learn anytime, anywhere with the best curated study material.
        </p>
        <Link
          to="/signin"
          className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-6 rounded shadow transition"
        >
          Sign In
        </Link>
      </div>

      {/* Right Section - hidden on mobile */}
      <div className="hidden md:flex basis-1/2 justify-center">
        <img
          src="https://cdn.pixabay.com/photo/2017/08/09/00/32/online-2617060_960_720.png"
          alt="E-learning"
          className="w-[80%] max-w-[500px]"
        />
      </div>
    </div>
  );
}
