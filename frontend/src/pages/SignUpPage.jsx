import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../pages/Utils/api";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    restaurantName: "",
    restaurantCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "gray",
  });
  const navigate = useNavigate();

  // Check if admin exists on component mount
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await api.get("/api/auth/check-admin-exists");
        if (response.data.exists) {
          setAdminExists(true);
        }
      } catch (err) {
        console.error("Error checking admin existence:", err);
      }
    };

    checkAdminExists();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let message = "";
    let color = "gray";

    switch (score) {
      case 0:
      case 1:
        message = "Very Weak";
        color = "red";
        break;
      case 2:
        message = "Weak";
        color = "orange";
        break;
      case 3:
        message = "Moderate";
        color = "yellow";
        break;
      case 4:
        message = "Strong";
        color = "green";
        break;
      case 5:
        message = "Very Strong";
        color = "green";
        break;
      default:
        message = "";
    }

    setPasswordStrength({ score, message, color });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (passwordStrength.score < 3) {
      setError("Password is too weak");
      return false;
    }

    if (!/^[A-Za-z0-9\-]{4,20}$/.test(formData.restaurantCode)) {
      setError(
        "Restaurant code must be 4-20 alphanumeric characters or hyphens"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/register-admin", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantCode: formData.restaurantCode,
      });

      toast.success("Admin registration successful!");
      navigate("/admin", {
        state: {
          restaurantName: response.data.restaurantName,
        },
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";

      if (err.response?.status === 409) {
        setAdminExists(true);
        toast.error(
          <div>
            An admin already exists. Please{" "}
            <Link to="/login" className="underline">
              log in
            </Link>{" "}
            instead.
          </div>,
          { autoClose: 5000 }
        );
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordStrengthIndicator = () => {
    if (!formData.password) return null;

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="text-xs font-medium"
            style={{ color: passwordStrength.color }}
          >
            Strength: {passwordStrength.message}
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${(passwordStrength.score / 5) * 100}%`,
              backgroundColor: passwordStrength.color,
            }}
          ></div>
        </div>
      </div>
    );
  };

  if (adminExists) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#0a1129] text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center mb-4">
            <span className="font-bold text-xl text-white">DF</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Admin Already Registered</h1>
          <p className="text-gray-300 mb-6">
            An admin account already exists. Please log in instead.
          </p>
          <Link
            to="/login"
            className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            Go to Login Page
          </Link>
          <div className="mt-4">
            <Link
              to="/"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              ← Back to Home Page
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Create Admin Account</h1>
          <p className="text-gray-400 mt-2">
            Setup your restaurant management system
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  placeholder="My Restaurant"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Restaurant Code
                </label>
                <input
                  type="text"
                  name="restaurantCode"
                  value={formData.restaurantCode}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  placeholder="restaurant-123"
                  required
                  pattern="[A-Za-z0-9\-]{4,20}"
                  title="4-20 alphanumeric characters or hyphens"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2 text-sm">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
                required
                minLength="8"
              />
              <PasswordStrengthIndicator />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
                required
                minLength="8"
              />
              {formData.password && formData.confirmPassword && (
                <p
                  className={`text-xs mt-2 ${
                    formData.password === formData.confirmPassword
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formData.password === formData.confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/20 mb-4 ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? "Creating Admin Account..." : "Create Admin Account"}
            </motion.button>

            <div className="text-center text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
