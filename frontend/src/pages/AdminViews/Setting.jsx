import { useState, useEffect } from "react";
import { FiUser, FiLock, FiCheck, FiMail } from "react-icons/fi";

export function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        const storedToken = localStorage.getItem("token");

        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData({
            ...parsedData,
            token: storedToken || parsedData.token,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData?.email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reset email");
      }

      const data = await response.json();
      setSuccess(
        data.message ||
          "Password reset link has been sent to your email address."
      );
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Unable to connect to server. Please try again later."
          : err.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
      </div>

      <div className="flex mb-8 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("account");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === "account"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Account
        </button>
        <button
          onClick={() => {
            setActiveTab("password");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === "password"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Password
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === "account" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiUser className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={userData?.email || "Loading..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Role: {userData?.role || "Loading..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiLock className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Reset Password</h2>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiAlertTriangle className="text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiMail className="text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 mb-2">
                    We'll send a password reset link to your registered email.
                  </p>
                  <p className="text-xs text-blue-600">
                    The link will be valid for 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userData?.email || "Loading..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  readOnly
                />
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={isLoading || !userData?.email}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium ${
                  isLoading || !userData?.email
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
