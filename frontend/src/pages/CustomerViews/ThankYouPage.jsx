// ThankYou.js
import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import api from "../Utils/api";

export function ThankYou() {
  const { user } = useAuth();
  const { tableNumber, restaurantId: paramRestaurantId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryRestaurantId = searchParams.get("restaurantId");
  const restaurantId =
    paramRestaurantId || queryRestaurantId || user?.restaurantId;

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    googleReviewLink: "",
    websiteLink: "",
    backgroundColor: "from-gray-50 to-gray-100",
    textColor: "text-gray-800",
    buttonColor: "from-blue-600 to-indigo-700",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const defaultData = {
    title: "Thanks for dining with us!",
    subtitle: "We hope you enjoyed your meal and experience.",
    googleReviewLink: "https://www.google.com/maps",
    websiteLink: "/",
    backgroundColor: "from-gray-50 to-gray-100",
    textColor: "text-gray-800",
    buttonColor: "from-blue-600 to-indigo-700",
  };

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    const fetchThankYouPage = async () => {
      if (!restaurantId) {
        if (isAdmin) {
          setFormData(defaultData);
        }
        setLoading(false);
        return;
      }

      try {
        let response;

        if (isAdmin) {
          response = await api.get(
            `/api/thank-you-content/restaurant/${restaurantId}`
          );
        } else {
          const timestamp = Date.now();
          response = await axios.get(
            `http://localhost:8080/api/thank-you-content/restaurant/${restaurantId}?t=${timestamp}`,
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
          );
        }

        if (response.data) {
          const data = response.data;
          setFormData({
            id: data.id || undefined,
            title: data.title || defaultData.title,
            subtitle: data.subtitle || defaultData.subtitle,
            googleReviewLink:
              data.googleReviewLink || defaultData.googleReviewLink,
            websiteLink: data.websiteLink || defaultData.websiteLink,
            backgroundColor:
              data.backgroundColor || defaultData.backgroundColor,
            textColor: data.textColor || defaultData.textColor,
            buttonColor: data.buttonColor || defaultData.buttonColor,
          });
        } else if (isAdmin) {
          setFormData(defaultData);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching thank you page:", error);

        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          setError("Authentication failed");
        } else if (error.response?.status === 404) {
          if (isAdmin) {
            setFormData(defaultData);
          }
          setError(null);
        } else {
          console.error("Server error:", error.response?.data);
          setError(`Failed to load: ${error.message}`);
          if (isAdmin) {
            toast.error(`Failed to load thank you page: ${error.message}`);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchThankYouPage();
  }, [restaurantId, user?.role, location.key]);

  useEffect(() => {
    // Check if all required fields are filled
    const isValid =
      formData.title.trim() !== "" &&
      formData.subtitle.trim() !== "" &&
      formData.googleReviewLink.trim() !== "" &&
      formData.websiteLink.trim() !== "";

    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission initiated"); // Debug log

    if (!user?.restaurantId) {
      console.error("No restaurantId available in user context"); // Debug log
      toast.error("Restaurant ID not available");
      return;
    }

    const dataToSend = {
      ...(formData.id && { id: formData.id }),
      title: formData.title,
      subtitle: formData.subtitle,
      googleReviewLink: formData.googleReviewLink,
      websiteLink: formData.websiteLink,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      buttonColor: formData.buttonColor,
      restaurant: { id: user.restaurantId },
    };

    console.log("Data being sent:", JSON.stringify(dataToSend, null, 2)); // Debug log

    try {
      let response;
      if (formData.id) {
        console.log("Making PUT request to update existing content"); // Debug log
        response = await api.put(
          `/api/thank-you-content/${formData.id}`,
          dataToSend
        );
      } else {
        console.log("Making POST request to create new content"); // Debug log
        response = await api.post("/api/thank-you-content", dataToSend);
      }

      console.log("API Response:", response); // Debug log

      if (response.data && response.data.id) {
        console.log("Received ID from server:", response.data.id); // Debug log
        setFormData((prev) => ({ ...prev, id: response.data.id }));
      }

      toast.success("Thank You page saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data); // Debug log
        console.error("Error status:", error.response.status); // Debug log
        console.error("Error headers:", error.response.headers); // Debug log
      }

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else {
        const errorMsg =
          error.response?.data?.message || error.message || "Unknown error";
        toast.error(`Error saving Thank You page: ${errorMsg}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <ThankYouContentView data={defaultData} tableNumber={tableNumber} />
          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded text-sm">
              Note: Custom thank you page failed to load ({error})
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayData = formData || defaultData;

  if (isAdmin && isEditing) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Customize Thank You Page</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Thanks for dining with us!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle *
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="We hope you enjoyed your meal and experience."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Review Link *
              </label>
              <input
                type="url"
                name="googleReviewLink"
                value={formData.googleReviewLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.google.com/maps/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website Link *
              </label>
              <input
                type="url"
                name="websiteLink"
                value={formData.websiteLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://your-restaurant.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Gradient
              </label>
              <select
                name="backgroundColor"
                value={formData.backgroundColor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="from-gray-50 to-gray-100">Default (Gray)</option>
                <option value="from-blue-50 to-blue-100">Blue</option>
                <option value="from-green-50 to-green-100">Green</option>
                <option value="from-red-50 to-red-100">Red</option>
                <option value="from-yellow-50 to-yellow-100">Yellow</option>
                <option value="from-purple-50 to-purple-100">Purple</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <select
                name="textColor"
                value={formData.textColor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text-gray-800">Dark Gray</option>
                <option value="text-blue-800">Dark Blue</option>
                <option value="text-green-800">Dark Green</option>
                <option value="text-red-800">Dark Red</option>
                <option value="text-purple-800">Dark Purple</option>
                <option value="text-black">Black</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Gradient
              </label>
              <select
                name="buttonColor"
                value={formData.buttonColor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="from-blue-600 to-indigo-700">Blue-Indigo</option>
                <option value="from-green-600 to-teal-700">Green-Teal</option>
                <option value="from-red-600 to-pink-700">Red-Pink</option>
                <option value="from-yellow-600 to-amber-700">
                  Yellow-Amber
                </option>
                <option value="from-purple-600 to-violet-700">
                  Purple-Violet
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isFormValid
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid}
            >
              {formData.id ? "Update Changes" : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="mt-12 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <ThankYouContentView data={formData} tableNumber={tableNumber} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <ThankYouContentView data={displayData} tableNumber={tableNumber} />
      {isAdmin && (
        <button
          onClick={() => setIsEditing(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
        >
          <span className="mr-2">✏️</span> Edit Page
        </button>
      )}
    </div>
  );
}

function ThankYouContentView({ data, tableNumber }) {
  const displayData = data || {
    title: "Thanks for dining with us!",
    subtitle: "We hope you enjoyed your meal and experience.",
    googleReviewLink: "https://www.google.com/maps",
    websiteLink: "/",
    backgroundColor: "from-gray-50 to-gray-100",
    textColor: "text-gray-800",
    buttonColor: "from-blue-600 to-indigo-700",
  };

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br ${displayData.backgroundColor} flex flex-col items-center justify-center p-6`}
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
          <h1 className={`text-3xl font-bold ${displayData.textColor} mb-2`}>
            {displayData.title}
          </h1>
          <p className="text-gray-600">{displayData.subtitle}</p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className={`text-xl font-semibold ${displayData.textColor}`}>
            Share your experience
          </h2>
          <a
            href={displayData.googleReviewLink}
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
          {displayData.websiteLink.startsWith("http") ? (
            <a
              href={displayData.websiteLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block bg-gradient-to-r ${displayData.buttonColor} text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition`}
            >
              Visit Our Website
            </a>
          ) : (
            <Link
              to={displayData.websiteLink}
              className={`inline-block bg-gradient-to-r ${displayData.buttonColor} text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition`}
            >
              Visit Our Website
            </Link>
          )}
        </div>
      </div>

      {tableNumber && (
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">Table {tableNumber}</p>
        </div>
      )}
    </div>
  );
}
