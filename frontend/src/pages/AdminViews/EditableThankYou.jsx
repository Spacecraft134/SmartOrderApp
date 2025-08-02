import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSave, FiEdit } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function EditableThankYou() {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState({
    title: "Thanks for dining with us!",
    subtitle: "We hope you enjoyed your meal and experience.",
    shareTitle: "Share your experience",
    googleReviewText: "Leave a Google Review",
    websiteButtonText: "Visit Our Website",
    returnText: "Want to dine with us again?",
  });

  // Static content that shouldn't be edited
  const staticContent = {
    rateAppText: "Rate Our App",
    socialMediaText: "Share on Social Media",
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get("/api/thank-you-content");
        setContent(response.data);
      } catch (error) {
        console.error("Error loading thank you content:", error);
      }
    };
    fetchContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.post("/api/thank-you-content", content);
      toast.success("Thank you page updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save changes");
      console.error("Error saving content:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 relative">
      {/* Admin edit controls */}
      {isEditing && (
        <div className="absolute top-4 right-4">
          <button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg"
          >
            <FiSave size={20} />
          </button>
        </div>
      )}
      {!isEditing && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
          >
            <FiEdit size={20} />
          </button>
        </div>
      )}

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

          {isEditing ? (
            <>
              <input
                type="text"
                name="title"
                value={content.title}
                onChange={handleChange}
                className="text-3xl font-bold text-gray-800 mb-2 w-full p-2 border rounded text-center"
              />
              <textarea
                name="subtitle"
                value={content.subtitle}
                onChange={handleChange}
                className="text-gray-600 w-full p-2 border rounded text-center"
                rows="2"
              />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {content.title}
              </h1>
              <p className="text-gray-600">{content.subtitle}</p>
            </>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {isEditing ? (
            <input
              type="text"
              name="shareTitle"
              value={content.shareTitle}
              onChange={handleChange}
              className="text-xl font-semibold text-gray-800 w-full p-2 border rounded text-center"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-800">
              {content.shareTitle}
            </h2>
          )}

          {/* Editable Google Review Button */}
          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg font-medium transition"
          >
            {isEditing ? (
              <input
                type="text"
                name="googleReviewText"
                value={content.googleReviewText}
                onChange={handleChange}
                className="w-full bg-transparent text-center border-none focus:ring-0"
              />
            ) : (
              content.googleReviewText
            )}
          </a>

          {/* Static Rate Our App Button */}
          <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg font-medium transition">
            {staticContent.rateAppText}
          </button>

          {/* Static Social Media Button */}
          <button className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-lg font-medium transition">
            {staticContent.socialMediaText}
          </button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          {isEditing ? (
            <textarea
              name="returnText"
              value={content.returnText}
              onChange={handleChange}
              className="text-gray-600 mb-4 w-full p-2 border rounded text-center"
              rows="2"
            />
          ) : (
            <p className="text-gray-600 mb-4">{content.returnText}</p>
          )}

          {/* Editable Website Button */}
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition"
          >
            {isEditing ? (
              <input
                type="text"
                name="websiteButtonText"
                value={content.websiteButtonText}
                onChange={handleChange}
                className="w-full bg-transparent text-center text-white placeholder-white border-none focus:ring-0"
              />
            ) : (
              content.websiteButtonText
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
