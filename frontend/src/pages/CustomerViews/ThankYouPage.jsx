import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

export function ThankYou() {
  const { tableNumber, restaurantId } = useParams();
  const [thankYouData, setThankYouData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThankYouPage = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/thank-you/restaurant/${restaurantId}`
        );
        setThankYouData(res.data);
      } catch (error) {
        console.error("Error fetching thank you page:", error);
        // Fallback to default data
        setThankYouData({
          title: "Thanks for dining with us!",
          subtitle: "We hope you enjoyed your meal and experience.",
          googleReviewLink: "https://www.google.com/maps",
          websiteLink: "/",
          backgroundColor: "from-gray-50 to-gray-100",
          textColor: "text-gray-800",
          buttonColor: "from-blue-600 to-indigo-700",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThankYouPage();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${thankYouData.backgroundColor} flex flex-col items-center justify-center p-6`}
    >
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
          <h1 className={`text-3xl font-bold ${thankYouData.textColor} mb-2`}>
            {thankYouData.title}
          </h1>
          <p className="text-gray-600">{thankYouData.subtitle}</p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className={`text-xl font-semibold ${thankYouData.textColor}`}>
            Share your experience
          </h2>

          <a
            href={thankYouData.googleReviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg font-medium transition"
          >
            Leave a Google Review
          </a>

          <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg font-medium transition">
            Rate Our App
          </button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Want to dine with us again?</p>
          <Link
            to={thankYouData.websiteLink}
            className={`inline-block bg-gradient-to-r ${thankYouData.buttonColor} text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition`}
          >
            Visit Our Website
          </Link>
        </div>
      </div>
    </div>
  );
}
