import { Link } from 'react-router-dom';
import { BASE_URL } from './config';
export default function SignInModal({ onClose }) {
  return (
    <>
      {/* Background Blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="bg-white rounded-xl shadow-2xl p-8 w-[90%] max-w-md text-[#16355a] relative"
          onClick={(e) => e.stopPropagation()} // prevent backdrop click
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>

          <h2 className="text-3xl font-bold mb-6 text-center">Sign In</h2>

          <form className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4457ff]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4457ff] hover:bg-[#3a4ed1] text-white py-2 rounded-lg font-semibold transition"
            >
              Sign In
            </button>
          </form>

          <p className="text-sm mt-4 text-center">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-[#4457ff] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
