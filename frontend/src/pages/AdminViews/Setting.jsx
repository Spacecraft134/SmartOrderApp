import { useState, useEffect } from "react";
import {
  FiUser,
  FiLock,
  FiCheck,
  FiTrash2,
  FiAlertTriangle,
  FiMail,
} from "react-icons/fi";

export function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userData, setUserData] = useState(null);

  // Password reset states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Get user data from localStorage
    try {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error("Error reading userData from localStorage:", error);
      // Fallback data for demonstration (since localStorage isn't available in artifacts)
    }
  }, []);

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log(
        "Sending request to:",
        "http://localhost:8080/api/auth/forgot-password"
      );
      console.log("With email:", userData?.email);

      // IMPORTANT: Using absolute URL to Spring Boot backend
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

      console.log("Response status:", response.status);
      console.log("Response OK:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Your backend always returns success: true for security reasons
      if (data.success) {
        setSuccess(
          data.message ||
            "Password reset link has been sent to your email address. Please check your inbox and spam folder."
        );
      } else {
        setError(
          data.message || "Failed to send reset email. Please try again."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.message.includes("Failed to fetch")) {
        setError(
          "Unable to connect to server. Please ensure the backend is running on port 8080."
        );
      } else {
        setError(
          "Network error occurred. Please check your connection and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountTermination = async () => {
    try {
      // Replace with your actual API call for account termination
      const response = await fetch(
        "http://localhost:8080/api/auth/terminate-account",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          "Account has been successfully terminated. You will be logged out."
        );
        // Clear localStorage and redirect to login
        localStorage.removeItem("userData");
        window.location.href = "/login";
      } else {
        alert(data.message || "Failed to terminate account. Please try again.");
      }
    } catch (err) {
      alert("Network error occurred. Please try again.");
      console.error("Account termination error:", err);
    }

    setShowDeleteConfirm(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm">
          <FiCheck className="mr-2" /> Save Changes
        </button>
      </div>

      {/* Settings Navigation */}
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

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Account Tab */}
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
                  placeholder="Enter username or email"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Role: {userData?.role || "Loading..."} | Name:{" "}
                  {userData?.name || "Loading..."}
                </p>
              </div>
            </div>

            {/* Account Termination Section */}
            <div className="border-t pt-6 mt-8">
              <div className="flex items-center mb-4">
                <FiAlertTriangle className="text-red-500 mr-3 text-lg" />
                <h3 className="text-lg font-semibold text-red-600">
                  Danger Zone
                </h3>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">
                  Terminate Account
                </h4>
                <p className="text-sm text-red-600 mb-3">
                  Once you delete your account, there is no going back. This
                  action cannot be undone. All your data will be permanently
                  deleted.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center text-sm font-medium"
                >
                  <FiTrash2 className="mr-2" />
                  Terminate Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <FiLock className="text-blue-500 mr-3 text-lg" />
              <h2 className="text-lg font-semibold">Reset Password</h2>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
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
                    We'll send a secure password reset link to your registered
                    email address. Follow the instructions in the email to
                    create a new password.
                  </p>
                  <p className="text-xs text-blue-600">
                    The reset link will be valid for 1 hour. Please check your
                    spam folder if you don't see the email.
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
                <p className="text-xs text-gray-500 mt-1">
                  This is the email associated with your account
                </p>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={isLoading || !userData?.email}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm font-medium ${
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
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <FiLock className="mr-2" />
                    Send Reset Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-red-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-red-600">
                Confirm Account Termination
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you absolutely sure you want to terminate your account? This
                action is permanent and cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700 font-medium">
                  The following will be permanently deleted:
                </p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  <li>Your profile and account data</li>
                  <li>All restaurant data and settings</li>
                  <li>Order history and analytics</li>
                  <li>All associated files and images</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountTermination}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Terminate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
