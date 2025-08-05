import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../pages/Context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { success, role } = await login({ username: email, password });

    if (success) {
      const redirectMap = {
        ADMIN: "/admin",
        WAITER: "/waiter-dashboard",
        KITCHEN: "/kitchen-dashboard",
        GUEST: "/customer/menu",
      };
      navigate(redirectMap[role] || "/");
    } else {
      setError("Login failed. Please try again.");
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
          <h1 className="text-3xl font-bold">Sign in to DineFlow</h1>
          <p className="text-gray-400 mt-2">
            Enter your credentials to access your dashboard
          </p>
        </div>

        <Link
          to="/"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition mb-4 inline-block"
        >
          ← Back to Home Page
        </Link>

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

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-gray-300 mb-2 text-sm">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-300 text-sm">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/20 mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>

            <div className="text-center text-gray-400 text-sm mt-6">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Create account
              </Link>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
