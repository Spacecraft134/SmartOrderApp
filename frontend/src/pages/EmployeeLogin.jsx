import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiArrowLeft, FiRefreshCw, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../pages/Context/AuthContext";
import { motion } from "framer-motion";

export default function EmployeeLogin() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { employeeLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { success, error, user } = await employeeLogin({
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      if (success && user) {
        switch (user.role) {
          case "WAITER":
            navigate("/employee/waiter-dashboard");
            break;
          case "KITCHEN":
            navigate("/employee/kitchen-dashboard");
            break;
          default:
            navigate("/error");
            break;
        }
      } else {
        const errorMessage = error || "Login failed";
        setError(errorMessage);
        toast.error(`Login failed: ${errorMessage}`);
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          "Invalid credentials";
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
            <FiLogIn className="text-2xl" />
          </motion.div>
          <h1 className="text-3xl font-bold">Employee Portal Sign In</h1>
          <p className="text-gray-400 mt-2">Access your restaurant workspace</p>
        </div>

        <motion.div
          className="bg-gradient-to-b from-gray-900/80 to-gray-900 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm"
            >
              <div className="flex items-center">
                <FiX className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="username"
                className="block text-gray-300 mb-2 text-sm"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`w-full p-3.5 rounded-xl bg-white/5 border ${
                  error ? "border-red-500/50" : "border-white/10"
                } focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => {
                  setCredentials({ ...credentials, username: e.target.value });
                  setError(null);
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-300 mb-2 text-sm"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`w-full p-3.5 rounded-xl bg-white/5 border ${
                  error ? "border-red-500/50" : "border-white/10"
                } focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => {
                  setCredentials({ ...credentials, password: e.target.value });
                  setError(null);
                }}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/20 ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <FiRefreshCw className="animate-spin mr-2" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <div className="flex justify-between items-center mt-4">
            <Link
              to="/employee/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Forgot password?
            </Link>
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center"
            >
              <FiArrowLeft className="mr-1" />
              Admin Login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
