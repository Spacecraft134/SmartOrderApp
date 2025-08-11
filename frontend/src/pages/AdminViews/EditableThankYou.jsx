import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../Context/AuthContext";
import api from "../Utils/api"; // Use your existing configured api instance

export function EditableThankYou() {
  const { user } = useAuth(); // Remove authToken since we're using the configured api instance
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

  useEffect(() => {
    console.log("Current user object:", user);
    console.log("Restaurant ID:", user?.restaurantId);
    console.log("User token:", user?.token);

    const fetchThankYouPage = async () => {
      if (!user?.restaurantId) {
        console.error("No restaurantId available");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(
          `/api/thank-you-content/restaurant/${user.restaurantId}`
        );
        console.log("Fetched data:", res.data);

        if (res.data) {
          // Clean the data to only include the fields we need for the form
          const cleanData = {
            id: res.data.id,
            title: res.data.title,
            subtitle: res.data.subtitle,
            googleReviewLink: res.data.googleReviewLink,
            websiteLink: res.data.websiteLink,
            backgroundColor: res.data.backgroundColor,
            textColor: res.data.textColor,
            buttonColor: res.data.buttonColor,
          };
          setFormData(cleanData);
        }
      } catch (error) {
        console.error("Error fetching thank you page:", error);
        console.error("Error response:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else if (error.response?.status === 404) {
          // This is expected for new restaurants - use default values
          console.log("No existing thank you page found, using defaults");
        } else {
          toast.error("Failed to load thank you page settings");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchThankYouPage();
  }, [user?.restaurantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      title: formData.title,
      subtitle: formData.subtitle,
      googleReviewLink: formData.googleReviewLink,
      websiteLink: formData.websiteLink,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      buttonColor: formData.buttonColor,
      restaurant: { id: user.restaurantId },
    };

    try {
      const url = formData.id
        ? `http://localhost:8080/api/thank-you-content/${formData.id}`
        : "http://localhost:8080/api/thank-you-content";

      const method = formData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // <-- Add this!
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      toast.success("Thank You page saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error saving Thank You page");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customize Thank You Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Review Link
            </label>
            <input
              type="url"
              name="googleReviewLink"
              value={formData.googleReviewLink}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website Link
            </label>
            <input
              type="url"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="from-blue-600 to-indigo-700">Blue-Indigo</option>
              <option value="from-green-600 to-teal-700">Green-Teal</option>
              <option value="from-red-600 to-pink-700">Red-Pink</option>
              <option value="from-yellow-600 to-amber-700">Yellow-Amber</option>
              <option value="from-purple-600 to-violet-700">
                Purple-Violet
              </option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div
          className={`bg-gradient-to-br ${formData.backgroundColor} p-6 rounded-lg`}
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center mx-auto">
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
              <h1 className={`text-3xl font-bold ${formData.textColor} mb-2`}>
                {formData.title || "Thanks for dining with us!"}
              </h1>
              <p className="text-gray-600">
                {formData.subtitle ||
                  "We hope you enjoyed your meal and experience."}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <h2 className={`text-xl font-semibold ${formData.textColor}`}>
                Share your experience
              </h2>

              <a
                href={formData.googleReviewLink || "#"}
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
              <a
                href={formData.websiteLink || "#"}
                className={`inline-block bg-gradient-to-r ${formData.buttonColor} text-white px-6 py-3 rounded-lg font-semibold shadow hover:shadow-lg transition`}
              >
                Visit Our Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
