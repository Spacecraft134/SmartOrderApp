import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess("Password updated successfully");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#0a1129] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center mb-4"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="font-bold text-xl text-white">DF</span>
          </motion.div>
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-gray-400 mt-2">
            Create a new password for your account
          </p>
        </div>

        <motion.div
          className="bg-gradient-to-b from-gray-900/80 to-gray-900 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-300 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label className="block text-gray-300 mb-2 text-sm">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
                required
                minLength="8"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
                required
                minLength="8"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/20 mb-4 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
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
                  Updating...
                </span>
              ) : (
                "Reset Password"
              )}
            </motion.button>

            <div className="text-center text-gray-400 text-sm">
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
