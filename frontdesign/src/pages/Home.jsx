import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, UserCheck, Rocket } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <BookOpen size={32} />,
      title: 'Vast Resources',
      desc: 'Access a wide variety of PDFs, notes, and educational material uploaded by verified vendors.',
    },
    {
      icon: <FileText size={32} />,
      title: 'Smart Chapter Selection',
      desc: 'Buy or view only the chapters you need — save money and time.',
    },
    {
      icon: <UserCheck size={32} />,
      title: 'Secure Access',
      desc: 'Chapter-level access control ensures protected viewing, anytime, anywhere.',
    },
    {
      icon: <Rocket size={32} />,
      title: 'Fast & Lightweight',
      desc: 'Built with performance in mind for smooth PDF streaming on any device.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f2ec]  text-[#16355a] pt-24 md:pt-32 px-6 md:px-16 font-sans">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20">
        {/* Text */}
        <div className="space-y-6 md:basis-1/2">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            
              Empower Learning
            <br /> With Digital Resources
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Discover, access, and study top-quality content uploaded by verified vendors. Built for flexible learners like you.
          </p>
          <div className="flex gap-4">
            <Link
              to="/signin"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/register/vendor"
              className="bg-[#4457ff] hover:bg-[#2f45d4] text-white font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300"
            >
              Become a Vendor
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="md:basis-1/2 flex justify-center">
          <img
            src="https://cdn.pixabay.com/photo/2017/08/09/00/32/online-2617060_960_720.png"
            alt="E-learning"
            className="w-full max-w-md rounded-xl shadow-md"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">🚀 Why Choose Us</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition duration-300 text-center"
            >
              <div className="mb-4 text-[#4457ff]">{item.icon}</div>
              <h3 className="font-bold text-xl mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">📚 How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { step: 1, title: 'Sign Up or Log In' },
            { step: 2, title: 'Browse Available Books' },
            { step: 3, title: 'Request or Purchase Chapters' },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg hover:scale-105 transition duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[#4457ff] text-white text-xl flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 border-t pt-6 pb-4">
        © {new Date().getFullYear()} E-Learn Platform. All rights reserved.
      </footer>
    </div>
  );
}
