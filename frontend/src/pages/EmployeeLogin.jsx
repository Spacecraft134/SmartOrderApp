import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../pages/Context/AuthContext";
import { motion } from "framer-motion";
import api from "./Utils/api";

export default function EmployeeLogin() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { employeeLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make the API call directly
      const response = await api.post("/api/employee/login", {
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      console.log("Login response:", response.data);

      if (response.data.token && response.data.user) {
        // Save token and user data to context/localStorage
        const { token, user } = response.data;

        // Update auth context with employee data
        const { success, error } = await employeeLogin({
          username: credentials.username.trim(),
          password: credentials.password.trim(),
        });

        if (success) {
          toast.success(`Welcome back, ${user.name}!`);

          // Role-based navigation
          switch (user.role) {
            case "WAITER":
              navigate("/waiter-dashboard");
              break;
            case "KITCHEN":
              navigate("/kitchen-dashboard");
              break;
            case "ADMIN":
              navigate("/admin-dashboard");
              break;
            default:
              // Fallback for any unexpected roles
              navigate("/employee-dashboard");
              break;
          }
        } else {
          toast.error(error || "Login failed");
        }
      } else {
        toast.error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login Error:", error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error("Invalid username or password");
      } else if (error.response?.status === 403) {
        toast.error("Account is inactive or unauthorized");
      } else {
        toast.error(
          error.response?.data?.message || "Login failed. Please try again."
        );
      }
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
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
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
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
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
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>

          <div className="text-center text-gray-400 text-sm mt-4">
            Forgot your password?{" "}
            <a href="#" className="text-cyan-400 hover:text-cyan-300">
              Reset here
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
