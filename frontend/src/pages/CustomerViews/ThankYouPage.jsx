import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export function ThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-8">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanks for dining with us!
          </h1>
          <p className="text-gray-600">
            We hope you enjoyed your meal and experience.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            Share your experience
          </h2>

          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg font-medium transition"
          >
            Leave a Google Review
          </a>

          <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg font-medium transition">
            Rate Our App
          </button>

          <button className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-lg font-medium transition">
            Share on Social Media
          </button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Want to dine with us again?</p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition"
          >
            Visit Our Website
          </Link>
        </div>
      </div>
    </div>
  );
}
